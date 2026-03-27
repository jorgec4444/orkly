# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Shared pytest fixtures for Orkly tests."""
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Make sure the project root is importable
sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))


# ── Supabase mock ─────────────────────────────────────────────────────────────

@pytest.fixture()
def mock_supabase():
    """Return a MagicMock that mimics a Supabase client."""
    db = MagicMock()

    # Fluent chain: .table().select().eq().eq().execute()  → returns empty list
    def _chain(*args, **kwargs):
        chain = MagicMock()
        chain.select.return_value = chain
        chain.eq.return_value = chain
        chain.update.return_value = chain
        chain.insert.return_value = chain
        chain.execute.return_value = MagicMock(data=[], count=0)
        return chain

    db.table.side_effect = _chain
    return db


# ── OpenAI mock ───────────────────────────────────────────────────────────────

def _make_openai_response(content: str):
    response = MagicMock()
    response.choices[0].message.content = content
    return response


@pytest.fixture()
def mock_openai_client():
    """Return a MagicMock OpenAI client that returns a canned completion."""
    client = MagicMock()
    client.chat.completions.create.return_value = _make_openai_response(
        "This is an improved text."
    )
    return client


# ── FastAPI test client ───────────────────────────────────────────────────────

@pytest.fixture()
def app_client(mock_supabase, mock_openai_client):
    with (
        patch("app.database._supabase_client", mock_supabase),
        patch("app.config._openai_client", mock_openai_client),
        patch("app.ai.get_openai_client", return_value=mock_openai_client),
    ):
        from backend.main import app
        with TestClient(app, raise_server_exceptions=True) as client:
            yield client
