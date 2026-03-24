# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause
"""Admin-related business logic and database interactions."""

import logging

from app.config import FREE_DAILY_LIMIT
from app.rate_limit.service import _today
from app.database import get_supabase

logger = logging.getLogger(__name__)

def get_stats() -> dict:
    """Return aggregated daily and all-time stats."""
    
    db = get_supabase()
    if not db:
        return {"error": "Database not connected"}

    today = _today()
    try:
        rate_rows = (
            db.table("rate_limits")
            .select("count")
            .eq("date", today)
            .execute()
        )
        rows = rate_rows.data or []
        total_ips = len(rows)
        total_requests = sum(r["count"] for r in rows)
        at_limit = sum(1 for r in rows if r["count"] >= FREE_DAILY_LIMIT)

        gen_resp = (
            db.table("generations")
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