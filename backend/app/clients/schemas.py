# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause
"""Pydantic schemas for client-related API endpoints."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

class ClientResponse(BaseModel):
    id: int
    client_name: str
    created_at: Optional[datetime] | None
    brand_voice: Optional[str] | None
    platforms: Optional[list[str]] | None
    custom_folders: Optional[list[str]] | None
    logo_url: Optional[str] | None

    model_config = {"from_attributes": True}

class ClientCreateRequest(BaseModel):
    client_name: str = Field(min_length=1, max_length=100)
    brand_voice: Optional[str] | None = Field(default=None, max_length=1000)

class ClientUpdateRequest(BaseModel):
    client_name: str | None = Field(default=None, min_length=1, max_length=100)
    brand_voice: str | None = Field(default=None, max_length=1000)
    platforms: list[str] | None = Field(default=None)
    custom_folders: list[str] | None = Field(default=None)
    logo_url: str | None = Field(default=None)