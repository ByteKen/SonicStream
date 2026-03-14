"""
Service layer for audio stream extraction.

Extraction strategy:
  1. Piped API instances (when available — they go up and down).
  2. yt-dlp with cookies (most reliable for cloud servers).
  3. yt-dlp without cookies (works from residential IPs).

To make yt-dlp work on Render (cloud), you MUST provide cookies:
  - Upload a cookies.txt via the /admin/cookies endpoint, OR
  - Place a cookies.txt file in the backend/ directory.

How to export cookies:
  1. Install a browser extension like "Get cookies.txt LOCALLY"
  2. Go to youtube.com (stay logged OUT for best results)
  3. Export cookies and upload via the admin endpoint.
"""

import os
import time
import logging
import threading
import tempfile
from datetime import datetime, timezone, timedelta
from pathlib import Path

import httpx
import yt_dlp

from app.schemas.stream import StreamInfo

logger = logging.getLogger(__name__)

# ── URL cache ──────────────────────────────────────────
_CACHE_TTL = 4 * 3600  # 4 hours
_cache: dict[str, tuple[StreamInfo, float]] = {}
_cache_lock = threading.Lock()


def _get_cached(video_id: str) -> StreamInfo | None:
    with _cache_lock:
        entry = _cache.get(video_id)
        if entry and time.time() - entry[1] < _CACHE_TTL:
            return entry[0]
        _cache.pop(video_id, None)
        return None


def _set_cached(video_id: str, info: StreamInfo) -> None:
    with _cache_lock:
        _cache[video_id] = (info, time.time())


# ── Piped API instances ────────────────────────────────
# These go up and down; we try them optimistically.
PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.leptons.xyz",
    "https://pipedapi.reallyaweso.me",
    "https://pipedapi.adminforge.de",
    "https://piped-api.codespace.cz",
    "https://pipedapi.orangenet.cc",
    "https://api.piped.private.coffee",
    "https://api.piped.yt",
]

_piped_http = httpx.Client(timeout=12.0, follow_redirects=True)

# Track which instances are working to avoid wasting time
_piped_healthy: dict[str, float] = {}  # instance -> last success time
_piped_unhealthy: dict[str, float] = {}  # instance -> last failure time
_PIPED_RETRY_AFTER = 300  # retry an unhealthy instance after 5 mins


def _try_piped(video_id: str) -> StreamInfo | None:
    """Try extracting from Piped API instances."""
    now = time.time()

    # Sort: healthy first, then ones not recently failed
    def _priority(inst):
        if inst in _piped_healthy:
            return (0, -_piped_healthy[inst])
        if inst in _piped_unhealthy:
            if now - _piped_unhealthy[inst] < _PIPED_RETRY_AFTER:
                return (2, 0)  # Skip recently failed
            return (1, 0)
        return (1, 0)

    sorted_instances = sorted(PIPED_INSTANCES, key=_priority)

    for instance in sorted_instances:
        # Skip recently failed instances
        if instance in _piped_unhealthy:
            if now - _piped_unhealthy[instance] < _PIPED_RETRY_AFTER:
                continue

        try:
            resp = _piped_http.get(f"{instance}/streams/{video_id}")
            if resp.status_code != 200:
                logger.debug("Piped %s returned %d", instance, resp.status_code)
                _piped_unhealthy[instance] = now
                continue

            data = resp.json()
            audio_streams = data.get("audioStreams") or []
            if not audio_streams:
                _piped_unhealthy[instance] = now
                continue

            # Sort by bitrate, prefer m4a/mp4
            def _sort_key(s):
                bitrate = s.get("bitrate", 0)
                is_m4a = 1 if "m4a" in s.get("mimeType", "") or "mp4" in s.get("mimeType", "") else 0
                return (is_m4a, bitrate)

            audio_streams.sort(key=_sort_key, reverse=True)
            best = audio_streams[0]
            stream_url = best.get("url")

            if not stream_url:
                _piped_unhealthy[instance] = now
                continue

            mime = best.get("mimeType", "")
            codec = None
            if 'codecs="' in mime:
                codec = mime.split('codecs="')[1].rstrip('"')

            result = StreamInfo(
                video_id=video_id,
                title=data.get("title", "Unknown"),
                url=stream_url,
                codec=codec or best.get("codec"),
                quality=f"{best.get('bitrate', 0) // 1000}kbps" if best.get("bitrate") else None,
                filesize=best.get("contentLength"),
                duration_seconds=int(data["duration"]) if data.get("duration") else None,
                thumbnail=data.get("thumbnailUrl"),
                expires_at=(datetime.now(timezone.utc) + timedelta(hours=6)).isoformat(),
            )

            _piped_healthy[instance] = now
            _piped_unhealthy.pop(instance, None)
            logger.info("Piped: extracted %s via %s", video_id, instance)
            return result

        except Exception as exc:
            logger.debug("Piped %s error: %s", instance, exc)
            _piped_unhealthy[instance] = now
            continue

    return None


# ── yt-dlp extraction ──────────────────────────────────
COOKIE_FILE = Path(tempfile.gettempdir()) / "youtube_cookies.txt"
_BROWSER = os.getenv("YT_COOKIE_BROWSER", "")

# Restore cookies from env var on startup (survives Render redeploys)
_COOKIE_ENV = os.getenv("YOUTUBE_COOKIES", "")
if _COOKIE_ENV and not COOKIE_FILE.is_file():
    # Strip Windows \r line-endings — they corrupt the Netscape format on Linux
    clean = _COOKIE_ENV.replace("\r\n", "\n").replace("\r", "\n")
    COOKIE_FILE.write_text(clean)
    logger.info("Restored cookies from YOUTUBE_COOKIES env var (%d bytes)", len(clean))

_BASE_OPTS: dict = {
    "format": "bestaudio[ext=m4a]/bestaudio/best",
    "quiet": False,
    "no_warnings": False,
    "skip_download": True,
    "extract_flat": False,
    "noplaylist": True,
    "extractor_args": {
        "youtube": {
            # 'tv' client bypasses PO Token requirement on datacenter IPs
            "player_client": ["tv"],
        },
    },
}


def _build_opts(use_cookies: bool = False) -> dict:
    opts = {**_BASE_OPTS}
    if use_cookies:
        if _BROWSER:
            opts["cookiesfrombrowser"] = (_BROWSER,)
        elif COOKIE_FILE.is_file():
            opts["cookiefile"] = str(COOKIE_FILE)
        else:
            return opts  # No cookies available
    return opts


def _try_ytdlp(video_id: str) -> StreamInfo | None:
    """Use yt-dlp to extract audio stream URL."""
    urls = [
        f"https://music.youtube.com/watch?v={video_id}",
        f"https://www.youtube.com/watch?v={video_id}",
    ]

    has_cookies = bool(_BROWSER) or COOKIE_FILE.is_file()
    logger.info(
        "yt-dlp attempt for %s | cookies_file_exists=%s | cookie_path=%s",
        video_id, COOKIE_FILE.is_file(), COOKIE_FILE,
    )

    # Build attempts: with cookies first (if available), then without
    attempts: list[tuple[str, dict]] = []
    if has_cookies:
        for url in urls:
            attempts.append((url, _build_opts(use_cookies=True)))
    for url in urls:
        attempts.append((url, _build_opts(use_cookies=False)))

    for url, opts in attempts:
        try:
            logger.info("yt-dlp trying %s (cookiefile=%s)", url, opts.get('cookiefile', 'NONE'))
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if not info:
                    continue
        except Exception as exc:
            logger.warning("yt-dlp attempt failed (%s): %s", url, exc)
            continue

        stream_url: str | None = info.get("url")
        if not stream_url:
            for fmt in info.get("requested_formats") or []:
                if fmt.get("vcodec") == "none" or fmt.get("acodec") != "none":
                    stream_url = fmt.get("url")
                    break

        if not stream_url:
            continue

        result = StreamInfo(
            video_id=video_id,
            title=info.get("title", "Unknown"),
            url=stream_url,
            codec=info.get("acodec"),
            quality=info.get("format_note"),
            filesize=info.get("filesize") or info.get("filesize_approx"),
            duration_seconds=int(info["duration"]) if info.get("duration") else None,
            thumbnail=info.get("thumbnail"),
            expires_at=(datetime.now(timezone.utc) + timedelta(hours=6)).isoformat(),
        )

        logger.info("yt-dlp: extracted %s via %s", video_id, url)
        return result

    return None


# ── Public API ─────────────────────────────────────────
def extract_stream(video_id: str) -> StreamInfo:
    """
    Extract audio stream URL. Strategy:
      1. Cache check.
      2. Piped API (fast, works when instances are healthy).
      3. yt-dlp with cookies (reliable if cookies.txt provided).
      4. yt-dlp without cookies (works from residential IPs only).

    Raises RuntimeError on total failure.
    """
    cached = _get_cached(video_id)
    if cached:
        return cached

    # 1. Try Piped
    result = _try_piped(video_id)

    # 2. Fallback to yt-dlp
    if not result:
        logger.info("Piped unavailable for %s, trying yt-dlp", video_id)
        result = _try_ytdlp(video_id)

    if not result:
        has_cookies = bool(_BROWSER) or COOKIE_FILE.is_file()
        cookie_hint = (
            "" if has_cookies else
            " HINT: Upload a cookies.txt via POST /admin/cookies to fix this."
        )
        raise RuntimeError(
            f"All extraction methods failed for {video_id}. "
            f"Piped instances may be down and YouTube is blocking this server's IP.{cookie_hint}"
        )

    _set_cached(video_id, result)
    return result
