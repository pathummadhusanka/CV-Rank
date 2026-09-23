from uuid import uuid4
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_session
from app.services.job_service import create_job


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

    job = create_job(
        session=session,
        job_id=job_id,
        title=data.title,
        description=data.description,
    )

    return {
        "id": job.id,
        "title": job.title,
        "status": "created",
    }