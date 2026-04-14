# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

import logging
from fastapi import APIRouter, Depends, Request
from app.auth.dependencies import get_current_user
from . import service
from .schemas import SubscriptionResponse, CreateCheckoutSessionRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])

@router.post("/webhook")
async def stripe_webhook(request: Request):
    return await service.process_webhooks(request)

@router.post("/create-checkout-session")
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    user = Depends(get_current_user)
):
    return await service.create_user_checkout_session(request, user.id, user.email)

@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(user = Depends(get_current_user)):
    return await service.get_user_subscription(user.id)

@router.post("/create-portal-session")
async def create_portal_session(user = Depends(get_current_user)):
    return await service.create_portal_session(user.id)