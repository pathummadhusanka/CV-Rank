from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai.analysis_service import AIAnalysisService, CandidateDocument
from app.ai.dependencies import get_ai_provider
from app.ai.errors import AIProviderError
from app.ai.provider import AIProvider
from app.ai.schemas import AIAnalysisResult
from app.db.database import get_session
from app.db.models import CV, Job

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post("/jobs/{job_id}", response_model=AIAnalysisResult)
def analyze_job(
    job_id: str,
    session: Session = Depends(get_session),
    provider: AIProvider = Depends(get_ai_provider),
) -> AIAnalysisResult:
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    candidates = [
        CandidateDocument(cv.id, cv.filename, cv.extracted_text)
        for cv in session.query(CV).order_by(CV.id).all()
    ]

    try:
        return AIAnalysisService(provider).analyze(job.description, candidates)
    except AIProviderError as exc:
        raise HTTPException(
            status_code=503,
            detail="AI analysis is currently unavailable",
        ) from exc
