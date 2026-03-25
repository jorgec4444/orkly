# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause
"""Text generation-related API endpoints."""

from fastapi import APIRouter, Request

from .service import save_generation_handler, improve_text
from .schemas import SaveGenerationRequest, TextRequest, TextResponse, TextRequest

from app.utils.http import get_client_ip

router = APIRouter(prefix="/text-generation", tags=["text-generation"])

@router.post("/improve-text", response_model=TextResponse, tags=["text-improvement"])
async def improve(request: TextRequest, req: Request):
    """Improve the submitted text with AI, returning three variations."""

    return await improve_text(request, req)

@router.post("/save", response_model=dict)
async def save_generation(request: Request, payload: SaveGenerationRequest):
    """Save a text generation record for analytics (best-effort)."""
    ip = get_client_ip(request)
    save_generation_handler(ip, payload.original_text, payload.selected_text, payload.style)
    return {"status": "success"}