# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Rate limiting and generation history via Supabase.

Falls back gracefully to an in-memory counter when Supabase is unavailable
so the app stays usable during development or DB outages.
"""
import logging
from collections import defaultdict
from datetime import datetime
from typing import Optional

from .config import FREE_DAILY_LIMIT
from .database import get_supabase

logger = logging.getLogger(__name__)


def _today() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def _reset_time() -> str:
    return datetime.now().replace(hour=23, minute=59, second=59, microsecond=0).isoformat()


# ── In-memory fallback (keyed by "ip:date") ──────────────────────────────────
_memory_counts: dict[str, int] = defaultdict(int)


def _memory_key(ip: str) -> str:
    return f"{ip}:{_today()}"


# ── Public API ────────────────────────────────────────────────────────────────

class RateLimiter:
    """Per-IP daily rate limiter backed by Supabase with in-memory fallback."""

    # ── helpers ──────────────────────────────────────────────────────────────

    @property
    def _db(self):
        return get_supabase()

    def _build_status(self, count: int) -> dict:
        remaining = max(0, FREE_DAILY_LIMIT - count)
        return {
            "allowed": count < FREE_DAILY_LIMIT,
            "used": count,
            "remaining": remaining,
            "limit": FREE_DAILY_LIMIT,
            "reset_at": _reset_time(),
        }

    def _fallback_status(self) -> dict:
        """Return permissive status when DB is unavailable."""
        return self._build_status(0)

    # ── check ─────────────────────────────────────────────────────────────────

    def check_limit(self, ip: str) -> dict:
        """Return rate-limit status for *ip*."""
        if not self._db:
            count = _memory_counts[_memory_key(ip)]
            return self._build_status(count)

        try:
            resp = (
                self._db.table("rate_limits")
                .select("count")
                .eq("ip", ip)
                .eq("date", _today())
                .execute()
            )
            count = resp.data[0]["count"] if resp.data else 0
            return self._build_status(count)
        except Exception as exc:
            logger.error("check_limit DB error for ip=%s: %s", ip, exc)
            return self._fallback_status()

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

    # ── analytics ────────────────────────────────────────────────────────────

    def save_generation(
        self, ip: str, original: str, improved: str, style: str
    ) -> None:
        """Persist a generation record for analytics (best-effort)."""
        if not self._db:
            return

        try:
            self._db.table("generations").insert(
                {
                    "ip": ip,
                    "text_original": original,
                    "text_improved": improved,
                    "style": style,
                }
            ).execute()
        except Exception as exc:
            logger.warning("save_generation failed: %s", exc)

    def get_stats(self) -> dict:
        """Return aggregated daily and all-time stats."""
        if not self._db:
            return {"error": "Database not connected"}

        today = _today()
        try:
            rate_rows = (
                self._db.table("rate_limits")
                .select("count")
                .eq("date", today)
                .execute()
            )
            rows = rate_rows.data or []
            total_ips = len(rows)
            total_requests = sum(r["count"] for r in rows)
            at_limit = sum(1 for r in rows if r["count"] >= FREE_DAILY_LIMIT)

            gen_resp = (
                self._db.table("generations")
                .select("id", count="exact")
                .execute()
            )
            total_generations = gen_resp.count or 0

            return {
                "today": {
                    "unique_ips": total_ips,
                    "total_requests": total_requests,
                    "ips_at_limit": at_limit,
                },
                "all_time": {"total_generations": total_generations},
                "free_limit": FREE_DAILY_LIMIT,
            }
        except Exception as exc:
            logger.error("get_stats error: %s", exc)
            return {"error": str(exc)}


# Module-level singleton
rate_limiter = RateLimiter()
