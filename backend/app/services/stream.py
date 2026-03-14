"""
Service layer for audio stream extraction.

Extraction strategy:
  1. Piped API instances (when available — they go up and down).
  2. yt-dlp with residential proxy (bypasses datacenter IP blocking).
  3. yt-dlp with cookies (fallback).
  4. yt-dlp plain (works from residential IPs only).

Environment variables:
  PROXY_URL  — residential proxy in format http://user:pass@host:port
  YOUTUBE_COOKIES — Netscape cookie file content (auto-restored on boot)
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

# ── In-memory stream cache ─────────────────────────────
_cache: dict[str, tuple[StreamInfo, float]] = {}
_cache_ttl = 3600  # 1 hour
_cache_lock = threading.Lock()


def _get_cached(video_id: str) -> StreamInfo | None:
    with _cache_lock:
        entry = _cache.get(video_id)
        if entry and time.time() - entry[1] < _cache_ttl:
            return entry[0]
        if entry:
            del _cache[video_id]
    return None


def _set_cached(video_id: str, info: StreamInfo) -> None:
    with _cache_lock:
        _cache[video_id] = (info, time.time())


# ── Piped instances ────────────────────────────────────
_PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.yt",
    "https://pipedapi.r4fo.com",
    "https://pipedapi.adminforge.de",
    "https://pipedapi.in.projectsegfau.lt",
    "https://api-piped.mha.fi",
    "https://piped-api.hostux.net",
    "https://watchapi.whatever.social",
]

_piped_unhealthy: dict[str, datetime] = {}
_PIPED_COOLDOWN = timedelta(minutes=5)


def _try_piped(video_id: str) -> StreamInfo | None:
    now = datetime.now(timezone.utc)
    for instance in _PIPED_INSTANCES:
        if instance in _piped_unhealthy:
            if now - _piped_unhealthy[instance] < _PIPED_COOLDOWN:
                continue
            else:
                del _piped_unhealthy[instance]

        url = f"{instance}/streams/{video_id}"
        try:
            r = httpx.get(url, timeout=8, follow_redirects=True)
            r.raise_for_status()
            data = r.json()

            audio = None
            for stream in data.get("audioStreams") or []:
                if stream.get("mimeType", "").startswith("audio/"):
                    if audio is None or stream.get("bitrate", 0) > audio.get("bitrate", 0):
                        audio = stream

            if not audio or not audio.get("url"):
                continue

            result = StreamInfo(
                video_id=video_id,
                title=data.get("title", "Unknown"),
                url=audio["url"],
                codec=audio.get("codec"),
                quality=audio.get("quality"),
                filesize=audio.get("contentLength"),
                duration_seconds=data.get("duration"),
                thumbnail=data.get("thumbnailUrl"),
                expires_at=(now + timedelta(hours=6)).isoformat(),
            )
            logger.info("Piped: extracted %s via %s", video_id, instance)
            return result

        except Exception as exc:
            logger.warning("Piped %s failed: %s", instance, exc)
            _piped_unhealthy[instance] = now
            continue

    return None


# ── yt-dlp extraction ──────────────────────────────────
COOKIE_FILE = Path(tempfile.gettempdir()) / "youtube_cookies.txt"
_BROWSER = os.getenv("YT_COOKIE_BROWSER", "")
_PROXY_URL = os.getenv("PROXY_URL", "")

# Restore cookies from env var on startup (survives Render redeploys)
_COOKIE_ENV = os.getenv("YOUTUBE_COOKIES", "")
if _COOKIE_ENV and not COOKIE_FILE.is_file():
    clean = _COOKIE_ENV.replace("\r\n", "\n").replace("\r", "\n")
    COOKIE_FILE.write_text(clean)
    logger.info("Restored cookies from YOUTUBE_COOKIES env var (%d bytes)", len(clean))


def _build_opts(*, use_cookies: bool = False, use_proxy: bool = False) -> dict:
    """Build yt-dlp options dict."""
    opts: dict = {
        "format": "bestaudio[ext=m4a]/bestaudio/best",
        "quiet": False,
        "no_warnings": False,
        "skip_download": True,
        "extract_flat": False,
        "noplaylist": True,
        "socket_timeout": 15,
        "extractor_args": {
            "youtube": {
                "player_client": ["tv"],
            },
        },
    }

    if use_proxy and _PROXY_URL:
        opts["proxy"] = _PROXY_URL

    if use_cookies:
        if _BROWSER:
            opts["cookiesfrombrowser"] = (_BROWSER,)
        elif COOKIE_FILE.is_file():
            opts["cookiefile"] = str(COOKIE_FILE)

    return opts


def _try_ytdlp(video_id: str) -> StreamInfo | None:
    """Use yt-dlp to extract audio stream URL."""
    urls = [
        f"https://music.youtube.com/watch?v={video_id}",
        f"https://www.youtube.com/watch?v={video_id}",
    ]

    has_cookies = bool(_BROWSER) or COOKIE_FILE.is_file()
    has_proxy = bool(_PROXY_URL)
    logger.info(
        "yt-dlp attempt for %s | cookies=%s | proxy=%s",
        video_id, has_cookies, has_proxy,
    )

    # Build attempts in priority order:
    # 1. proxy + cookies  (best chance)
    # 2. proxy only
    # 3. cookies only
    # 4. plain (only works from residential IPs)
    attempts: list[tuple[str, dict]] = []

    if has_proxy and has_cookies:
        for url in urls:
            attempts.append((url, _build_opts(use_cookies=True, use_proxy=True)))
    if has_proxy:
        for url in urls:
            attempts.append((url, _build_opts(use_cookies=False, use_proxy=True)))
    if has_cookies:
        for url in urls:
            attempts.append((url, _build_opts(use_cookies=True, use_proxy=False)))
    for url in urls:
        attempts.append((url, _build_opts(use_cookies=False, use_proxy=False)))

    for url, opts in attempts:
        try:
            proxy_label = opts.get("proxy", "NONE")
            cookie_label = opts.get("cookiefile", "NONE")
            logger.info("yt-dlp trying %s (proxy=%s, cookie=%s)", url, proxy_label, cookie_label)
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
      3. yt-dlp with proxy (bypasses datacenter IP blocking).
      4. yt-dlp with cookies / plain (fallback).

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
        has_proxy = bool(_PROXY_URL)
        proxy_hint = (
            "" if has_proxy else
            " HINT: Set the PROXY_URL env var to a residential proxy to fix this."
        )
        raise RuntimeError(
            f"All extraction methods failed for {video_id}. "
            f"YouTube is blocking this server's datacenter IP.{proxy_hint}"
        )

    _set_cached(video_id, result)
    return result
