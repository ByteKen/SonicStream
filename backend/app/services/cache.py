"""
Search result caching via Supabase Postgres.

Table: search_cache
  - query (text, PK)
  - results (jsonb)
  - created_at (timestamptz)

If Supabase is not configured, all calls gracefully no-op.
"""

import json
import logging
from datetime import datetime, timezone, timedelta

from app.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

# Cache entries expire after 1 hour
_CACHE_TTL = timedelta(hours=1)


def get_cached_search(query: str) -> list[dict] | None:
    """
    Look up *query* in the search_cache table.
    Returns the cached results list, or None on miss / expiry.
    """
    supabase = get_supabase()
    if supabase is None:
        return None

    try:
        resp = (
            supabase.table("search_cache")
            .select("results, created_at")
            .eq("query", query.lower().strip())
            .maybe_single()
            .execute()
        )

        if not resp.data:
            return None

        # Check TTL
        created = datetime.fromisoformat(resp.data["created_at"])
        if datetime.now(timezone.utc) - created > _CACHE_TTL:
            # Expired — delete async, return miss
            try:
                supabase.table("search_cache").delete().eq(
                    "query", query.lower().strip()
                ).execute()
            except Exception:
                pass
            return None

        return resp.data["results"]

    except Exception as exc:
        logger.warning("search_cache lookup failed: %s", exc)
        return None


def set_cached_search(query: str, results: list[dict]) -> None:
    """Upsert search results into the cache."""
    supabase = get_supabase()
    if supabase is None:
        return

    try:
        supabase.table("search_cache").upsert(
            {
                "query": query.lower().strip(),
                "results": results,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="query",
        ).execute()
    except Exception as exc:
        logger.warning("search_cache upsert failed: %s", exc)
