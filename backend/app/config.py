"""
Application configuration — reads from environment variables.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── Supabase ────────────────────────────────────────
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

    # ── Server ──────────────────────────────────────────
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # ── Search defaults ─────────────────────────────────
    SEARCH_LIMIT: int = 20


settings = Settings()
