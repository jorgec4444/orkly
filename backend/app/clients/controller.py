# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause
"""Client-related API endpoints (protected by API key)."""

import logging

from app.auth.dependencies import get_current_user
from app.text_generation.schemas import GenerationsResponse
from .schemas import ClientResponse, ClientCreateRequest, ClientUpdateRequest
from . import service
from fastapi import APIRouter, Depends, status, HTTPException, UploadFile

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
 
@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: int, user = Depends(get_current_user)):
    """Return a specific client by ID, if it belongs to the authenticated user."""

    client = await service.get_client_by_id(client_id=client_id, user_id=user.id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.get("/{client_id}/generations", response_model=list[GenerationsResponse])
async def get_client_generations(client_id: int, user = Depends(get_current_user)):
    """Return generations for a specific client."""

    return await service.get_client_generations(client_id=client_id, user_id=user.id)

 
 
@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int, body: ClientUpdateRequest, user = Depends(get_current_user)
):
    """Update client name or brand voice."""

    update_data = body.model_dump(exclude_unset=True)

    updated = await service.update_client(
        client_id=client_id,
        user_id=user.id,
        **update_data
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

@router.post("/{client_id}/logo", response_model=dict)
async def upload_logo(
    client_id: int,
    file: UploadFile,
    user = Depends(get_current_user)
):
    """Upload a client logo directly to R2 logos bucket."""
    return await service.upload_client_logo(client_id, file, user.id)

@router.delete("/{client_id}/logo", status_code=status.HTTP_204_NO_CONTENT)
async def delete_logo(client_id: int, user = Depends(get_current_user)):
    return await service.delete_client_logo(client_id, user.id)