# Architecture

## System Flow

```mermaid
flowchart TD
    Browser[React browser app] -->|Create job and upload PDFs| Gateway[Nginx in single container]
    Gateway --> API[FastAPI API]
    API --> Store[(SQLite and storage volume)]
    Browser -->|POST /analysis/jobs/{job_id}| API
    API --> LLM[OpenRouter LLM]
    API --> Embed[Local Sentence Transformers]
    LLM --> Requirements[Structured requirements and evidence]
    Embed --> Similarity[Cosine similarity]
    Requirements --> Score[Python weighted scoring]
    Similarity --> Score
    Score --> Rank[Deterministic ranking]
    Rank --> Browser
```

## Container Layout

The root `Dockerfile` builds the React frontend, installs the Python backend, and serves both from one container:

- Nginx listens on port `80`.
- Nginx serves the compiled frontend.
- Nginx proxies `/api/*` to Uvicorn on `127.0.0.1:8000`.
- Uvicorn serves FastAPI.
- `/app/backend/storage` is backed by a named Docker volume.

The root `compose.yaml` maps container port `80` to host port `3000`.

## Request Flow

1. `POST /jobs` creates a job record.
2. `POST /cvs` extracts and stores each uploaded PDF.
3. `POST /analysis/jobs/{job_id}` loads the job and stored CV text.
4. OpenRouter extracts weighted requirements.
5. CV text is split into labeled chunks.
6. The local embedding model embeds requirements and chunks.
7. The LLM supplies requirement assessments and evidence.
8. Python calculates required-skill, preferred-skill, experience, semantic, and overall scores.
9. Python sorts candidates and assigns ranks.
10. The frontend renders only the returned backend evidence and scores.

## AI Boundaries

The LLM does not return the final aggregate score. It supplies structured semantic information and evidence. The embedding model supplies similarity signals. Pydantic validates provider responses. Python owns score weights, aggregation, and ranking.

## Main Code Areas

- `src/backend/app/routes/`: HTTP endpoints.
- `src/backend/app/ai/`: providers, schemas, chunking, similarity, and analysis service.
- `src/backend/app/db/`: SQLAlchemy models and sessions.
- `src/backend/app/services/`: parsing, matching, and score utilities.
- `src/frontend/src/pages/`: browser workflows.
- `src/frontend/src/components/`: UI components.
- `src/frontend/src/lib/api.ts`: frontend API client.
- `src/frontend/src/lib/rankingEngine.ts`: maps backend analysis results to UI models; it does not calculate or fabricate scores.
