"""
Supabase client singleton.

If SUPABASE_URL / SUPABASE_ANON_KEY are not set, the client is
left as None and all Supabase-dependent features gracefully no-op.
"""

import logging
from supabase import create_client, Client

from app.config import settings

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_supabase() -> Client | None:
    """Return the Supabase client, or None if not configured."""
    global _client
    if _client is not None:
        return _client

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        logger.warning(
            "Supabase not configured (SUPABASE_URL / SUPABASE_ANON_KEY missing). "
            "Auth, caching, and logging features are disabled."
        )
        return None

    try:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        logger.info("Supabase client initialised for %s", settings.SUPABASE_URL)
    except Exception as exc:
        logger.warning(
            "Failed to initialise Supabase client: %s. "
            "Auth, caching, and logging features are disabled.",
            exc,
        )
        return None
    return _client
