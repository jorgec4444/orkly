# Copyright © 2025 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Pydantic schemas for request/response validation."""
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class TweetRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500, description="Tweet text to improve")
    style: Optional[str] = Field("professional", description="Improvement style")

    @field_validator("text")
    @classmethod
    def text_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Tweet text cannot be blank")
        return v.strip()


class TweetVariation(BaseModel):
    version: str
    text: str
    description: str


class TweetResponse(BaseModel):
    original: str
    variations: List[TweetVariation]


class FeedbackRequest(BaseModel):
    feedback: str = Field(..., min_length=1, max_length=2000, description="User feedback text")

    @field_validator("feedback")
    @classmethod
    def feedback_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Feedback cannot be blank")
        return v.strip()


class RateLimitStatus(BaseModel):
    allowed: bool
    used: int
    remaining: int
    limit: int
    reset_at: str
