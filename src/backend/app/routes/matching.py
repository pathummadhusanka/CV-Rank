from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_session
from app.db.models import CV, Job
from app.services.matching_service import match_candidate

router = APIRouter(prefix="/matching", tags=["Matching"])


@router.post("/jobs/{job_id}/cvs/{cv_id}")
def match_cv_to_job(
    job_id: str,
    cv_id: str,
    session: Session = Depends(get_session),
):
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

    return {
        "job_id": job.id,
        "cv_id": cv.id,
        "match": result,
    }