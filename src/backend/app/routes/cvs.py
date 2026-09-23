from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import settings


router = APIRouter(prefix="/cvs", tags=["CVs"])

UPLOAD_DIR = Path("storage/cvs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Set maximum file size
MAX_UPLOAD_SIZE = settings.max_upload_size_mb * 1024 * 1024

@router.post("")
async def upload_cv(file: UploadFile = File(...)):

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

    return {
        "id": cv_id,
        "filename": file.filename,
        "status": "uploaded",
    }