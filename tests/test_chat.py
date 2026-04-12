# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Unit tests for chat service."""
import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock, patch


SESSION_ROW = {
    "id": "session-uuid-123",
    "user_id": "test-user",
    "client_id": None,
    "created_at": "2026-01-01T00:00:00",
}

MESSAGE_ROW = {
    "id": "msg-uuid-1",
    "session_id": "session-uuid-123",
    "role": "user",
    "content": "Hello",
    "created_at": "2026-01-01T00:00:00",
}


def _make_db_single(first_data, second_data=None):
    """DB mock where first table() call returns first_data, second returns second_data."""
    db = MagicMock()
    calls = [0]

    def _chain(*args, **kwargs):
        chain = MagicMock()
        chain.select.return_value = chain
        chain.eq.return_value = chain
        chain.order.return_value = chain
        chain.limit.return_value = chain
        chain.single.return_value = chain
        chain.insert.return_value = chain
        chain.delete.return_value = chain
        idx = calls[0]
        calls[0] += 1
        data = first_data if idx == 0 else (second_data or [])
        chain.execute.return_value = MagicMock(data=data)
        return chain

    db.table.side_effect = _chain
    return db


class TestCreateSession:
    @pytest.mark.asyncio
    async def test_creates_session_without_client(self):
        db = _make_db_single(first_data=[SESSION_ROW])
        with patch("app.chat.service.get_supabase", return_value=db):
            from app.chat.schemas import ChatSessionRequest
            from app.chat import service
            req = ChatSessionRequest(client_id=None)
            result = await service.create_new_session(req, "test-user")
        assert result.id == "session-uuid-123"
        assert result.client_id is None

    @pytest.mark.asyncio
    async def test_raises_404_for_invalid_client(self):
        # client ownership check returns empty → 404
        db = _make_db_single(first_data=[])
        with patch("app.chat.service.get_supabase", return_value=db):
            from app.chat.schemas import ChatSessionRequest
            from app.chat import service
            req = ChatSessionRequest(client_id=999)
            with pytest.raises(HTTPException) as exc:
                await service.create_new_session(req, "test-user")
        assert exc.value.status_code == 404


class TestRetrieveSessionHistoric:
    @pytest.mark.asyncio
    async def test_returns_messages(self):
        # First call: session ownership check, second: messages
        db = _make_db_single(first_data=[SESSION_ROW], second_data=[MESSAGE_ROW])
        with patch("app.chat.service.get_supabase", return_value=db):
            from app.chat import service
            result = await service.retrieve_session_historic("session-uuid-123", "test-user")
        assert len(result) == 1
        assert result[0].role == "user"
        assert result[0].content == "Hello"

    @pytest.mark.asyncio
    async def test_returns_empty_for_new_session(self):
        db = _make_db_single(first_data=[SESSION_ROW], second_data=[])
        with patch("app.chat.service.get_supabase", return_value=db):
            from app.chat import service
            result = await service.retrieve_session_historic("session-uuid-123", "test-user")
        assert result == []

    @pytest.mark.asyncio
    async def test_raises_404_for_invalid_session(self):
        db = _make_db_single(first_data=[])
        with patch("app.chat.service.get_supabase", return_value=db):
            from app.chat import service
            with pytest.raises(HTTPException) as exc:
                await service.retrieve_session_historic("bad-session", "test-user")
        assert exc.value.status_code == 404


class TestGetUserSessions:
    @pytest.mark.asyncio
    async def test_returns_sessions(self):
        db = _make_db_single(first_data=[SESSION_ROW])
        with patch("app.chat.service.get_supabase", return_value=db):
            from app.chat import service
            result = await service.get_user_sessions("test-user")
        assert len(result) == 1
        assert result[0].id == "session-uuid-123"

    @pytest.mark.asyncio
    async def test_returns_empty_list(self):
        db = _make_db_single(first_data=[])
        with patch("app.chat.service.get_supabase", return_value=db):
            from app.chat import service
            result = await service.get_user_sessions("test-user")
        assert result == []


class TestDeleteSession:
    @pytest.mark.asyncio
    async def test_raises_404_for_missing_session(self):
        db = _make_db_single(first_data=[])
        with patch("app.chat.service.get_supabase", return_value=db):
            from app.chat import service
            with pytest.raises(HTTPException) as exc:
                await service.delete_session("bad-session", "test-user")
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_deletes_existing_session(self):
        db = _make_db_single(first_data=[SESSION_ROW], second_data=[])
        with patch("app.chat.service.get_supabase", return_value=db):
            from app.chat import service
            # Should not raise
            await service.delete_session("session-uuid-123", "test-user")
