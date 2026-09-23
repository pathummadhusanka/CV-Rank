from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, File, UploadFile


router = APIRouter(prefix="/cvs", tags=["CVs"])

UPLOAD_DIR = Path("storage/cvs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("")
async def upload_cv(file: UploadFile = File(...)):
    cv_id = str(uuid4())
    file_path = UPLOAD_DIR / f"{cv_id}.pdf"

    with file_path.open("wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            buffer.write(chunk)

    return {
        "id": cv_id,
        "filename": file.filename,
        "status": "uploaded",
    }