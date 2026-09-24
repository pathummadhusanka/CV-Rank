from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_session
from app.db.models import Job
from app.schemas import JobCreateResponse, JobSummary
from app.services.job_service import create_job
from app.services.job_parser import parse_job_description


router = APIRouter(prefix="/jobs", tags=["Jobs"])


class JobCreate(BaseModel):
    title: str
    description: str


@router.get("")
def list_jobs(
    session: Session = Depends(get_session),
) -> list[JobSummary]:
    jobs = session.query(Job).order_by(Job.created_at.desc()).all()

    return [
        {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "required_skills": job.required_skills,
            "experience_years": job.experience_years,
            "education": job.education,
            "created_at": job.created_at,
        }
        for job in jobs
    ]


@router.post("")
def create_job_endpoint(
    data: JobCreate,
    session: Session = Depends(get_session),
) -> JobCreateResponse:
    job_id = str(uuid4())

    requirements = parse_job_description(data.description)

    job = create_job(
        session=session,
        job_id=job_id,
        title=data.title,
        description=data.description,
        required_skills=",".join(requirements["skills"]),
        experience_years=requirements["experience_years"],
        education=requirements["education"],
    )

    return {
        "id": job.id,
        "title": job.title,
        "status": "created",
        "requirements": requirements,
    }


@router.delete("/{job_id}", status_code=204)
def delete_job(
    job_id: str,
    session: Session = Depends(get_session),
) -> None:
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    session.delete(job)
    session.commit()