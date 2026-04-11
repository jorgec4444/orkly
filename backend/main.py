# Copyright © 2026 Jorge Vinagre
# SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause

"""Orkly — FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import init_openai_client, init_r2_client, init_r2_logos_client
from app.database import init_supabase
from app.text_generation.controller import router as text_generation_router
from app.rate_limit.controller import router as rate_limit_router
from app.feedback.controller import router as feedback_router
from app.admin.controller import router as admin_router
from app.clients.controller import router as clients_router
from app.storage.controller import router as storage_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s: %(message)s")
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    logger.info("Starting Orkly`…")
    init_supabase()
    init_openai_client()
    init_r2_client()
    init_r2_logos_client()
    logger.info("Startup complete.")
    yield
    logger.info("Shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Orkly",
    description="Orchestrate your content, and more with AI.",
    version="2.0.0",
    contact={"name": "Jorge Vinagre", "email": "jorgecdev444@gmail.com"},
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://orkly-testing.vinagre444.workers.dev", "https://orkly.app", "https://orkly.vinagre444.workers.dev", "http://localhost:5173" ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"]
)


# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(text_generation_router)
app.include_router(rate_limit_router)
app.include_router(feedback_router)
app.include_router(admin_router)
app.include_router(clients_router)
app.include_router(storage_router)

@app.get("/", tags=["meta"])
async def root():
    return {
        "service": "Orkly",
        "version": "2.0.0",
        "endpoints": {
            "POST /text-generation/improve": "Improve a text with AI (3 variations)",
            "POST /text-generation/save": "Save a text generation record for analytics",
            "GET  /rate-limit/status": "Check remaining free generations",
            "POST /feedback": "Submit feedback",
            "GET  /health": "Health check",
            "GET  /admin/stats": "Admin statistics",
            "POST /clients/create": "Create a new client",
            "GET  /clients/list": "List clients for the authenticated user",
            "GET  /clients/{client_id}": "Get details of a specific client",
            "GET  /clients/{client_id}/generations": "Get generations for a specific client",
            "PUT  /clients/{client_id}": "Update a client's name or brand voice",
            "POST /storage/upload/{client_id}/{folder}": "Generate a pre-signed URL for uploading a file to S3",
            "GET  /storage/download/{client_id}/{folder}/{file_id}": "Generate a pre-signed URL for downloading a file from S3",
            "GET  /storage/list/{client_id}/{folder}": "List files in a specific S3 folder for a client",
            "DELETE /storage/delete/{client_id}/{folder}/{file_id}": "Delete a file from S3",
            "POST /storage/save-file/{SaveFileMetadataRequest}": "Save file metadata to the database after a successful upload"
        },
    }


@app.get("/health", tags=["meta"])
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}