# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Unit tests for app.ai."""
import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock, patch


def _make_response(text: str):
    r = MagicMock()
    r.choices[0].message.content = text
    return r


@pytest.fixture()
def openai_client():
    client = MagicMock()
    client.chat.completions.create.return_value = _make_response("  Improved text.  ")
    return client


class TestImproveTextWithAI:
    @pytest.mark.asyncio
    async def test_returns_stripped_text(self, openai_client):
        with patch("backend.app.config._openai_client", openai_client):
            from backend.app.ai import improve_text_with_ai
            result = await improve_text_with_ai("hello world", "professional")
        assert result == "Improved text."

    @pytest.mark.asyncio
    async def test_strips_surrounding_quotes(self, openai_client):
        openai_client.chat.completions.create.return_value = _make_response('"Quoted text."')
        with patch("backend.app.config._openai_client", openai_client):
            from backend.app.ai import improve_text_with_ai
            result = await improve_text_with_ai("hello", "casual")
        assert result == "Quoted text."

    @pytest.mark.asyncio
    async def test_raises_500_when_client_is_none(self):
        with patch("backend.app.config._openai_client", None):
            from backend.app.ai import improve_text_with_ai
            with pytest.raises(HTTPException) as exc_info:
                await improve_text_with_ai("hello", "viral")
        assert exc_info.value.status_code == 500
        assert "OPENAI_API_KEY" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_raises_500_on_api_error(self, openai_client):
        openai_client.chat.completions.create.side_effect = Exception("timeout")
        with patch("backend.app.config._openai_client", openai_client):
            from backend.app.ai import improve_text_with_ai
            with pytest.raises(HTTPException) as exc_info:
                await improve_text_with_ai("hello", "professional")
        assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    async def test_unknown_style_falls_back_to_professional(self, openai_client):
        """An unrecognised style should use the professional prompt."""
        with patch("backend.app.config._openai_client", openai_client):
            from backend.app.ai import improve_text_with_ai
            result = await improve_text_with_ai("hello", "nonexistent_style")
        assert isinstance(result, str)
        openai_client.chat.completions.create.assert_called_once()
