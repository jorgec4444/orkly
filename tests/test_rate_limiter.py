# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Unit tests for app.rate_limiter."""
from unittest.mock import MagicMock, patch

from backend.app.rate_limiter import RateLimiter, _memory_counts


def _make_db(rows=None, count=0):
    """Build a minimal Supabase mock returning *rows* for any query."""
    db = MagicMock()
    chain = MagicMock()
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.update.return_value = chain
    chain.insert.return_value = chain
    chain.execute.return_value = MagicMock(data=rows or [], count=count)
    db.table.return_value = chain
    return db


class TestCheckLimit:
    def test_new_ip_is_allowed(self):
        rl = RateLimiter()
        with patch("backend.app.rate_limiter.get_supabase", return_value=_make_db(rows=[])):
            status = rl.check_limit("1.2.3.4")
        assert status["allowed"] is True
        assert status["used"] == 0

    def test_ip_at_limit_is_blocked(self):
        from backend.app.config import FREE_DAILY_LIMIT
        rows = [{"count": FREE_DAILY_LIMIT}]
        rl = RateLimiter()
        with patch("backend.app.rate_limiter.get_supabase", return_value=_make_db(rows=rows)):
            status = rl.check_limit("1.2.3.4")
        assert status["allowed"] is False
        assert status["remaining"] == 0

    def test_fallback_allows_when_db_is_none(self):
        rl = RateLimiter()
        with patch("backend.app.rate_limiter.get_supabase", return_value=None):
            status = rl.check_limit("1.2.3.4")
        assert status["allowed"] is True

    def test_fallback_allows_on_db_error(self):
        db = MagicMock()
        db.table.side_effect = Exception("db down")
        rl = RateLimiter()
        with patch("backend.app.rate_limiter.get_supabase", return_value=db):
            status = rl.check_limit("1.2.3.4")
        assert status["allowed"] is True


class TestIncrement:
    def test_creates_new_row_when_none_exists(self):
        db = _make_db(rows=[])
        rl = RateLimiter()
        with patch("backend.app.rate_limiter.get_supabase", return_value=db):
            rl.increment("1.2.3.4")
        db.table.return_value.insert.assert_called_once()

    def test_updates_existing_row(self):
        db = _make_db(rows=[{"id": 42, "count": 2}])
        rl = RateLimiter()
        with patch("backend.app.rate_limiter.get_supabase", return_value=db):
            rl.increment("1.2.3.4")
        db.table.return_value.update.assert_called_once()

    def test_memory_fallback_increments_counter(self):
        _memory_counts.clear()
        rl = RateLimiter()
        with patch("backend.app.rate_limiter.get_supabase", return_value=None):
            rl.increment("5.6.7.8")
            rl.increment("5.6.7.8")
        from backend.app.rate_limiter import _today
        assert _memory_counts[f"5.6.7.8:{_today()}"] == 2

    def test_memory_fallback_on_db_error(self):
        _memory_counts.clear()
        db = MagicMock()
        db.table.side_effect = Exception("db down")
        rl = RateLimiter()
        with patch("backend.app.rate_limiter.get_supabase", return_value=db):
            rl.increment("9.9.9.9")
        from backend.app.rate_limiter import _today
        assert _memory_counts[f"9.9.9.9:{_today()}"] == 1


class TestSaveGeneration:
    def test_inserts_record(self):
        db = _make_db()
        rl = RateLimiter()
        with patch("backend.app.rate_limiter.get_supabase", return_value=db):
            rl.save_generation("1.1.1.1", "orig", "improved", "casual")
        db.table.return_value.insert.assert_called_once()

    def test_no_op_without_db(self):
        rl = RateLimiter()
        # Should not raise
        with patch("backend.app.rate_limiter.get_supabase", return_value=None):
            rl.save_generation("1.1.1.1", "orig", "improved", "viral")


class TestGetStats:
    def test_returns_error_without_db(self):
        rl = RateLimiter()
        with patch("backend.app.rate_limiter.get_supabase", return_value=None):
            result = rl.get_stats()
        assert "error" in result

    def test_aggregates_stats(self):
        from backend.app.config import FREE_DAILY_LIMIT
        rows = [{"count": 3}, {"count": FREE_DAILY_LIMIT}]
        db = _make_db(rows=rows, count=10)
        rl = RateLimiter()
        with patch("backend.app.rate_limiter.get_supabase", return_value=db):
            stats = rl.get_stats()
        assert stats["today"]["unique_ips"] == 2
        assert stats["today"]["total_requests"] == 3 + FREE_DAILY_LIMIT
        assert stats["today"]["ips_at_limit"] == 1
