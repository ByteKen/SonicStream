# ── Stage 1: Build ──────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /app

# Install build deps (some pip packages need gcc)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: Runtime ────────────────────────────────────
FROM python:3.13-slim

WORKDIR /app

# ffmpeg for audio transcoding, nodejs for yt-dlp JS solving, tor for proxy
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg nodejs tor && \
    rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY app/ ./app/
COPY migrations/ ./migrations/

# Create startup script that runs Tor then the app
RUN printf '#!/bin/sh\ntor --RunAsDaemon 1 --SocksPort 9050 --Log "warn stderr" || true\nsleep 2\nexec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}\n' > /app/start.sh && \
    chmod +x /app/start.sh

# Don't run as root (Tor needs some setup first, so we create its dirs)
RUN mkdir -p /var/lib/tor /var/log/tor && \
    useradd --create-home appuser && \
    chown -R appuser:appuser /var/lib/tor /var/log/tor
USER appuser

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["/app/start.sh"]
