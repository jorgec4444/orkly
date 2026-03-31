# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause
"""Text generation-related business logic and database interactions."""

import logging

from fastapi import HTTPException, Request

from app.utils.http import get_client_ip
from app.ai.prompts import DEFAULT_STYLE, IMPROVEMENT_PROMPTS
from app.config import MODEL_NAME, get_openai_client
from app.database import get_supabase
from app.rate_limit.service import rate_limiter, rate_limit_error
from .schemas import GenerationsResponse, SaveGenerationRequest, TextRequest, TextResponse, TextVariation
import asyncio

logger = logging.getLogger(__name__)


async def improve_text_with_ai(text: str, style: str, brand_voice: str | None = None, temperature: float = 0.8) -> str:
    """Use OpenAI to improve *text* according to *style*.

    Raises:
        HTTPException 500 - if the OpenAI client is not configured.
        HTTPException 500 - if the API call fails for any reason.
    """

    client = get_openai_client()
    if client is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "OpenAI client not configured. "
                "Set OPENAI_API_KEY in your .env file and restart the server."
            ),
        )

    prompt_template = IMPROVEMENT_PROMPTS.get(style, IMPROVEMENT_PROMPTS[DEFAULT_STYLE])
    prompt = prompt_template.format(text=text)

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": f"You are a copywriting expert for social media.\n\nWrite using the following brand voice: {brand_voice}" if brand_voice else "You are a copywriting expert for social media.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=150,
            temperature=temperature,
        )

        improved = response.choices[0].message.content.strip()
        # Strip surrounding quotes the model sometimes adds
        improved = improved.strip('"').strip("'")
        return improved

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("OpenAI API error for style=%s", style)
        raise HTTPException(status_code=500, detail=f"Error with OpenAI API: {exc}") from exc


async def improve_text(request: TextRequest, req: Request, user = None):
    """Return three AI-improved variations of the submitted text."""

    if user:
        status = rate_limiter.check_limit_user(user.id)
    else:
        ip = get_client_ip(req)
        status = rate_limiter.check_limit(ip)
    
    if not status["allowed"]:
        rate_limit_error(status)

    db = get_supabase()

    if not status["allowed"]:
        rate_limit_error(status)

    brand_voice = None
    if request.client_id and user:
    result = (
        db.table("clients")
        .select("brand_voice")
        .eq("id", request.client_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    brand_voice = result.data.get("brand_voice") if result.data else None

    # Run all three styles in parallel
    professional, casual, viral = await asyncio.gather(
        improve_text_with_ai(request.text, "professional", brand_voice, request.temperature),
        improve_text_with_ai(request.text, "casual", brand_voice, request.temperature),
        improve_text_with_ai(request.text, "viral", brand_voice, request.temperature),
    )

    variations = [
        TextVariation(version="professional", text=professional, description="Professional tone for LinkedIn"),
        TextVariation(version="casual",       text=casual,       description="Casual and approachable tone"),
        TextVariation(version="viral",        text=viral,        description="Optimized for engagement"),
    ]

    if user:
        rate_limiter.increment_user(user.id)
    else:
        rate_limiter.increment(ip)

    return TextResponse(original=request.text, variations=variations)

    
async def save_generation_handler(save_generation_request: SaveGenerationRequest, request: Request) -> None:
    """Persist a generation record for tracking generations per client"""

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
                "platform": save_generation_request.platform,
            }
        ).execute()
    except Exception as exc:
        logger.warning("save_generation failed: %s", exc)

    return {"status": "success"}

async def fetch_client_generations(client_id: int, user_id: str) -> list[GenerationsResponse]:
    """Return generations for a specific client."""

    db = get_supabase()

    try:
        client = db.table("clients").select("id").eq("id", client_id).eq("user_id", user_id).single().execute()

        if not client.data:
            return []

        response = (
            db.table("generations")
            .select("*")
            .eq("client_id", client_id)
            .order("created_at", desc=True)
            .execute()
        )
    except Exception as exc:
        logger.error(f"Error fetching generations for client {client_id}: {exc}")
        return []
    
    return response.data or []
