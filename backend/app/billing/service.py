# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

import logging
from .schemas import SubscriptionResponse, CreateCheckoutSessionRequest
from app.database import get_supabase
from fastapi import HTTPException
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

async def get_user_subscription(user_id: str) -> SubscriptionResponse:
    db = get_supabase()

    try:
        user_subscription = (
            db.table("subscriptions")
            .select("*")
            .eq("user_id", user_id)
            .in_("status", ["active", "trialing"])
            .single().execute()
        )
        if not user_subscription.data:
            return SubscriptionResponse(
                active_plan="free",
                plan_state="active",
                end_date=datetime.now(timezone.utc).isoformat(),
                is_trial=False
            )
        logger.info(f"Retrieved subscription from user: {user_subscription.data}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching subscription from user {user_id}: {e}")
        return None
    
    return SubscriptionResponse(
        active_plan=user_subscription.data["plan"],
        plan_state=user_subscription.data["status"],
        end_date=user_subscription.data["current_period_end"],
        is_trial=user_subscription.data["status"] == "trialing"
    )

async def create_checkout_session(request: CreateCheckoutSessionRequest, user_id: str) -> dict:
    db = get_supabase()

    try:
        response = (
            db.table("subscription")
            .insert({
                "user_id": user_id,
                "plan": request.plan,
                "billing": request.billing,
            })
        )

    except Exception as e:
        logger.error(f"Error creating checkout session for user {user_id}: {e}")
        return None