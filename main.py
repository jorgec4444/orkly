"""TweetCraft AI — FastAPI application entry point."""
import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app.ai import improve_tweet_with_ai
from app.config import ADMIN_API_KEY, init_openai_client
from app.database import init_supabase
from app.feedback import feedback_logger
from app.rate_limiter import rate_limiter
from app.schemas import (
    FeedbackRequest,
    RateLimitStatus,
    TweetRequest,
    TweetResponse,
    TweetVariation,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s: %(message)s")
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    logger.info("Starting TweetCraft AI…")
    init_supabase()
    init_openai_client()
    logger.info("Startup complete.")
    yield
    logger.info("Shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="TweetCraft AI",
    description="Improve tweets with AI and generate shareable images.",
    version="2.0.0",
    contact={"name": "Jorge Vinagre", "email": "jorgecdev444@gmail.com"},
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_client_ip(request: Request) -> str:
    """Extract the real client IP, respecting X-Forwarded-For (Railway/proxies)."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host


def _rate_limit_error(status: dict):
    raise HTTPException(
        status_code=429,
        detail={
            "error": "rate_limit_exceeded",
            "message": (
                f"You've reached the free limit of {status['limit']} "
                "generations per day."
            ),
            "used": status["used"],
            "limit": status["limit"],
            "remaining": status["remaining"],
            "reset_at": status["reset_at"],
        },
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["meta"])
async def root():
    return {
        "service": "TweetCraft AI",
        "version": "2.0.0",
        "endpoints": {
            "POST /improve": "Improve a tweet with AI (3 variations)",
            "GET  /rate-limit/status": "Check remaining free generations",
            "POST /feedback": "Submit feedback",
            "GET  /health": "Health check",
            "GET  /admin/stats": "Admin statistics (requires API key)",
        },
    }


@app.get("/health", tags=["meta"])
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/improve", response_model=TweetResponse, tags=["tweets"])
async def improve_tweet(request: TweetRequest, req: Request):
    """Return three AI-improved variations of the submitted tweet."""
    ip = _get_client_ip(req)
    status = rate_limiter.check_limit(ip)
    if not status["allowed"]:
        _rate_limit_error(status)

    # Run all three styles in parallel
    professional, casual, viral = await asyncio.gather(
        improve_tweet_with_ai(request.text, "professional"),
        improve_tweet_with_ai(request.text, "casual"),
        improve_tweet_with_ai(request.text, "viral"),
    )

    variations = [
        TweetVariation(version="professional", text=professional, description="Tono profesional para LinkedIn"),
        TweetVariation(version="casual",       text=casual,       description="Tono casual y cercano"),
        TweetVariation(version="viral",        text=viral,        description="Optimizado para engagement"),
    ]

    rate_limiter.increment(ip)
    # Persist first variation for analytics (best-effort, non-blocking)
    rate_limiter.save_generation(
        ip=ip,
        original=request.text,
        improved=professional,
        style="professional",
    )

    return TweetResponse(original=request.text, variations=variations)


@app.get("/rate-limit/status", response_model=RateLimitStatus, tags=["rate-limit"])
async def get_rate_limit_status(req: Request):
    """Return the current rate-limit status for the caller's IP."""
    return rate_limiter.check_limit(_get_client_ip(req))


@app.post("/feedback", tags=["misc"])
async def receive_feedback(body: FeedbackRequest, req: Request):
    """Store user feedback."""
    feedback_logger.log_feedback(
        ip=_get_client_ip(req),
        feedback=body.feedback,
        timestamp=datetime.now().isoformat(),
    )
    return {"success": True, "message": "Feedback received — thank you!"}


@app.get("/admin/stats", tags=["admin"])
async def admin_stats(api_key: str | None = None):
    """Aggregated usage statistics (protected by ADMIN_API_KEY)."""
    if not ADMIN_API_KEY or api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return rate_limiter.get_stats()
