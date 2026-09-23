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
    from app.db.models import CV, Job # Register the model
    Base.metadata.create_all(bind=engine)