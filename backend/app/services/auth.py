"""
FastAPI dependency for JWT-based authentication via Supabase Auth.

Usage in a router:
    @router.get("/protected")
    async def protected(user = Depends(require_auth)):
        ...

If Supabase is not configured, `require_auth` lets requests through
with user=None (dev mode). Set REQUIRE_AUTH=true in .env to enforce.
"""

import os
import logging

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

_bearer_scheme = HTTPBearer(auto_error=False)
_REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() == "true"


async def require_auth(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict | None:
    """
    Validate the Supabase JWT from the Authorization header.

    Returns the authenticated user dict, or None if auth is
    disabled / not configured.

    Raises 401 if REQUIRE_AUTH=true and the token is missing or invalid.
    """
    supabase = get_supabase()

    # ── No Supabase configured → dev mode pass-through ──
    if supabase is None:
        if _REQUIRE_AUTH:
            raise HTTPException(
                status_code=503,
                detail="Auth is required but Supabase is not configured.",
            )
        return None

    # ── No token supplied ────────────────────────────────
    if not credentials:
        if _REQUIRE_AUTH:
            raise HTTPException(
                status_code=401,
                detail="Authorization header missing.",
            )
        return None

    token = credentials.credentials

    # ── Verify with Supabase ─────────────────────────────
    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token.")
        return {
            "id": user.id,
            "email": user.email,
            "aud": user.aud,
        }
    except Exception as exc:
        logger.warning("JWT validation failed: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
