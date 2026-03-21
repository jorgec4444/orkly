# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Pydantic schemas for request/response validation."""
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500, description="Text to improve")
    style: Optional[str] = Field("professional", description="Improvement style")

    @field_validator("text")
    @classmethod
    def text_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Text cannot be blank")
        return v.strip()


class SaveTextVariationRequest(BaseModel):
    original_text: str = Field(..., min_length=1, max_length=500, description="Text to improve")
    selected_text: str = Field(..., min_length=1, max_length=1000, description="Text to improve")
    style: str = Field(..., description="Improvement style")

    @field_validator("original_text")
    @classmethod
    def validate_original_text(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Original text cannot be blank")
        return v.strip()
    
    @field_validator("selected_text")
    @classmethod
    def validate_selected_text(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Selected text cannot be blank")
        return v.strip()
    

class TextVariation(BaseModel):
    version: str
    text: str
    description: str


class TextResponse(BaseModel):
    original: str
    variations: List[TextVariation]


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
