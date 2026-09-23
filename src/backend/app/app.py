from fastapi import FastAPI
from app.routes.cvs import router as cvs_router
from app.db.database import create_tables
from app.routes.jobs import router as jobs_router


app = FastAPI()

create_tables()

@app.get("/health")
def health_check():
    return {
        "service": "cv-rank",
        "version": "0.1.0",
        "status": "ok",
    }

app.include_router(cvs_router)
app.include_router(jobs_router)