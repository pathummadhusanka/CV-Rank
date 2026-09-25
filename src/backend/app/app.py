import logging
import os
from time import perf_counter

from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.ai.errors import AIProviderError
from app.ai.openrouter_provider import check_openrouter_health
from app.core.config import settings
from app.db.database import create_tables, get_session
from app.db.models import DatabaseState
from app.routes.cvs import router as cvs_router
from app.routes.jobs import router as jobs_router
from app.routes.matching import router as matching_router
from app.routes.analysis import router as analysis_router
from app.routes.settings import router as settings_router


logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("cv_rank")

app = FastAPI()


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    started_at = perf_counter()
    response = await call_next(request)
    logger.info(
        "request method=%s path=%s status=%s duration_ms=%.1f",
        request.method,
        request.url.path,
        response.status_code,
        (perf_counter() - started_at) * 1000,
    )
    return response


@app.exception_handler(AIProviderError)
async def ai_provider_error_handler(request: Request, exc: AIProviderError):
    return JSONResponse(
        status_code=503,
        content={"detail": str(exc), "code": exc.code},
    )

create_tables()

@app.get("/health")
def health_check(session: Session = Depends(get_session)):
    db_state = session.get(DatabaseState, "db_instance_id")
    instance_id = db_state.value if db_state else "default"
    return {
        "service": "cv-rank",
        "version": "0.1.0",
        "status": "ok",
        "db_instance_id": instance_id,
    }


@app.get("/health/ai")
def ai_health_check():
    if settings.ai_provider == "mock":
        return {
            "provider": settings.ai_provider,
            "model": settings.ai_model,
            "status": "ready",
            "message": "AI analysis is ready (mock provider).",
        }
    if settings.ai_provider != "openrouter":
        return {
            "provider": settings.ai_provider,
            "model": settings.ai_model,
            "status": "unsupported_provider",
            "message": "The configured AI provider is not supported.",
        }
    result = check_openrouter_health()
    logger.info(
        "ai health provider=%s model=%s configured=%s",
        settings.ai_provider,
        settings.ai_model,
        result["status"] == "ready",
    )
    return result

app.include_router(cvs_router)
app.include_router(jobs_router)
app.include_router(matching_router)
app.include_router(analysis_router)
app.include_router(settings_router)