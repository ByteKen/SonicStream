"""
Service layer for YouTube Music search via ytmusicapi.
Uses unauthenticated mode — no cookies or OAuth needed.
"""

from ytmusicapi import YTMusic

from app.schemas.search import TrackResult, TrackArtist, TrackThumbnail

# Singleton — initialised once on import, reused across requests.
_ytmusic = YTMusic()


def _parse_duration_to_seconds(duration_str: str | None) -> int | None:
    """Convert '3:45' or '1:02:30' to total seconds."""
    if not duration_str:
        return None
    parts = duration_str.split(":")
    try:
        parts = [int(p) for p in parts]
    except ValueError:
        return None
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return None


def _best_thumbnail(thumbs: list[dict] | None) -> TrackThumbnail | None:
    """Pick the highest-resolution thumbnail from ytmusicapi's list."""
    if not thumbs:
        return None
    best = max(thumbs, key=lambda t: t.get("width", 0))
    return TrackThumbnail(
        url=best["url"],
        width=best.get("width"),
        height=best.get("height"),
    )


def search_tracks(query: str, limit: int = 20) -> list[TrackResult]:
    """
    Search YouTube Music for songs matching *query*.
    Returns a list of TrackResult models ready for serialisation.
    """
    raw_results = _ytmusic.search(query, filter="songs", limit=limit)

    tracks: list[TrackResult] = []
    for item in raw_results:
        # ytmusicapi returns different shapes — guard defensively.
        if item.get("resultType") != "song":
            continue

        artists = [
            TrackArtist(name=a.get("name", "Unknown"), id=a.get("id"))
            for a in (item.get("artists") or [])
        ]

        duration_text = item.get("duration")
        tracks.append(
            TrackResult(
                video_id=item.get("videoId", ""),
                title=item.get("title", "Untitled"),
                artists=artists,
                album=item.get("album", {}).get("name") if item.get("album") else None,
                duration=duration_text,
                duration_seconds=_parse_duration_to_seconds(duration_text),
                thumbnail=_best_thumbnail(item.get("thumbnails")),
                is_explicit=item.get("isExplicit", False),
            )
        )

    return tracks
