from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.cv_parser import extract_text
from app.db.database import get_session
from app.db.models import CV
from app.services.cv_service import create_cv

router = APIRouter(prefix="/cvs", tags=["CVs"])

UPLOAD_DIR = Path("storage/cvs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Set maximum file size
MAX_UPLOAD_SIZE = settings.max_upload_size_mb * 1024 * 1024

@router.post("")
async def upload_cv(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):

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

    create_cv(
        session=session,
        cv_id=cv_id,
        filename=file.filename or "unknown.pdf",
        file_path=str(file_path),
        extracted_text=text,
    )

    return {
        "id": cv_id,
        "filename": file.filename,
        "status": "processed",
    }