"""
Service layer for yt-dlp audio stream extraction.
Uses yt-dlp's Python API directly (no subprocess).

Extraction strategy:
  1. Try music.youtube.com URL with best anti-bot options.
  2. If that fails, try youtube.com.
  3. If cookies are configured, retry both with cookies.
"""

import os
import time
import logging
import threading
from datetime import datetime, timezone, timedelta
from pathlib import Path

import yt_dlp

from app.schemas.stream import StreamInfo

logger = logging.getLogger(__name__)

# ── URL cache ──────────────────────────────────────────
_CACHE_TTL = 5 * 3600  # 5 hours (YT URLs expire after ~6 hrs)
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


# ── yt-dlp option builders ─────────────────────────────
_COOKIE_FILE = Path(__file__).resolve().parents[2] / "cookies.txt"
_BROWSER = os.getenv("YT_COOKIE_BROWSER", "")

_BASE_OPTS: dict = {
    "format": "bestaudio[ext=m4a]/bestaudio/best",
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
    "extract_flat": False,
    "noplaylist": True,
    # Anti-bot / fingerprinting options
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
    """Plain options — no authentication."""
    return {**_BASE_OPTS}


def _opts_with_cookies() -> dict | None:
    """Options with cookies, or None if no cookie source is available."""
    if _BROWSER:
        return {**_BASE_OPTS, "cookiesfrombrowser": (_BROWSER,)}
    if _COOKIE_FILE.is_file():
        return {**_BASE_OPTS, "cookiefile": str(_COOKIE_FILE)}
    return None


# ── Core extraction ────────────────────────────────────
def _try_extract(video_id: str, url: str, opts: dict) -> dict | None:
    """Attempt extraction; return info dict or None on failure."""
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return info if info else None
    except Exception as exc:
        logger.warning("yt-dlp attempt failed (%s): %s", url, exc)
        return None


def extract_stream(video_id: str) -> StreamInfo:
    """
    Extract the best audio-only stream URL for *video_id*.

    Strategy (first success wins):
      1. music.youtube.com — no cookies (works for most content).
      2. youtube.com — no cookies.
      3. music.youtube.com — with cookies (if configured).
      4. youtube.com — with cookies (if configured).

    Returns StreamInfo.  Raises RuntimeError on total failure.
    """
    cached = _get_cached(video_id)
    if cached:
        return cached

    music_url = f"https://music.youtube.com/watch?v={video_id}"
    yt_url = f"https://www.youtube.com/watch?v={video_id}"

    # Build the list of (url, opts) attempts
    attempts: list[tuple[str, dict]] = [
        (music_url, _opts_no_cookies()),
        (yt_url, _opts_no_cookies()),
    ]
    cookie_opts = _opts_with_cookies()
    if cookie_opts:
        attempts.append((music_url, cookie_opts))
        attempts.append((yt_url, cookie_opts))

    info = None
    for url, opts in attempts:
        info = _try_extract(video_id, url, opts)
        if info:
            logger.info("yt-dlp: extracted %s via %s", video_id, url)
            break

    if not info:
        raise RuntimeError(
            f"All extraction attempts failed for {video_id}. "
            "Ensure the videoId is valid and, if needed, configure "
            "YT_COOKIE_BROWSER or place a cookies.txt in backend/."
        )

    # ── Resolve the audio stream URL ────────────────────
    stream_url: str | None = info.get("url")
    if not stream_url:
        for fmt in info.get("requested_formats") or []:
            if fmt.get("vcodec") == "none" or fmt.get("acodec") != "none":
                stream_url = fmt.get("url")
                break

    if not stream_url:
        raise RuntimeError(f"No audio URL found in extraction result for {video_id}")

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

    _set_cached(video_id, result)
    return result
