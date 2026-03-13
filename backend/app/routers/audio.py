"""
/audio router — reverse-proxy that streams audio bytes to the client.

Why proxy?
  1. Hides raw stream URLs from the mobile app.
  2. Lets us inject Range-header support for seeking.
  3. Works around CORS / referrer issues on the client.
  4. Handles both YouTube CDN and Piped proxy URLs transparently.
"""

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.services.stream import extract_stream

router = APIRouter(tags=["Audio"])

# Reusable async HTTP client (connection-pooled) with generous timeouts
_http_client = httpx.AsyncClient(
    timeout=httpx.Timeout(connect=15.0, read=60.0, write=10.0, pool=15.0),
    follow_redirects=True,
)


@router.get("/audio/{video_id}")
async def audio_proxy(video_id: str, request: Request):
    """
    Stream audio bytes for a given videoId.

    Supports HTTP Range requests so the mobile player can seek.
    The client hits this endpoint directly as the audio source URL
    in react-native-track-player.
    """
    # 1. Resolve the direct audio URL (cached for ~4 hrs)
    try:
        stream_info = extract_stream(video_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    upstream_url = stream_info.url

    # 2. Forward the client's Range header (if any) to upstream
    upstream_headers: dict[str, str] = {
        # Some CDNs need a user-agent
        "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",
    }
    range_header = request.headers.get("range")
    if range_header:
        upstream_headers["Range"] = range_header

    # 3. Open a streaming connection to the upstream URL
    try:
        upstream_resp = await _http_client.send(
            _http_client.build_request(
                "GET", upstream_url, headers=upstream_headers
            ),
            stream=True,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to connect to upstream audio: {exc}",
        )

    # 4. Mirror status code (200 or 206 for partial content)
    status_code = upstream_resp.status_code
    if status_code not in (200, 206):
        await upstream_resp.aclose()
        raise HTTPException(
            status_code=502,
            detail=f"Upstream returned unexpected status {status_code}",
        )

    # 5. Build response headers for the client
    response_headers: dict[str, str] = {}

    content_type = upstream_resp.headers.get("content-type", "audio/mp4")
    content_length = upstream_resp.headers.get("content-length")
    content_range = upstream_resp.headers.get("content-range")
    accept_ranges = upstream_resp.headers.get("accept-ranges")

    if content_length:
        response_headers["Content-Length"] = content_length
    if content_range:
        response_headers["Content-Range"] = content_range
    if accept_ranges:
        response_headers["Accept-Ranges"] = accept_ranges
    else:
        response_headers["Accept-Ranges"] = "bytes"

    # 6. Stream bytes to the client
    async def _stream_generator():
        try:
            async for chunk in upstream_resp.aiter_bytes(chunk_size=64 * 1024):
                yield chunk
        finally:
            await upstream_resp.aclose()

    return StreamingResponse(
        content=_stream_generator(),
        status_code=status_code,
        media_type=content_type,
        headers=response_headers,
    )
