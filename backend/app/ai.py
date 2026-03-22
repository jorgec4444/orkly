# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""AI helpers: wrapper around OpenAI calls for text improvement."""
import logging

from fastapi import HTTPException

from .config import get_openai_client, MODEL_NAME
from .prompts import IMPROVEMENT_PROMPTS, DEFAULT_STYLE

logger = logging.getLogger(__name__)


async def improve_text_with_ai(text: str, style: str) -> str:
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
                    "content": "You are a copywriting expert for social media.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=150,
            temperature=0.8,
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
