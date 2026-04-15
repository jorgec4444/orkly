# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

import logging
from .schemas import SubscriptionResponse, CreateCheckoutSessionRequest
from app.database import get_supabase
from fastapi import HTTPException, Request
from datetime import datetime, timezone
import stripe
from app.billing.config import STRIPE_SECRET_KEY, TRIAL_PERIOD_DAYS, get_price_id, STRIPE_WEBHOOK_SECRET, stripe_price_ids

stripe.api_key = STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)

async def get_user_subscription(user_id: str) -> SubscriptionResponse:
    db = get_supabase()

    try:
        user_subscription = (
            db.table("subscriptions")
            .select("*")
            .eq("user_id", user_id)
            .in_("status", ["active", "trialing"])
            .execute()
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
        logger.error(f"Error fetching subscription: {e}")
        return SubscriptionResponse(
            active_plan="free", plan_state="active",
            end_date=None, is_trial=False
        )
    
    user_subscription = user_subscription.data[0]
    return SubscriptionResponse(
        active_plan=user_subscription["plan"],
        plan_state=user_subscription["status"],
        end_date=user_subscription["current_period_end"],
        is_trial=user_subscription["status"] == "trialing"
    )

async def create_user_checkout_session(
    request: CreateCheckoutSessionRequest,
    user_id: str,
    user_email: str
) -> dict:
    try:
        price_id = get_price_id(request.plan, request.billing)
        if not price_id:
            raise HTTPException(status_code=400, detail="Invalid plan or billing period")

        db = get_supabase()
        existing = (
            db.table("subscriptions")
            .select("stripe_customer_id")
            .eq("user_id", user_id)
            .execute()
        )

        stripe_customer_id = None
        if existing.data:
            stripe_customer_id = existing.data[0].get("stripe_customer_id")

        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=user_email,
                metadata={"user_id": user_id}
            )
            stripe_customer_id = customer.id

            db.table("subscriptions").insert({
                "user_id": user_id,
                "stripe_customer_id": stripe_customer_id,
                "plan": "free",
                "status": "active",
                "current_period_end": None,
            }).execute()

        session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            subscription_data={
                "trial_period_days": TRIAL_PERIOD_DAYS,
                "metadata": {"user_id": user_id, "plan": request.plan}
            },
            success_url="https://orkly.app/dashboard?success=true",
            cancel_url="https://orkly.app/pricing",
            metadata={"user_id": user_id, "plan": request.plan}
        )

        logger.info(f"Checkout session created for user {user_id}, plan {request.plan}")
        return {"checkout_url": session.url}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating checkout session for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating checkout session: {e}")
    

async def process_webhooks(request: Request) -> dict:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        await handle_checkout_completed(data)
    elif event_type == "customer.subscription.updated":
        await handle_subscription_updated(data)
    elif event_type == "customer.subscription.deleted":
        await handle_subscription_deleted(data)
    elif event_type == "invoice.payment_failed":
        await handle_payment_failed(data)
    elif event_type == "invoice.payment_succeeded":
        await handle_payment_succeeded(data)
    else:
        logger.info(f"Unhandled event type: {event_type}")

    return {"status": "ok"}

async def handle_checkout_completed(data: dict):
    db = get_supabase()
    try:
        subscription = stripe.Subscription.retrieve(data["subscription"])
        status = subscription.status
        period_end = subscription.trial_end or subscription.current_period_end
        current_period_end = datetime.fromtimestamp(
            period_end, tz=timezone.utc
        ).isoformat() if period_end else None

        result = db.table("subscriptions").update({
            "plan": data["metadata"]["plan"],
            "stripe_subscription_id": data["subscription"],
            "status": status,
            "current_period_end": current_period_end,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("stripe_customer_id", data["customer"]).execute()
        if not result.data:
            logger.error(f"No subscription row found for customer {data['customer']}")

        logger.info(f"Checkout completed for customer {data['customer']}, plan {data['metadata']['plan']}")
    except Exception as e:
        logger.error(f"Error handling checkout completed: {e}")


async def handle_subscription_updated(data: dict):
    db = get_supabase()
    try:
        price_id = data["items"]["data"][0]["price"]["id"]
        plan = "free"
        for plan_name, billing_periods in stripe_price_ids.items():
            if price_id in billing_periods.values():
                plan = plan_name
                break

        period_end = data.get("trial_end") or data.get("current_period_end")
        current_period_end = datetime.fromtimestamp(
            period_end, tz=timezone.utc
        ).isoformat() if period_end else None

        db.table("subscriptions").update({
            "plan": plan,
            "status": data["status"],
            "current_period_end": current_period_end,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("stripe_subscription_id", data["id"]).execute()

        logger.info(f"Subscription updated for {data['id']}, plan {plan}, status {data['status']}")
    except Exception as e:
        logger.error(f"Error handling subscription updated: {e}")


async def handle_subscription_deleted(data: dict):
    db = get_supabase()
    try:
        db.table("subscriptions").update({
            "plan": "free",
            "status": "cancelled",
            "stripe_subscription_id": None,
            "current_period_end": None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("stripe_subscription_id", data["id"]).execute()

        logger.info(f"Subscription deleted for {data['id']}, reverted to free")
    except Exception as e:
        logger.error(f"Error handling subscription deleted: {e}")


async def handle_payment_failed(data: dict):
    db = get_supabase()
    try:
        db.table("subscriptions").update({
            "status": "past_due",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("stripe_customer_id", data["customer"]).execute()

        logger.info(f"Payment failed for customer {data['customer']}")
    except Exception as e:
        logger.error(f"Error handling payment failed: {e}")


async def handle_payment_succeeded(data: dict):
    db = get_supabase()
    try:
        period_end = data["lines"]["data"][0]["period"]["end"]
        current_period_end = datetime.fromtimestamp(
            period_end, tz=timezone.utc
        ).isoformat()

        db.table("subscriptions").update({
            "status": "active",
            "current_period_end": current_period_end,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("stripe_customer_id", data["customer"]).execute()

        logger.info(f"Payment succeeded for customer {data['customer']}")
    except Exception as e:
        logger.error(f"Error handling payment succeeded: {e}")


async def create_portal_session(user_id: str) -> dict:
    db = get_supabase()
    try:
        existing = db.table("subscriptions").select("stripe_customer_id").eq("user_id", user_id).execute()
        if not existing.data or not existing.data[0].get("stripe_customer_id"):
            raise HTTPException(status_code=404, detail="No subscription found")
        
        stripe_customer_id = existing.data[0]["stripe_customer_id"]
        
        session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url="https://orkly.app/dashboard/settings",
        )
        return {"portal_url": session.url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating portal session for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating portal session: {e}")