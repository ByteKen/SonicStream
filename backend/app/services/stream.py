"""
Service layer for audio stream extraction.

Extraction strategy (designed for cloud servers where YouTube blocks yt-dlp):
  1. Piped API — public YouTube-frontend instances that extract streams
     server-side. Works reliably from cloud/datacenter IPs.
  2. yt-dlp fallback — tried if all Piped instances fail.
"""

import os
import time
import logging
import threading
from datetime import datetime, timezone, timedelta
from pathlib import Path

import httpx
import yt_dlp

from app.schemas.stream import StreamInfo

logger = logging.getLogger(__name__)

# ── URL cache ──────────────────────────────────────────
_CACHE_TTL = 4 * 3600  # 4 hours (conservative; URLs expire ~6 hrs)
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


# ── Piped API instances (tried in order) ───────────────
# These are public Piped API servers. If one goes down, we try the next.
PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.yt",
    "https://pipedapi.adminforge.de",
    "https://pipedapi.in.projectsegfau.lt",
    "https://api.piped.privacydev.net",
    "https://pipedapi.darkness.services",
]

_piped_http = httpx.Client(timeout=15.0, follow_redirects=True)


def _try_piped(video_id: str) -> StreamInfo | None:
    """
    Try extracting an audio stream URL from Piped API instances.
    Piped is a privacy-friendly YouTube frontend that handles extraction
    server-side, so it bypasses YouTube's bot detection on our cloud IP.
    """
    for instance in PIPED_INSTANCES:
        try:
            resp = _piped_http.get(f"{instance}/streams/{video_id}")
            if resp.status_code != 200:
                logger.warning("Piped %s returned %d for %s", instance, resp.status_code, video_id)
                continue

            data = resp.json()

            # Find best audio stream
            audio_streams = data.get("audioStreams") or []
            if not audio_streams:
                logger.warning("Piped %s: no audioStreams for %s", instance, video_id)
                continue

            # Sort by bitrate (highest first), prefer m4a/mp4
            def _sort_key(s):
                bitrate = s.get("bitrate", 0)
                # Prefer m4a/mp4 for mobile compatibility
                is_m4a = 1 if "m4a" in s.get("mimeType", "") or "mp4" in s.get("mimeType", "") else 0
                return (is_m4a, bitrate)

            audio_streams.sort(key=_sort_key, reverse=True)
            best = audio_streams[0]
            stream_url = best.get("url")

            if not stream_url:
                logger.warning("Piped %s: no URL in best stream for %s", instance, video_id)
                continue

            # Extract codec from mimeType like "audio/mp4; codecs=\"mp4a.40.2\""
            mime = best.get("mimeType", "")
            codec = None
            if "codecs=" in mime:
                codec = mime.split('codecs="')[1].rstrip('"') if 'codecs="' in mime else None

            duration = data.get("duration")

            expires_at = (
                datetime.now(timezone.utc) + timedelta(hours=6)
            ).isoformat()

            result = StreamInfo(
                video_id=video_id,
                title=data.get("title", "Unknown"),
                url=stream_url,
                codec=codec or best.get("codec"),
                quality=f"{best.get('bitrate', 0) // 1000}kbps" if best.get("bitrate") else None,
                filesize=best.get("contentLength"),
                duration_seconds=int(duration) if duration else None,
                thumbnail=data.get("thumbnailUrl"),
                expires_at=expires_at,
            )

            logger.info("Piped: extracted %s via %s", video_id, instance)
            return result

        except Exception as exc:
            logger.warning("Piped %s failed for %s: %s", instance, video_id, exc)
            continue

    return None


# ── yt-dlp fallback ────────────────────────────────────
_COOKIE_FILE = Path(__file__).resolve().parents[2] / "cookies.txt"
_BROWSER = os.getenv("YT_COOKIE_BROWSER", "")

_BASE_OPTS: dict = {
    "format": "bestaudio[ext=m4a]/bestaudio/best",
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
    "extract_flat": False,
    "noplaylist": True,
    "extractor_args": {
        "youtube": {
            "player_client": ["ios", "web"],
        },
    },
    "http_headers": {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    },
}


def _opts_no_cookies() -> dict:
    return {**_BASE_OPTS}


def _opts_with_cookies() -> dict | None:
    if _BROWSER:
        return {**_BASE_OPTS, "cookiesfrombrowser": (_BROWSER,)}
    if _COOKIE_FILE.is_file():
        return {**_BASE_OPTS, "cookiefile": str(_COOKIE_FILE)}
    return None


def _try_ytdlp(video_id: str) -> StreamInfo | None:
    """Fallback: use yt-dlp directly (may be blocked on cloud IPs)."""
    music_url = f"https://music.youtube.com/watch?v={video_id}"
    yt_url = f"https://www.youtube.com/watch?v={video_id}"

    attempts: list[tuple[str, dict]] = [
        (music_url, _opts_no_cookies()),
        (yt_url, _opts_no_cookies()),
    ]
    cookie_opts = _opts_with_cookies()
    if cookie_opts:
        attempts.append((music_url, cookie_opts))
        attempts.append((yt_url, cookie_opts))

    for url, opts in attempts:
        try:
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

        expires_at = (
            datetime.now(timezone.utc) + timedelta(hours=6)
        ).isoformat()

        result = StreamInfo(
            video_id=video_id,
            title=info.get("title", "Unknown"),
            url=stream_url,
            codec=info.get("acodec"),
            quality=info.get("format_note"),
            filesize=info.get("filesize") or info.get("filesize_approx"),
            duration_seconds=int(info["duration"]) if info.get("duration") else None,
            thumbnail=info.get("thumbnail"),
            expires_at=expires_at,
        )

        logger.info("yt-dlp: extracted %s via %s", video_id, url)
        return result

    return None


# ── Public API ─────────────────────────────────────────
def extract_stream(video_id: str) -> StreamInfo:
    """
    Extract the best audio stream URL for *video_id*.

    Strategy:
      1. Check cache.
      2. Try Piped API instances (works from cloud servers).
      3. Fallback to yt-dlp (may fail on datacenter IPs).

    Returns StreamInfo. Raises RuntimeError on total failure.
    """
    cached = _get_cached(video_id)
    if cached:
        return cached

    # Primary: Piped API (reliable on cloud servers)
    result = _try_piped(video_id)

    # Fallback: yt-dlp
    if not result:
        logger.info("Piped failed for %s, falling back to yt-dlp", video_id)
        result = _try_ytdlp(video_id)

    if not result:
        raise RuntimeError(
            f"All extraction attempts failed for {video_id}. "
            "Neither Piped API nor yt-dlp could resolve an audio stream."
        )

    _set_cached(video_id, result)
    return result
