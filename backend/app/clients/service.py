# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause
"""Client-related business logic and database interactions."""

import logging

from app.database import get_supabase
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

async def get_clients_by_user(user_id: str) -> list[dict]:
    """Return all active clients for a given user_id (soft-delete aware)."""

    db = get_supabase()

    response = (
        db.table("clients")
        .select("*")
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .order("created_at", desc=True)
        .execute()
    )
    logger.info(f"Retrieved clients for user: {len(response.data)}")

    return response.data or []


async def create_client(user_id: str, client_name: str, brand_voice: str | None) -> dict:
    """Insert a new client row and return the created record."""

    payload = {
        "user_id": user_id,
        "client_name": client_name,
        "brand_voice": brand_voice,
    }

    db = get_supabase()

    response = db.table("clients").insert(payload).execute()
    return response.data[0]


async def update_client(
    client_id: int, user_id: str, client_name: str | None, brand_voice: str | None
) -> dict | None:
    """Update a client's name/brand_voice. Returns None if not found or not owned."""

    payload = {}
    if client_name is not None:
        payload["client_name"] = client_name
        
    payload["brand_voice"] = brand_voice
    if not payload:
        return None

    db = get_supabase()

    response = (
        db.table("clients")
        .update(payload)
        .eq("id", client_id)
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .execute()
    )

    logger.info(f"Updated client {client_name} for user {user_id}")

    return response.data[0] if response.data else None


async def soft_delete_client(client_id: int, user_id: str) -> bool:
    """Soft-delete a client. Returns True if deleted, False if not found."""

    db = get_supabase()

    response = (
        db.table("clients")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", client_id)
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .execute()
    )

    return bool(response.data)
