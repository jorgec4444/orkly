# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Integration tests for main API endpoints."""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from tests.conftest import make_supabase, make_openai_client, make_user, make_rate_limiter
from app.auth.dependencies import get_current_user, get_optional_user


def _make_app_client(supabase=None, openai=None):
    """Build a TestClient with full dependency overrides."""
    db = supabase or make_supabase()
    ai = openai or make_openai_client()
    user = make_user()

    async def _user():
        return user

    async def _optional_user():
        return user

    with (
        patch("app.database._supabase_client", db),
        patch("app.config._openai_client", ai),
        patch("app.text_generation.service.get_openai_client", return_value=ai),
        patch("app.text_generation.service.rate_limiter", make_rate_limiter()),
    ):
        from main import app
        app.dependency_overrides[get_current_user] = _user
        app.dependency_overrides[get_optional_user] = _optional_user
        client = TestClient(app)
        return client, app


@pytest.fixture()
def client(app_client):
    return app_client


class TestRoot:
    def test_returns_200(self, client):
        r = client.get("/")
        assert r.status_code == 200


class TestHealth:
    def test_healthy(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"


class TestTextGeneration:
    def test_improve_returns_three_variations(self, client):
        r = client.post("/text-generation/improve-text", json={
            "text": "Hello world",
            "platform": "instagram",
        })
        assert r.status_code == 200
        data = r.json()
        assert "variations" in data
        assert len(data["variations"]) == 3

    def test_improve_variation_versions(self, client):
        r = client.post("/text-generation/improve-text", json={
            "text": "Test",
            "platform": "instagram",
        })
        assert r.status_code == 200
        versions = {v["version"] for v in r.json()["variations"]}
        assert versions == {"professional", "casual", "viral"}

    def test_empty_text_returns_422(self, client):
        r = client.post("/text-generation/improve-text", json={
            "text": "",
            "platform": "instagram",
        })
        assert r.status_code == 422

    def test_text_over_500_chars_returns_422(self, client):
        r = client.post("/text-generation/improve-text", json={
            "text": "x" * 501,
            "platform": "instagram",
        })
        assert r.status_code == 422

    def test_missing_text_returns_422(self, client):
        r = client.post("/text-generation/improve-text", json={})
        assert r.status_code == 422


class TestFeedback:
    def test_accepts_valid_feedback(self, client):
        r = client.post("/feedback/save", json={"feedback": "Great app!"})
        assert r.status_code in (200, 204)

    def test_rejects_empty_feedback(self, client):
        r = client.post("/feedback/save", json={"feedback": ""})
        assert r.status_code == 422

    def test_rejects_missing_field(self, client):
        r = client.post("/feedback/save", json={})
        assert r.status_code == 422


class TestClients:
    def test_list_clients_returns_200(self, client):
        r = client.get("/client/list")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_client_valid(self, app_client, mock_supabase):
        mock_supabase.table.return_value.execute.return_value = MagicMock(data=[{
            "id": 1, "client_name": "Test Corp", "brand_voice": None,
            "platforms": [], "custom_folders": [], "logo_url": None,
            "user_id": "test-user-uuid", "created_at": "2026-01-01T00:00:00",
            "deleted_at": None,
        }])
        r = app_client.post("/client/create", json={"client_name": "Test Corp"})
        assert r.status_code == 201

    def test_create_client_missing_name_returns_422(self, client):
        r = client.post("/client/create", json={"client_name": ""})
        assert r.status_code == 422


class TestChatSessions:
    def test_list_sessions_returns_200(self, client):
        r = client.get("/chat/sessions")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_session_valid(self, app_client, mock_supabase):
        mock_supabase.table.return_value.execute.return_value = MagicMock(data=[{
            "id": "session-uuid",
            "user_id": "test-user-uuid",
            "client_id": None,
            "created_at": "2026-01-01T00:00:00",
        }])
        r = app_client.post("/chat/session", json={"client_id": None})
        assert r.status_code == 200
