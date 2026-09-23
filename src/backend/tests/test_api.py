import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.app import app
from app.db.database import Base, get_session
from app.db.models import Job


@pytest.fixture
def client(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'test.db'}"
    test_engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=test_engine)
    test_session_local = sessionmaker(bind=test_engine)

    def override_get_session():
        with test_session_local() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    test_engine.dispose()


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
