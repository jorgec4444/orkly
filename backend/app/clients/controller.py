# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause
"""Client-related API endpoints (protected by API key)."""

import logging

from app.auth.dependencies import get_current_user
from .schemas import ClientResponse, ClientCreateRequest, ClientUpdateRequest
from . import service
from fastapi import APIRouter, Depends, status, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/client", tags=["client"], dependencies=[Depends(get_current_user)])

@router.get("/list", response_model=list[ClientResponse])
async def list_clients(user = Depends(get_current_user)):
    """Return all active clients for the authenticated user."""

    return await service.get_clients_by_user(user.id)
 
 
@router.post("/create", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(body: ClientCreateRequest, user = Depends(get_current_user)):
    """Create a new client."""

    return await service.create_client(
        user_id=user.id,
        client_name=body.client_name,
        brand_voice=body.brand_voice,
    )
 
 
@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int, body: ClientUpdateRequest, user = Depends(get_current_user)
):
    """Update client name or brand voice."""

    updated = await service.update_client(
        client_id=client_id,
        user_id=user.id,
        client_name=body.client_name,
        brand_voice=body.brand_voice,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return updated
 
 
@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(client_id: int, user = Depends(get_current_user)):
    """Soft-delete a client."""

    deleted = await service.soft_delete_client(
        client_id=client_id, user_id=user.id
    )

    if not deleted:
        raise HTTPException(status_code=404, detail="Client not found")