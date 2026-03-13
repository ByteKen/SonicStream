"""
Pydantic models for the /search endpoint responses.
"""

from pydantic import BaseModel


class TrackArtist(BaseModel):
    """Individual artist credit."""
    name: str
    id: str | None = None


class TrackThumbnail(BaseModel):
    """Album / track thumbnail."""
    url: str
    width: int | None = None
    height: int | None = None


class TrackResult(BaseModel):
    """A single track returned from a search."""
    video_id: str
    title: str
    artists: list[TrackArtist]
    album: str | None = None
    duration: str | None = None          # Human-readable, e.g. "3:45"
    duration_seconds: int | None = None  # Useful for the player progress bar
    thumbnail: TrackThumbnail | None = None
    is_explicit: bool = False


class SearchResponse(BaseModel):
    """Envelope returned by GET /search."""
    query: str
    results: list[TrackResult]
    count: int
