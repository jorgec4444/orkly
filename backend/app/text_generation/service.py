# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause
"""Text generation-related business logic and database interactions."""

import logging

from fastapi import Request

from app.utils.http import get_client_ip
from .schemas import SaveGenerationRequest
from app.database import get_supabase

logger = logging.getLogger(__name__)

def save_generation_handler(save_generation_request: SaveGenerationRequest, request: Request) -> None:
    """Persist a generation record for analytics (best-effort)."""
    ip = get_client_ip(request)
    db = get_supabase()

    try:
        db.table("generations").insert(
            {
                "ip": ip,
                "text_original": save_generation_request.original_text,
                "text_improved": save_generation_request.selected_text,
                "style": save_generation_request.style,
                "client_id": save_generation_request.client_id,
            }
        ).execute()
    except Exception as exc:
        logger.warning("save_generation failed: %s", exc)