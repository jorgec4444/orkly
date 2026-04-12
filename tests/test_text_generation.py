# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Unit tests for text generation service."""
import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock, patch

from tests.conftest import make_supabase, make_rate_limiter


def _make_openai_response(text: str):
    r = MagicMock()
    r.choices[0].message.content = text
    return r


def _make_request(text="Hello world", platform="instagram", client_id=None, temperature=0.7):
    from app.text_generation.schemas import TextRequest
    return TextRequest(text=text, platform=platform, client_id=client_id, temperature=temperature)


def _make_fastapi_request():
    req = MagicMock()
    req.headers = {}
    req.client.host = "127.0.0.1"
    return req


class TestImproveTextWithAI:
    @pytest.mark.asyncio
    async def test_returns_stripped_text(self):
        client = MagicMock()
        client.chat.completions.create.return_value = _make_openai_response("  Improved text.  ")
        with patch("app.text_generation.service.get_openai_client", return_value=client):
            from app.text_generation.service import improve_text_with_ai
            result = await improve_text_with_ai("hello world", "professional")
        assert result == "Improved text."

    @pytest.mark.asyncio
    async def test_strips_surrounding_quotes(self):
        client = MagicMock()
        client.chat.completions.create.return_value = _make_openai_response('"Quoted text."')
        with patch("app.text_generation.service.get_openai_client", return_value=client):
            from app.text_generation.service import improve_text_with_ai
            result = await improve_text_with_ai("hello", "casual")
        assert result == "Quoted text."

    @pytest.mark.asyncio
    async def test_raises_500_when_client_is_none(self):
        with patch("app.text_generation.service.get_openai_client", return_value=None):
            from app.text_generation.service import improve_text_with_ai
            with pytest.raises(HTTPException) as exc:
                await improve_text_with_ai("hello", "viral")
        assert exc.value.status_code == 500

    @pytest.mark.asyncio
    async def test_raises_500_on_api_error(self):
        client = MagicMock()
        client.chat.completions.create.side_effect = Exception("timeout")
        with patch("app.text_generation.service.get_openai_client", return_value=client):
            from app.text_generation.service import improve_text_with_ai
            with pytest.raises(HTTPException) as exc:
                await improve_text_with_ai("hello", "professional")
        assert exc.value.status_code == 500


class TestImproveText:
    @pytest.mark.asyncio
    async def test_returns_three_variations(self):
        client = MagicMock()
        client.chat.completions.create.return_value = _make_openai_response("Improved text.")
        with (
            patch("app.text_generation.service.get_openai_client", return_value=client),
            patch("app.database._supabase_client", make_supabase()),
            patch("app.text_generation.service.rate_limiter", make_rate_limiter()),
        ):
            from app.text_generation.service import improve_text
            result = await improve_text(_make_request(), _make_fastapi_request(), user=None)
        assert len(result.variations) == 3
        versions = {v.version for v in result.variations}
        assert versions == {"professional", "casual", "viral"}

    @pytest.mark.asyncio
    async def test_original_text_preserved(self):
        client = MagicMock()
        client.chat.completions.create.return_value = _make_openai_response("Improved.")
        with (
            patch("app.text_generation.service.get_openai_client", return_value=client),
            patch("app.database._supabase_client", make_supabase()),
            patch("app.text_generation.service.rate_limiter", make_rate_limiter()),
        ):
            from app.text_generation.service import improve_text
            result = await improve_text(
                _make_request(text="My original text"),
                _make_fastapi_request(),
                user=None,
            )
        assert result.original == "My original text"

    @pytest.mark.asyncio
    async def test_variations_not_empty(self):
        client = MagicMock()
        client.chat.completions.create.return_value = _make_openai_response("Good content.")
        with (
            patch("app.text_generation.service.get_openai_client", return_value=client),
            patch("app.database._supabase_client", make_supabase()),
            patch("app.text_generation.service.rate_limiter", make_rate_limiter()),
        ):
            from app.text_generation.service import improve_text
            result = await improve_text(_make_request(), _make_fastapi_request(), user=None)
        for v in result.variations:
            assert v.text != ""
