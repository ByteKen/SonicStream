"""
/admin router — admin-only endpoints for managing backend configuration.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path

from app.services.stream import COOKIE_FILE

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/cookies")
async def upload_cookies(file: UploadFile = File(...)):
    """
    Upload a Netscape-format cookies.txt file for yt-dlp.

    This enables yt-dlp to authenticate with YouTube and bypass
    "Sign in to confirm you're not a bot" errors on cloud servers.

    How to get cookies.txt:
      1. Install "Get cookies.txt LOCALLY" browser extension
      2. Go to youtube.com (logged OUT is fine)
      3. Click the extension → Export → Upload here
    """
    if not file.filename or not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="File must be a .txt file")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File is empty")

    # Basic validation: should contain Netscape cookie format markers
    text = content.decode("utf-8", errors="ignore")
    if ".youtube.com" not in text and ".google.com" not in text:
        raise HTTPException(
            status_code=400,
            detail="Invalid cookies.txt — must contain YouTube/Google cookies"
        )

    # Write to the cookie file location
    COOKIE_FILE.write_bytes(content)

    line_count = len(text.strip().split("\n"))
    return {
        "status": "ok",
        "message": f"Cookies uploaded successfully ({line_count} lines)",
        "path": str(COOKIE_FILE),
    }


@router.get("/cookies/status")
async def cookies_status():
    """Check if a cookies.txt file is present and valid."""
    if not COOKIE_FILE.is_file():
        return {
            "has_cookies": False,
            "message": "No cookies.txt found. Upload via POST /admin/cookies",
        }

    stat = COOKIE_FILE.stat()
    return {
        "has_cookies": True,
        "file_size": stat.st_size,
        "last_modified": stat.st_mtime,
        "message": "cookies.txt is present",
    }


@router.delete("/cookies")
async def delete_cookies():
    """Remove the cookies.txt file."""
    if COOKIE_FILE.is_file():
        COOKIE_FILE.unlink()
        return {"status": "ok", "message": "cookies.txt deleted"}
    return {"status": "ok", "message": "No cookies.txt to delete"}
