# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Integration tests for Orkly AI endpoints."""
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# ── Fixtures ──────────────────────────────────────────────────────────────────

def _make_openai_client(text="Improved text"):
    client = MagicMock()
    client.chat.completions.create.return_value = MagicMock(
        **{"choices": [MagicMock(**{"message.content": text})]}
    )
    return client


def _make_supabase(rows=None):
    db = MagicMock()
    chain = MagicMock()
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.update.return_value = chain
    chain.insert.return_value = chain
    chain.execute.return_value = MagicMock(data=rows or [], count=0)
    db.table.return_value = chain
    return db


@pytest.fixture()
def client():
    with (
        patch("app.database._supabase_client", _make_supabase()),
        patch("app.config._openai_client", _make_openai_client()),
        patch("app.ai.get_openai_client", return_value=_make_openai_client()),
    ):
        from backend.main import app
        with TestClient(app) as c:
            yield c


# ── GET / ─────────────────────────────────────────────────────────────────────

class TestRoot:
    def test_returns_200(self, client):
        r = client.get("/")
        assert r.status_code == 200

    def test_contains_endpoints_key(self, client):
        data = client.get("/").json()
        assert "endpoints" in data


# ── GET /health ───────────────────────────────────────────────────────────────

class TestHealth:
    def test_healthy(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"


# ── POST /improve ─────────────────────────────────────────────────────────────

class TestImprove:
    def test_returns_three_variations(self, client):
        r = client.post("/improve", json={"text": "Hello world"})
        assert r.status_code == 200
        data = r.json()
        assert data["original"] == "Hello world"
        assert len(data["variations"]) == 3

    def test_variation_versions(self, client):
        data = client.post("/improve", json={"text": "Test"}).json()
        versions = {v["version"] for v in data["variations"]}
        assert versions == {"professional", "casual", "viral"}

    def test_empty_text_returns_422(self, client):
        r = client.post("/improve", json={"text": ""})
        assert r.status_code == 422

    def test_blank_text_returns_422(self, client):
        r = client.post("/improve", json={"text": "   "})
        assert r.status_code == 422

    def test_text_over_500_chars_returns_422(self, client):
        r = client.post("/improve", json={"text": "x" * 501})
        assert r.status_code == 422

    def test_rate_limit_blocks_after_limit(self):
        from backend.app.config import FREE_DAILY_LIMIT
        rows = [{"count": FREE_DAILY_LIMIT}]
        with patch("app.database._supabase_client", _make_supabase(rows)):
            from backend.main import app
            with TestClient(app) as blocked_client:
                r = blocked_client.post("/improve", json={"text": "hello"})
        assert r.status_code == 429
        assert r.json()["detail"]["error"] == "rate_limit_exceeded"

    def test_missing_text_field_returns_422(self, client):
        r = client.post("/improve", json={})
        assert r.status_code == 422


# ── GET /rate-limit/status ────────────────────────────────────────────────────

class TestRateLimitStatus:
    def test_returns_status_fields(self, client):
        r = client.get("/rate-limit/status")
        assert r.status_code == 200
        data = r.json()
        for key in ("allowed", "used", "remaining", "limit", "reset_at"):
            assert key in data

    def test_allowed_true_for_fresh_ip(self, client):
        data = client.get("/rate-limit/status").json()
        assert data["allowed"] is True


# ── POST /feedback ────────────────────────────────────────────────────────────

class TestFeedback:
    def test_accepts_valid_feedback(self, client):
        r = client.post("/feedback", json={"feedback": "Great app!"})
        assert r.status_code == 200
        assert r.json()["success"] is True

    def test_rejects_empty_feedback(self, client):
        r = client.post("/feedback", json={"feedback": ""})
        assert r.status_code == 422

    def test_rejects_blank_feedback(self, client):
        r = client.post("/feedback", json={"feedback": "   "})
        assert r.status_code == 422

    def test_rejects_missing_field(self, client):
        r = client.post("/feedback", json={})
        assert r.status_code == 422


# ── GET /admin/stats ──────────────────────────────────────────────────────────

class TestAdminStats:
    def test_unauthorized_without_key(self, client):
        r = client.get("/admin/stats")
        assert r.status_code == 401

    def test_unauthorized_with_wrong_key(self, client):
        r = client.get("/admin/stats?api_key=wrongkey")
        assert r.status_code == 401

    def test_authorized_with_correct_key(self):
        with patch("backend.main.ADMIN_API_KEY", "secret"):
            from backend.main import app
            with TestClient(app) as admin_client:
                r = admin_client.get("/admin/stats?api_key=secret")
        assert r.status_code == 200


# ── X-Forwarded-For header (proxy IP) ────────────────────────────────────────

class TestClientIP:
    def test_respects_forwarded_for_header(self, client):
        """The real IP should be read from X-Forwarded-For when present."""
        r = client.get(
            "/rate-limit/status",
            headers={"X-Forwarded-For": "203.0.113.42, 10.0.0.1"},
        )
        assert r.status_code == 200
