# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

import os

TRIAL_PERIOD_DAYS = 14
STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY") 

stripe_price_ids = {
    "solo": {
        "monthly": os.getenv("STRIPE_SOLO_MONTHLY"),
        "yearly": os.getenv("STRIPE_SOLO_YEARLY")
    },
    "pro": {
        "monthly": os.getenv("STRIPE_PRO_MONTHLY"),
        "yearly": os.getenv("STRIPE_PRO_YEARLY")
    },
    "agency": {
        "monthly": os.getenv("STRIPE_AGENCY_MONTHLY"),
        "yearly": os.getenv("STRIPE_AGENCY_YEARLY")
    }
}

def get_price_id(plan: str, billing: str) -> str | None:
    return stripe_price_ids.get(plan, {}).get(billing)