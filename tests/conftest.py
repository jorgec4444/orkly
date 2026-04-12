# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Shared pytest fixtures for Orkly tests."""
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

# Add backend to path so imports work as app.xxx
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_supabase():
    db = MagicMock()
    chain = MagicMock()
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.is_.return_value = chain
    chain.order.return_value = chain
    chain.limit.return_value = chain
    chain.single.return_value = chain
    chain.update.return_value = chain
    chain.insert.return_value = chain
    chain.delete.return_value = chain
    chain.execute.return_value = MagicMock(data=[], count=0)
    db.table.return_value = chain
    return db


def make_openai_client(text="Improved text."):
    client = MagicMock()
    client.chat.completions.create.return_value = MagicMock(
        **{"choices": [MagicMock(**{"message.content": text})]}
    )
    return client


def make_user():
    user = MagicMock()
    user.id = "test-user-uuid"
    user.email = "test@example.com"
    return user


def make_rate_limiter():
    rl = MagicMock()
    allowed = {"allowed": True, "used": 0, "remaining": 10, "limit": 10}
    rl.check_limit.return_value = allowed
    rl.check_limit_user.return_value = allowed
    rl.increment.return_value = None
    rl.increment_user.return_value = None
    return rl


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture()
def mock_supabase():
    return make_supabase()


@pytest.fixture()
def mock_openai_client():
    return make_openai_client()


@pytest.fixture()
def mock_user():
    return make_user()


@pytest.fixture()
def app_client(mock_supabase, mock_openai_client, mock_user):
    """FastAPI test client with auth and external deps mocked via dependency_overrides."""
    from unittest.mock import patch
    from app.auth.dependencies import get_current_user, get_optional_user

    async def _fake_user():
        return mock_user

    async def _fake_optional_user():
        return mock_user

    with (
        patch("app.database._supabase_client", mock_supabase),
        patch("app.config._openai_client", mock_openai_client),
        patch("app.text_generation.service.get_openai_client", return_value=mock_openai_client),
        patch("app.text_generation.service.rate_limiter", make_rate_limiter()),
    ):
        for key in list(sys.modules.keys()):
            if key in ("main", "app.clients.controller"):
                del sys.modules[key]
        from main import app
        app.dependency_overrides[get_current_user] = _fake_user
        app.dependency_overrides[get_optional_user] = _fake_optional_user
        with TestClient(app, raise_server_exceptions=True) as client:
            yield client
        app.dependency_overrides.clear()
