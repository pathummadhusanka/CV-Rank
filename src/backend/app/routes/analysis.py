import logging
from time import perf_counter

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.ai.analysis_service import AIAnalysisService, CandidateDocument
from app.ai.dependencies import get_ai_provider
from app.ai.errors import AIProviderError
from app.ai.provider import AIProvider
from app.ai.schemas import AIAnalysisResult
from app.db.database import get_session
from app.db.models import CV, Job

router = APIRouter(prefix="/analysis", tags=["Analysis"])


class AnalysisRequest(BaseModel):
    cv_ids: list[str] | None = None
logger = logging.getLogger("cv_rank.analysis")


@router.post("/jobs/{job_id}", response_model=AIAnalysisResult)
def analyze_job(
    job_id: str,
    data: AnalysisRequest | None = None,
    session: Session = Depends(get_session),
    provider: AIProvider = Depends(get_ai_provider),
) -> AIAnalysisResult:
    started_at = perf_counter()
    logger.info("analysis started job_id=%s", job_id)
    job = session.get(Job, job_id)
    if not job:
        logger.warning("analysis job_not_found job_id=%s", job_id)
        raise HTTPException(status_code=404, detail="Job not found")

    cv_query = session.query(CV)
    if data and data.cv_ids is not None:
        cv_query = cv_query.filter(CV.id.in_(data.cv_ids))

    candidates = [
        CandidateDocument(cv.id, cv.filename, cv.extracted_text)
        for cv in cv_query.order_by(CV.id).all()
    ]
    logger.info("analysis inputs job_id=%s candidates=%s", job_id, len(candidates))

    try:
        result = AIAnalysisService(provider).analyze(job.description, candidates)
        logger.info(
            "analysis completed job_id=%s candidates=%s duration_ms=%.1f",
            job_id,
            len(result.candidates),
            (perf_counter() - started_at) * 1000,
        )
        return result
    except AIProviderError as exc:
        logger.exception("analysis provider_error job_id=%s", job_id)
        raise HTTPException(
            status_code=503,
            detail="AI analysis is currently unavailable",
        ) from exc
