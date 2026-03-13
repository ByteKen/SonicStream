"""
/stream router — extracts audio stream URLs via yt-dlp, with background logging.
"""

from fastapi import APIRouter, Query, HTTPException, Request, BackgroundTasks

from app.schemas.stream import StreamResponse
from app.services.stream import extract_stream
from app.services.stream_logger import log_stream_extraction

router = APIRouter(tags=["Stream"])


@router.get("/stream", response_model=StreamResponse)
async def stream(
    request: Request,
    videoId: str = Query(
        ..., min_length=1, description="YouTube video ID to extract audio from"
    ),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Extract the best audio-only direct URL for a YouTube video.

    Returns the stream URL, codec info, approximate filesize,
    duration, and an estimated expiry timestamp.
    Logs each extraction to Supabase in the background.
    """
    try:
        info = extract_stream(video_id=videoId)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected extraction error: {exc}",
        )

    # Log the extraction asynchronously (doesn't block the response)
    background_tasks.add_task(
        log_stream_extraction,
        video_id=videoId,
        title=info.title,
        codec=info.codec,
        duration_seconds=info.duration_seconds,
        client_ip=request.client.host if request.client else None,
    )

    return StreamResponse(video_id=videoId, stream=info)
