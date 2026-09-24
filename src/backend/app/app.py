from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.ai.errors import AIProviderError
from app.routes.cvs import router as cvs_router
from app.db.database import create_tables
from app.routes.jobs import router as jobs_router
from app.routes.matching import router as matching_router
from app.routes.analysis import router as analysis_router


app = FastAPI()


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

app.include_router(cvs_router)
app.include_router(jobs_router)
app.include_router(matching_router)
app.include_router(analysis_router)