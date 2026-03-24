# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Supabase client initialisation."""
import logging

logger = logging.getLogger(__name__)

_supabase_client = None


def init_supabase():
    """Initialise the Supabase client from environment variables.

    This is called once at app startup via the FastAPI lifespan handler.
    It is safe to call multiple times — subsequent calls are no-ops.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    from app.config import SUPABASE_URL, SUPABASE_KEY

    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning(
            "Supabase credentials missing (SUPABASE_URL / SUPABASE_KEY). "
            "Rate limiting and analytics will operate in fallback (in-memory) mode."
        )
        return None

    try:
        from supabase import create_client
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase connected successfully.")
        return _supabase_client
    except Exception as exc:
        logger.error("Failed to connect to Supabase: %s", exc)
        return None


def get_supabase():
    """Return the cached Supabase client, or None if unavailable."""
    return _supabase_client
