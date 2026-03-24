# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Feedback persistence via Supabase."""
import logging

from app.database import get_supabase

logger = logging.getLogger(__name__)


class FeedbackLogger:
    """Persists user feedback to the ``feedback_logs`` Supabase table."""

    @property
    def _db(self):
        return get_supabase()

    def log_feedback(self, ip: str, feedback: str, timestamp: str) -> None:
        """Insert a feedback record. Silently no-ops if DB is unavailable."""
        if not self._db:
            logger.warning("Supabase not initialised — feedback not persisted.")
            return

        try:
            self._db.table("feedback_logs").insert(
                {"ip": ip, "feedback_text": feedback, "created_at": timestamp}
            ).execute()
        except Exception as exc:
            logger.error("Failed to save feedback: %s", exc)


# Module-level singleton
feedback_logger = FeedbackLogger()
