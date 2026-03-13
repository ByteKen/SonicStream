"""
Pydantic models for the /stream endpoint responses.
"""

from pydantic import BaseModel


class StreamInfo(BaseModel):
    """Audio stream metadata returned by yt-dlp extraction."""
    video_id: str
    title: str
    url: str               # Direct audio URL (expires after ~6 hrs)
    codec: str | None = None
    quality: str | None = None    # e.g. "medium", "low"
    filesize: int | None = None   # Approximate bytes, if known
    duration_seconds: int | None = None
    thumbnail: str | None = None
    expires_at: str | None = None  # ISO timestamp when the URL likely expires


class StreamResponse(BaseModel):
    """Envelope returned by GET /stream."""
    video_id: str
    stream: StreamInfo
