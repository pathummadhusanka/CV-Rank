from sqlalchemy.orm import Session

from app.db.models import Job


def create_job(
    session: Session,
    job_id: str,
    title: str,
    description: str,
    required_skills: str,
    experience_years: int | None,
    education: str | None,
) -> Job:
    job = Job(
        id=job_id,
        title=title,
        description=description,
        required_skills=required_skills,
        experience_years=experience_years,
        education=education,
    )

    session.add(job)
    session.commit()

    return job