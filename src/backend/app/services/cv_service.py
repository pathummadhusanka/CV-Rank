from sqlalchemy.orm import Session

from app.db.models import CV


def create_cv(
    session: Session,
    cv_id: str,
    filename: str,
    file_path: str,
    extracted_text: str,
) -> CV:
    cv = CV(
        id=cv_id,
        filename=filename,
        file_path=file_path,
        extracted_text=extracted_text,
        status="processed",
    )

    session.add(cv)
    session.commit()

    return cv