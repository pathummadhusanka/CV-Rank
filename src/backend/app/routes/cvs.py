from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.cv_parser import extract_text
from app.db.database import get_session
from app.db.models import CV, ExtractionTerm
from app.schemas import CVDetailResponse, CVSummary, CVUploadResponse, UpdateCVTextRequest
from app.services.cv_service import create_cv
from app.services.candidate_parser import parse_candidate

router = APIRouter(prefix="/cvs", tags=["CVs"])

UPLOAD_DIR = Path("storage/cvs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Set maximum file size
MAX_UPLOAD_SIZE = settings.max_upload_size_mb * 1024 * 1024


@router.get("")
def list_cvs(
    session: Session = Depends(get_session),
) -> list[CVSummary]:
    cvs = session.query(CV).order_by(CV.created_at.desc()).all()

    return [
        {
            "id": cv.id,
            "filename": cv.filename,
            "skills": cv.skills,
            "experience_years": cv.experience_years,
            "education": cv.education,
            "status": cv.status,
            "created_at": cv.created_at,
        }
        for cv in cvs
    ]


@router.post("")
async def upload_cv(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
) -> CVUploadResponse:

    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are currently supported!",
        )
    
    cv_id = str(uuid4())
    file_path = UPLOAD_DIR / f"{cv_id}.pdf"

    file_size = 0

    with file_path.open("wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            file_size += len(chunk)

            if file_size > MAX_UPLOAD_SIZE:
                break
            
            buffer.write(chunk)

    # Validate file size
    if file_size > MAX_UPLOAD_SIZE:
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum limit({settings.max_upload_size_mb}MB)!",
        )

    text = extract_text(file_path)

    # Check if text is extracted
    if not text:
        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=400,
            detail="Could not extract text from the CV",
        )
    
    terms = session.query(ExtractionTerm).filter(ExtractionTerm.enabled.is_(True)).all()
    candidate = parse_candidate(text, terms)

    existing_cv = (
        session.query(CV)
        .filter(CV.filename == (file.filename or "unknown.pdf"), CV.extracted_text == text)
        .first()
    )
    if existing_cv:
        file_path.unlink(missing_ok=True)
        return {
            "id": existing_cv.id,
            "filename": existing_cv.filename,
            "status": "already_processed",
        }

    create_cv(
        session=session,
        cv_id=cv_id,
        filename=file.filename or "unknown.pdf",
        file_path=str(file_path),
        extracted_text=text,
        skills=candidate["skills"],
        experience_years=candidate["experience_years"],
        education=candidate["education"],
    )

    return {
        "id": cv_id,
        "filename": file.filename,
        "status": "processed",
    }


@router.get("/{cv_id}")
def get_cv_detail(
    cv_id: str,
    session: Session = Depends(get_session),
) -> CVDetailResponse:
    cv = session.get(CV, cv_id)
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    return {
        "id": cv.id,
        "filename": cv.filename,
        "extracted_text": cv.extracted_text,
        "skills": cv.skills,
        "experience_years": cv.experience_years,
        "education": cv.education,
        "status": cv.status,
        "created_at": cv.created_at,
    }


@router.get("/{cv_id}/file")
def get_cv_file(
    cv_id: str,
    session: Session = Depends(get_session),
):
    cv = session.get(CV, cv_id)
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    file_path = Path(cv.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="CV PDF file not found on disk")
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=cv.filename,
    )


@router.put("/{cv_id}/text")
def update_cv_text(
    cv_id: str,
    payload: UpdateCVTextRequest,
    session: Session = Depends(get_session),
) -> CVDetailResponse:
    cv = session.get(CV, cv_id)
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    new_text = payload.extracted_text.strip()
    if not new_text:
        raise HTTPException(status_code=400, detail="Extracted text cannot be empty")

    cv.extracted_text = new_text

    # Re-parse skills and attributes from updated text
    terms = session.query(ExtractionTerm).filter(ExtractionTerm.enabled.is_(True)).all()
    candidate = parse_candidate(new_text, terms)
    cv.skills = candidate["skills"]
    cv.experience_years = candidate["experience_years"]
    cv.education = candidate["education"]

    session.commit()
    session.refresh(cv)

    return {
        "id": cv.id,
        "filename": cv.filename,
        "extracted_text": cv.extracted_text,
        "skills": cv.skills,
        "experience_years": cv.experience_years,
        "education": cv.education,
        "status": cv.status,
        "created_at": cv.created_at,
    }


@router.delete("/{cv_id}", status_code=204)
def delete_cv(
    cv_id: str,
    session: Session = Depends(get_session),
) -> None:
    cv = session.get(CV, cv_id)
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    Path(cv.file_path).unlink(missing_ok=True)
    session.delete(cv)
    session.commit()