from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.models import Job


def test_health_check(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "service": "cv-rank",
        "version": "0.1.0",
        "status": "ok",
    }


def test_create_job_persists_job(client, tmp_path):
    response = client.post(
        "/jobs",
        json={
            "title": "Backend Engineer",
            "description": "Python, FastAPI, and at least 3 years of experience.",
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["title"] == "Backend Engineer"
    assert result["status"] == "created"
    assert set(result["requirements"]["skills"]) == {"python", "fastapi"}
    assert result["requirements"]["experience_years"] == 3
    assert result["requirements"]["education"] is None

    database_url = f"sqlite:///{tmp_path / 'test.db'}"
    verification_engine = create_engine(database_url)
    with sessionmaker(bind=verification_engine)() as session:
        job = session.get(Job, result["id"])
        assert job is not None
        assert job.title == "Backend Engineer"
        assert set(job.required_skills.split(",")) == {"python", "fastapi"}
    verification_engine.dispose()


def test_create_job_requires_title(client):
    response = client.post(
        "/jobs",
        json={"description": "Python experience required."},
    )

    assert response.status_code == 422


def test_list_jobs_returns_created_jobs(client):
    create_response = client.post(
        "/jobs",
        json={
            "title": "Backend Engineer",
            "description": "Python and SQL experience required.",
        },
    )

    response = client.get("/jobs")

    assert response.status_code == 200
    assert response.json()[0]["id"] == create_response.json()["id"]
    assert response.json()[0]["title"] == "Backend Engineer"


def test_list_cvs_returns_processed_cv_summaries(client, test_session_factory):
    from app.db.models import CV

    with test_session_factory() as session:
        session.add(
            CV(
                id="cv-1",
                filename="candidate.pdf",
                file_path="storage/cvs/candidate.pdf",
                extracted_text="Python developer",
                skills="python",
                experience_years=2,
                education=None,
                status="processed",
            )
        )
        session.commit()

    response = client.get("/cvs")

    assert response.status_code == 200
    assert response.json()[0]["id"] == "cv-1"
    assert response.json()[0]["filename"] == "candidate.pdf"
    assert response.json()[0]["status"] == "processed"
