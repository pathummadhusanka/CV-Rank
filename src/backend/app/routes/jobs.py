from uuid import uuid4
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_session
from app.services.job_service import create_job
from app.services.job_parser import parse_job_description


router = APIRouter(prefix="/jobs", tags=["Jobs"])


class JobCreate(BaseModel):
    title: str
    description: str


@router.post("")
def create_job_endpoint(
    data: JobCreate,
    session: Session = Depends(get_session),
):
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