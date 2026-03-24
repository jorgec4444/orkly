# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

from fastapi import APIRouter, Request

from .service import rate_limiter
from .schemas import RateLimitStatus
from app.utils.http import get_client_ip

router = APIRouter()

@router.get("/rate-limit/status", response_model=RateLimitStatus, tags=["rate-limit"])
async def get_rate_limit_status(req: Request):
    """Return the current rate-limit status for the caller's IP."""
    return rate_limiter.check_limit(get_client_ip(req))