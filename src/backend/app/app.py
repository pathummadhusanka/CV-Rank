import logging
import os
from time import perf_counter

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.ai.errors import AIProviderError
from app.core.config import settings
from app.routes.cvs import router as cvs_router
from app.db.database import create_tables
from app.routes.jobs import router as jobs_router
from app.routes.matching import router as matching_router
from app.routes.analysis import router as analysis_router


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
        content={"detail": "AI analysis is currently unavailable"},
    )

create_tables()

@app.get("/health")
def health_check():
    return {
        "service": "cv-rank",
        "version": "0.1.0",
        "status": "ok",
    }


@app.get("/health/ai")
def ai_health_check():
    configured = settings.ai_provider == "mock" or settings.ai_api_key is not None
    logger.info(
        "ai health provider=%s model=%s configured=%s",
        settings.ai_provider,
        settings.ai_model,
        configured,
    )
    return {
        "provider": settings.ai_provider,
        "model": settings.ai_model,
        "configured": configured,
        "status": "configured" if configured else "missing_api_key",
    }

app.include_router(cvs_router)
app.include_router(jobs_router)
app.include_router(matching_router)
app.include_router(analysis_router)