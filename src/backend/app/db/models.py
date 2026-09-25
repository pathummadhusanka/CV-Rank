from datetime import UTC, datetime

from sqlalchemy import DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


def utc_now() -> datetime:
    return datetime.now(UTC)


class CV(Base):
    __tablename__ = "cvs"

    id: Mapped[str] = mapped_column(primary_key=True)
    filename: Mapped[str]
    file_path: Mapped[str]
    extracted_text: Mapped[str] = mapped_column(Text)

    skills: Mapped[str] = mapped_column(Text, default="")
    experience_years: Mapped[int | None]
    education: Mapped[str | None]

    status: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
    )

class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(primary_key=True)
    title: Mapped[str]
    description: Mapped[str] = mapped_column(Text)
    required_skills: Mapped[str] = mapped_column(Text, default="")
    experience_years: Mapped[int | None]
    education: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
    )


class DatabaseState(Base):
    __tablename__ = "database_state"

    key: Mapped[str] = mapped_column(primary_key=True)
    value: Mapped[str]


class ExtractionTerm(Base):
    __tablename__ = "extraction_terms"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    term: Mapped[str] = mapped_column(unique=True)
    aliases: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(default="skill")
    enabled: Mapped[bool] = mapped_column(default=True)