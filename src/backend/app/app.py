from fastapi import FastAPI
from app.routes.cvs import router as cvs_router


app = FastAPI()


@app.get("/health")
def health_check():
    return {
        "service": "cv-rank",
        "version": "0.1.0",
        "status": "ok",
    }

app.include_router(cvs_router)