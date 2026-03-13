"""
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import search, stream, audio

app = FastAPI(
    title="Spotify Clone API",
    description="Backend API for the Spotify clone mobile app — proxies YouTube Music search & audio streams.",
    version="0.1.0",
)

# ── CORS (allow the React Native dev client) ────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────────
app.include_router(search.router)
app.include_router(stream.router)
app.include_router(audio.router)


# ── Health check ────────────────────────────────────────
@app.get("/health", tags=["Meta"])
async def health():
    return {"status": "ok"}


# ── Dev runner ──────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
