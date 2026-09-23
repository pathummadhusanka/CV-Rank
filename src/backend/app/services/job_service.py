from sqlalchemy.orm import Session

from app.db.models import Job


def create_job(
    session: Session,
    job_id: str,
    title: str,
    description: str,
) -> Job:
    job = Job(
        id=job_id,
        title=title,
        description=description,
    )

    session.add(job)
    session.commit()

    return job