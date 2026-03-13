"""
/search router — exposes YouTube Music track search with Supabase caching.
"""

from fastapi import APIRouter, Query, HTTPException, BackgroundTasks

from app.schemas.search import SearchResponse
from app.services.ytmusic import search_tracks
from app.services.cache import get_cached_search, set_cached_search
from app.config import settings

router = APIRouter(tags=["Search"])


@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(
        default=settings.SEARCH_LIMIT,
        ge=1,
        le=50,
        description="Max results to return",
    ),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Search YouTube Music for tracks.

    Results are cached in Supabase for 1 hour. If the cache
    misses, we query ytmusicapi and store the results.
    """
    # 1. Check Supabase cache
    cached = get_cached_search(q)
    if cached:
        return SearchResponse(query=q, results=cached[:limit], count=len(cached[:limit]))

    # 2. Cache miss — query ytmusicapi
    try:
        results = search_tracks(query=q, limit=limit)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream search failed: {exc}",
        )

    # 3. Cache the results in the background
    serialised = [r.model_dump() for r in results]
    background_tasks.add_task(set_cached_search, q, serialised)

    return SearchResponse(query=q, results=results, count=len(results))
