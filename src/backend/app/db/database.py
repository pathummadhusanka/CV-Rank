from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from collections.abc import Generator

from app.core.config import settings


DATABASE_DIR = Path("storage")
DATABASE_DIR.mkdir(parents=True, exist_ok=True)


connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
)


class Base(DeclarativeBase):
    pass


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

def get_session() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session

def create_tables():
    from app.db.models import CV, DatabaseState, ExtractionTerm, Job

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        if not session.query(ExtractionTerm).first():
            session.add_all([
                ExtractionTerm(term=term, category="skill")
                for term in ["python", "sql", "docker", "project management", "customer service", "sales", "accounting"]
            ])
            session.commit()

        if session.get(DatabaseState, "initial_data_seeded"):
            return

        if not session.query(Job).first():
            session.add_all(
                [
                    Job(
                        id="seed-job-ai-intern",
                        title="AI Intern",
                        description="We are looking for an AI Intern with Python and machine learning experience.\n\nRequirements:\n\n- Python\n- Machine Learning\n- SQL\n- Git\n- Docker\n- At least 1 year of experience\n- Bachelor's degree in Computer Science or a related field",
                        required_skills="python,machine learning,sql,git,docker",
                        experience_years=1,
                        education="Bachelor's degree in Computer Science or a related field",
                    ),
                    Job(
                        id="seed-job-backend-engineer",
                        title="Backend Engineering Intern",
                        description="We are looking for a Backend Engineering Intern with experience in Python and FastAPI.\n\nRequirements:\n\n- Python\n- FastAPI\n- SQL\n- PostgreSQL\n- Docker\n- Git\n- At least 1 year of experience\n- Bachelor's degree in Computer Science or a related field",
                        required_skills="python,fastapi,sql,postgresql,docker,git",
                        experience_years=1,
                        education="Bachelor's degree in Computer Science or a related field",
                    ),
                ]
            )

        if not session.query(CV).first():
            session.add_all(
                [
                    CV(
                        id="seed-cv-alex",
                        filename="candidate_001_alex_perera.pdf",
                        file_path="storage/cvs/seed-cv-alex.pdf",
                        extracted_text="Alex Perera\nPython developer with SQL, Docker, Git, and machine learning projects.",
                        skills="python,sql,docker,git,machine learning",
                        experience_years=1,
                        education="Computer Science",
                        status="processed",
                    ),
                    CV(
                        id="seed-cv-jamie",
                        filename="candidate_002_jamie_silva.pdf",
                        file_path="storage/cvs/seed-cv-jamie.pdf",
                        extracted_text="Jamie Silva\nBackend developer with Python, FastAPI, PostgreSQL, SQL, Docker, and Git experience.",
                        skills="python,fastapi,postgresql,sql,docker,git",
                        experience_years=2,
                        education="Computer Science",
                        status="processed",
                    ),
                ]
            )

        session.add(DatabaseState(key="initial_data_seeded", value="true"))
        session.commit()