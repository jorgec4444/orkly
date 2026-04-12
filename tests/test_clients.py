# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Unit tests for clients service."""
import pytest
from unittest.mock import MagicMock, patch


CLIENT_ROW = {
    "id": 1,
    "client_name": "Acme Corp",
    "brand_voice": "Friendly",
    "platforms": ["instagram"],
    "custom_folders": [],
    "logo_url": None,
    "user_id": "test-user",
    "created_at": "2026-01-01T00:00:00",
    "deleted_at": None,
}


def _make_db(data=None):
    db = MagicMock()
    chain = MagicMock()
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.is_.return_value = chain
    chain.order.return_value = chain
    chain.single.return_value = chain
    chain.update.return_value = chain
    chain.insert.return_value = chain
    chain.delete.return_value = chain
    chain.execute.return_value = MagicMock(data=data or [])
    db.table.return_value = chain
    return db


class TestGetClientsByUser:
    @pytest.mark.asyncio
    async def test_returns_client_list(self):
        db = _make_db(data=[CLIENT_ROW])
        with patch("app.clients.service.get_supabase", return_value=db):
            from app.clients import service
            result = await service.get_clients_by_user("test-user")
        assert len(result) == 1
        assert result[0]["client_name"] == "Acme Corp"

    @pytest.mark.asyncio
    async def test_returns_empty_list(self):
        db = _make_db(data=[])
        with patch("app.clients.service.get_supabase", return_value=db):
            from app.clients import service
            result = await service.get_clients_by_user("test-user")
        assert result == []


class TestGetClientById:
    @pytest.mark.asyncio
    async def test_returns_client_when_found(self):
        db = _make_db(data=[CLIENT_ROW])
        with patch("app.clients.service.get_supabase", return_value=db):
            from app.clients import service
            result = await service.get_client_by_id(1, "test-user")
        assert result["client_name"] == "Acme Corp"

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self):
        db = _make_db(data=[])
        with patch("app.clients.service.get_supabase", return_value=db):
            from app.clients import service
            result = await service.get_client_by_id(999, "test-user")
        assert result is None


class TestUpdateClient:
    @pytest.mark.asyncio
    async def test_updates_client_name(self):
        db = _make_db(data=[{**CLIENT_ROW, "client_name": "New Name"}])
        with patch("app.clients.service.get_supabase", return_value=db):
            from app.clients import service
            result = await service.update_client(1, "test-user", client_name="New Name")
        assert result["client_name"] == "New Name"

    @pytest.mark.asyncio
    async def test_returns_none_when_no_safe_fields(self):
        db = _make_db()
        with patch("app.clients.service.get_supabase", return_value=db):
            from app.clients import service
            result = await service.update_client(1, "test-user", unknown_field="ignored")
        assert result is None

    @pytest.mark.asyncio
    async def test_rejects_unknown_fields(self):
        db = _make_db(data=[CLIENT_ROW])
        with patch("app.clients.service.get_supabase", return_value=db):
            from app.clients import service
            await service.update_client(1, "test-user", unknown_field="ignored", client_name="Valid")
        call_kwargs = db.table.return_value.update.call_args[0][0]
        assert "unknown_field" not in call_kwargs
        assert "client_name" in call_kwargs

    @pytest.mark.asyncio
    async def test_updates_logo_url(self):
        url = "https://assets.orkly.app/logo.png"
        db = _make_db(data=[{**CLIENT_ROW, "logo_url": url}])
        with patch("app.clients.service.get_supabase", return_value=db):
            from app.clients import service
            result = await service.update_client(1, "test-user", logo_url=url)
        assert result["logo_url"] == url


class TestCreateClient:
    @pytest.mark.asyncio
    async def test_creates_client(self):
        new_client = {**CLIENT_ROW, "id": 2, "client_name": "New Corp"}
        db = _make_db(data=[new_client])
        with patch("app.clients.service.get_supabase", return_value=db):
            from app.clients import service
            result = await service.create_client("test-user", "New Corp", None)
        assert result["client_name"] == "New Corp"

    @pytest.mark.asyncio
    async def test_creates_client_with_brand_voice(self):
        new_client = {**CLIENT_ROW, "brand_voice": "Professional tone"}
        db = _make_db(data=[new_client])
        with patch("app.clients.service.get_supabase", return_value=db):
            from app.clients import service
            result = await service.create_client("test-user", "Acme", "Professional tone")
        assert result["brand_voice"] == "Professional tone"


class TestSoftDeleteClient:
    @pytest.mark.asyncio
    async def test_returns_true_when_deleted(self):
        db = _make_db(data=[CLIENT_ROW])
        with patch("app.clients.service.get_supabase", return_value=db):
            from app.clients import service
            result = await service.soft_delete_client(1, "test-user")
        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_when_not_found(self):
        db = _make_db(data=[])
        with patch("app.clients.service.get_supabase", return_value=db):
            from app.clients import service
            result = await service.soft_delete_client(999, "test-user")
        assert result is False
