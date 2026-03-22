# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Central configuration and shared clients.

Reads environment variables, validates them at startup, and initialises
the OpenAI client lazily so unit tests can patch it without side-effects.
"""
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Load .env from the project root (one level above /app)
_env_path = Path(__file__).parent.parent / ".env"
load_dotenv(_env_path)

# ── OpenAI ──────────────────────────────────────────────────────────────────
OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")

# Correct model name is "gpt-4o-mini"
MODEL_NAME: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# ── Supabase ─────────────────────────────────────────────────────────────────
SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY")

# ── Rate limiting ─────────────────────────────────────────────────────────────
def _parse_int_env(name: str, default: int) -> int:
    """Parse an integer env-var safely; fall back to *default* instead of crashing."""
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        print(f"[config] WARNING: {name}={raw!r} is not a valid integer — using default {default}")
        return default


FREE_DAILY_LIMIT: int = _parse_int_env("MAX_FREE_GENERATIONS_PER_DAY", 5)

# ── Admin ─────────────────────────────────────────────────────────────────────
ADMIN_API_KEY: Optional[str] = os.getenv("ADMIN_API_KEY")

# ── OpenAI client (module-level singleton) ────────────────────────────────────
_openai_client = None


def init_openai_client():
    """Initialise and cache the OpenAI client. Safe to call multiple times."""
    global _openai_client
    if _openai_client is not None:
        return _openai_client

    if not OPENAI_API_KEY:
        print("[config] OpenAI client NOT initialised — OPENAI_API_KEY is missing.")
        return None

    try:
        from openai import OpenAI  # imported here so tests can mock before import
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
        print(f"[config] OpenAI client initialised (model={MODEL_NAME}).")
        return _openai_client
    except Exception as exc:
        print(f"[config] ERROR initialising OpenAI client: {exc}")
        return None


def get_openai_client():
    """Return the cached OpenAI client, or None if unavailable."""
    return _openai_client
