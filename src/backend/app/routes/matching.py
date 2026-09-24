from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_session
from app.db.models import CV, Job
from app.schemas import MatchingResponse, RankingResponse
from app.services.matching_service import match_candidate, rank_candidates
from app.services.scoring_service import calculate_score

router = APIRouter(prefix="/matching", tags=["Matching"])


@router.post("/jobs/{job_id}")
def rank_job_candidates(
    job_id: str,
    session: Session = Depends(get_session),
) -> RankingResponse:
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    candidates = session.query(CV).all()
    ranked_candidates = rank_candidates(
        candidates,
        job,
        calculate_score,
    )

    return {
        "job_id": job.id,
        "candidates": ranked_candidates,
    }


@router.post("/jobs/{job_id}/cvs/{cv_id}")
def match_cv_to_job(
    job_id: str,
    cv_id: str,
    session: Session = Depends(get_session),
) -> MatchingResponse:
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    cv = session.get(CV, cv_id)
    if not cv:
        raise HTTPException(
            status_code=404,
            detail="CV not found",
        )

    result = match_candidate(cv, job)
    score = calculate_score(result)

    return {
        "job_id": job.id,
        "cv_id": cv.id,
        "match": result,
        "score": score,
    }