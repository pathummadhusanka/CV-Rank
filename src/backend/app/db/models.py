from datetime import datetime

from sqlalchemy import DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class CV(Base):
    __tablename__ = "cvs"

    id: Mapped[str] = mapped_column(primary_key=True)
    filename: Mapped[str]
    file_path: Mapped[str]
    extracted_text: Mapped[str] = mapped_column(Text)
    status: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )