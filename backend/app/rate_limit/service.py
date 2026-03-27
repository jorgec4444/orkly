# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Rate limiting and generation history via Supabase.

Falls back gracefully to an in-memory counter when Supabase is unavailable
so the app stays usable during development or DB outages.
"""
import logging
from collections import defaultdict
from datetime import datetime
from fastapi import HTTPException

from app.config import FREE_DAILY_LIMIT, LOGGED_DAILY_LIMIT
from app.database import get_supabase

logger = logging.getLogger(__name__)


def _today() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def _reset_time() -> str:
    return datetime.now().replace(hour=23, minute=59, second=59, microsecond=0).isoformat()


# ── In-memory fallback (keyed by "ip:date") ──────────────────────────────────
_memory_counts: dict[str, int] = defaultdict(int)


def _memory_key(ip: str) -> str:
    return f"{ip}:{_today()}"

def rate_limit_error(status: dict):
    raise HTTPException(
        status_code=429,
        detail={
            "error": "rate_limit_exceeded",
            "message": (
                f"You've reached the free limit of {status['limit']} "
                "generations per day."
            ),
            "used": status["used"],
            "limit": status["limit"],
            "remaining": status["remaining"],
            "reset_at": status["reset_at"],
        },
    )


# ── Public API ────────────────────────────────────────────────────────────────

class RateLimiter:
    """Per-IP daily rate limiter backed by Supabase with in-memory fallback."""

    # ── helpers ──────────────────────────────────────────────────────────────

    @property
    def _db(self):
        return get_supabase()

    def _build_status(self, count: int, limit: int) -> dict:
        remaining = max(0, limit - count)
        return {
            "allowed": count < limit,
            "used": count,
            "remaining": remaining,
            "limit": limit,
            "reset_at": _reset_time(),
        }

    def _fallback_status(self) -> dict:
        """Return permissive status when DB is unavailable."""
        return self._build_status(0, FREE_DAILY_LIMIT)

    # ── check ─────────────────────────────────────────────────────────────────

    def check_limit(self, ip: str) -> dict:
        """Return rate-limit status for *ip*."""
        if not self._db:
            count = _memory_counts[_memory_key(ip)]
            return self._build_status(count, FREE_DAILY_LIMIT)

        try:
            resp = (
                self._db.table("rate_limits")
                .select("count")
                .eq("ip", ip)
                .eq("date", _today())
                .execute()
            )
            count = resp.data[0]["count"] if resp.data else 0
            return self._build_status(count, FREE_DAILY_LIMIT)
        except Exception as exc:
            logger.error("check_limit DB error for ip=%s: %s", ip, exc)
            return self._fallback_status()
        

    def check_limit_user(self, user_id: str) -> dict:
        if not self._db:
            count = _memory_counts[f"{user_id}:{_today()}"]
            return self._build_status(count, LOGGED_DAILY_LIMIT)
        try:
            resp = (
                self._db.table("rate_limits")
                .select("count")
                .eq("user_id", user_id)
                .eq("date", _today())
                .execute()
            )
            count = resp.data[0]["count"] if resp.data else 0
            return self._build_status(count, LOGGED_DAILY_LIMIT)
        except Exception as exc:
            logger.error("check_limit_user DB error: %s", exc)
            return self._build_status(0, LOGGED_DAILY_LIMIT)
    
    # ── increment ─────────────────────────────────────────────────────────────

    def increment(self, ip: str) -> None:
        """Increment the usage counter for *ip*."""
        if not self._db:
            _memory_counts[_memory_key(ip)] += 1
            return

        today = _today()
        now = datetime.now().isoformat()
        try:
            resp = (
                self._db.table("rate_limits")
                .select("id, count")
                .eq("ip", ip)
                .eq("date", today)
                .execute()
            )

            if resp.data:
                row_id = resp.data[0]["id"]
                new_count = resp.data[0]["count"] + 1
                self._db.table("rate_limits").update(
                    {"count": new_count, "last_used_at": now}
                ).eq("id", row_id).execute()
            else:
                self._db.table("rate_limits").insert(
                    {
                        "ip": ip,
                        "count": 1,
                        "date": today,
                        "last_used_at": now,
                        "created_at": now,
                    }
                ).execute()
        except Exception as exc:
            logger.error("increment DB error for ip=%s: %s", ip, exc)
            # Degrade gracefully — don't block the user
            _memory_counts[_memory_key(ip)] += 1

    def increment_user(self, user_id: str) -> None:
        """Increment the usage counter for *user_id*."""
        if not self._db:
            _memory_counts[_memory_key(user_id)] += 1
            return

        today = _today()
        now = datetime.now().isoformat()
        try:
            resp = (
                self._db.table("rate_limits")
                .select("id, count")
                .eq("user_id", user_id)
                .eq("date", today)
                .execute()
            )

            if resp.data:
                row_id = resp.data[0]["id"]
                new_count = resp.data[0]["count"] + 1
                self._db.table("rate_limits").update(
                    {"count": new_count, "last_used_at": now}
                ).eq("id", row_id).execute()
            else:
                self._db.table("rate_limits").insert(
                    {
                        "user_id": user_id,
                        "count": 1,
                        "date": today,
                        "last_used_at": now,
                        "created_at": now,
                    }
                ).execute()
        except Exception as exc:
            logger.error("increment DB error for user_id=%s: %s", user_id, exc)
            # Degrade gracefully — don't block the user
            _memory_counts[_memory_key(user_id)] += 1


# Module-level singleton
rate_limiter = RateLimiter()
