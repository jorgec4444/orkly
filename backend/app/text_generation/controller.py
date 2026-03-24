# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause
"""Text generation-related API endpoints."""

from fastapi import APIRouter, Request

from .service import save_generation_handler

from .schemas import SaveGenerationRequest
from app.utils.http import get_client_ip

router = APIRouter()

@router.post("/save-generation", tags=["text-generation"])
async def save_generation(request: Request, payload: SaveGenerationRequest):
    """Save a text generation record for analytics (best-effort)."""
    ip = get_client_ip(request)
    save_generation_handler(ip, payload.original_text, payload.selected_text, payload.style)
    return {"status": "success"}