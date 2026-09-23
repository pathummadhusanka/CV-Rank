import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.app import app
from app.db.database import Base, get_session


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
