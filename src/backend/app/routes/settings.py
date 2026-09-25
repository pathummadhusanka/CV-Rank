from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_session
from app.db.models import ExtractionTerm
from app.schemas import ExtractionTermRequest, ExtractionTermResponse

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/extraction-terms", response_model=list[ExtractionTermResponse])
def list_extraction_terms(session: Session = Depends(get_session)):
    return session.query(ExtractionTerm).order_by(ExtractionTerm.category, ExtractionTerm.term).all()


@router.post("/extraction-terms", response_model=ExtractionTermResponse)
def create_extraction_term(data: ExtractionTermRequest, session: Session = Depends(get_session)):
    term = data.term.strip()
    if not term:
        raise HTTPException(status_code=400, detail="Term is required")
    if session.query(ExtractionTerm).filter(ExtractionTerm.term.ilike(term)).first():
        raise HTTPException(status_code=409, detail="Term already exists")
    item = ExtractionTerm(term=term, aliases=data.aliases.strip(), category=data.category.strip() or "skill", enabled=data.enabled)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.delete("/extraction-terms/{term_id}", status_code=204)
def delete_extraction_term(term_id: int, session: Session = Depends(get_session)):
    item = session.get(ExtractionTerm, term_id)
    if not item:
        raise HTTPException(status_code=404, detail="Term not found")
    session.delete(item)
    session.commit()


@router.put("/extraction-terms/{term_id}", response_model=ExtractionTermResponse)
def update_extraction_term(term_id: int, data: ExtractionTermRequest, session: Session = Depends(get_session)):
    item = session.get(ExtractionTerm, term_id)
    if not item:
        raise HTTPException(status_code=404, detail="Term not found")
    if not data.term.strip():
        raise HTTPException(status_code=400, detail="Term is required")
    item.term = data.term.strip()
    item.aliases = data.aliases.strip()
    item.category = data.category.strip() or "skill"
    item.enabled = data.enabled
    session.commit()
    session.refresh(item)
    return item