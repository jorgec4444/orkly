# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

from pydantic import BaseModel
from datetime import datetime

class CreateCheckoutSessionRequest(BaseModel):
    plan: str
    billing: str

class SubscriptionResponse(BaseModel):
    active_plan: str
    plan_state: str
    end_date: datetime | None
    is_trial: bool