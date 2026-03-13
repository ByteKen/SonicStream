"""
Stream extraction logging via Supabase Postgres.

Table: stream_log
  - id (uuid, PK, auto)
  - video_id (text)
  - title (text)
  - codec (text)
  - duration_seconds (int)
  - requested_at (timestamptz)
  - client_ip (text, nullable)

If Supabase is not configured, all calls gracefully no-op.
"""

import logging
from datetime import datetime, timezone

from app.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)


def log_stream_extraction(
    video_id: str,
    title: str,
    codec: str | None = None,
    duration_seconds: int | None = None,
    client_ip: str | None = None,
) -> None:
    """
    Insert a row into stream_log.
    Designed to be called in a FastAPI BackgroundTask
    so it doesn't block the response.
    """
    supabase = get_supabase()
    if supabase is None:
        return

    try:
        supabase.table("stream_log").insert(
            {
                "video_id": video_id,
                "title": title,
                "codec": codec,
                "duration_seconds": duration_seconds,
                "requested_at": datetime.now(timezone.utc).isoformat(),
                "client_ip": client_ip,
            }
        ).execute()
    except Exception as exc:
        logger.warning("stream_log insert failed: %s", exc)
