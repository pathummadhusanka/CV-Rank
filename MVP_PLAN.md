# CV-Rank MVP Plan

## Goal

Deliver the smallest honest, locally runnable CV scoring application that satisfies the assignment:

1. A hiring manager enters one job description.
2. The hiring manager uploads multiple PDF CVs.
3. A hosted LLM and embedding model analyze the job and CVs.
4. The backend returns AI-backed matches, evidence, scores, and ranking.
5. The browser displays ranked candidates and explains each score.
6. The full application runs with one Docker Compose command and a runtime API key.

The MVP does not train or fine-tune a model. Keyword-only matching is not a successful analysis path.

## Current State

### Backend implemented

- FastAPI health, job, CV, matching, and ranking endpoints.
- PDF upload, text extraction, SQLite persistence, and storage volume configuration.
- Rule-based parser/matcher/scorer used by the current prototype.
- Typed API responses and isolated SQLite tests.
- AI schemas, provider protocol, mock provider, OpenRouter settings, and process records.
- Backend Dockerfile and Compose configuration.

### Frontend implemented

- React/Vite job creation, CV upload, leaderboard, evidence modal, health status, and CSV export.
- Backend development proxy and recruiter-oriented components.

### Main gaps

- No real OpenRouter LLM adapter.
- No embedding adapter or in-memory similarity service.
- No AI analysis endpoint using validated AI results.
- Current frontend ranking engine fabricates evidence and can fall back after API failure.
- Frontend calls per-CV matching instead of the backend job-level analysis workflow.
- Frontend and backend are not combined into one root Docker Compose stack.
- User manual and actual prompts need completion.

## Target Architecture

```text
Browser
  -> Frontend
      -> POST /analysis/jobs/{job_id}
          -> Extract job requirements with LLM
          -> Structure CV text into meaningful sections/chunks
          -> Embed requirements and relevant CV chunks
          -> Calculate semantic similarity
          -> Ask LLM to resolve ambiguous matches and provide evidence
          -> Validate all structured AI results
          -> Calculate weighted scores in Python
          -> Rank candidates in Python
      <- Ranked candidates, evidence, strengths, gaps, explanation
```

### Model decision

- LLM provider: OpenRouter.
- LLM API: OpenAI-compatible API.
- Initial LLM: configurable, default `openai/gpt-4o-mini`.
- Embedding provider: local Hugging Face Sentence Transformers model.
- Initial embedding model: configurable, default `sentence-transformers/all-MiniLM-L6-v2`.
- API key: `AI_API_KEY`, supplied at runtime only.
- Embeddings: calculated in memory per analysis; no vector database.
- Training and fine-tuning: out of scope.
- Tests: mock LLM and embedding providers; no network required.

The LLM handles extraction, normalization, ambiguous reasoning, and evidence. Embeddings handle semantic similarity. Python validates outputs, calculates the final score, and ranks candidates.

## Score Method

The MVP score is calculated in application code:

- Required skills: 40%
- Preferred skills: 15%
- Experience: 25%
- Semantic similarity: 20%

LLM classifications map to values:

- `strong_match`: `1.0`
- `partial_match`: `0.5`
- `no_evidence`: `0.0`
- `contradictory_evidence`: `0.0`

The LLM never returns the final aggregate score.

## Milestones

### 1. LLM and Embedding Adapters

Implement provider adapters behind the existing AI boundary.

Required behavior:

- Send structured prompts and parse validated JSON from OpenRouter.
- Generate local embeddings for requirements and relevant CV chunks.
- Use configurable provider, model, base URL, timeout, and attribution headers.
- Fail clearly when the API key is missing.
- Handle timeout, HTTP, rate-limit, malformed-response, and embedding failures.
- Never log credentials or full CV text.

Acceptance checks:

- Mocked responses become validated AI objects.
- Invalid JSON and classifications are rejected.
- Embedding vectors are validated and cosine similarity is bounded.
- Provider failures become stable application errors.

### 2. AI Analysis Service

Create one service that:

1. Validates the job description and candidate text.
2. Extracts weighted required and preferred requirements with the LLM.
3. Splits CVs into meaningful sections or chunks.
4. Embeds requirements and relevant CV chunks in memory.
5. Calculates semantic similarity.
6. Uses the LLM for ambiguous relationships and evidence.
7. Requires exactly one assessment per requirement.
8. Requires evidence for positive matches where available.
9. Calculates the four weighted score components.
10. Calculates the final score and deterministic rank in Python.
11. Returns strengths, gaps, evidence, and explanation.

There is no silent keyword-only fallback when AI analysis fails.

### 3. Analysis API

Add:

```text
POST /analysis/jobs/{job_id}
```

The response includes:

- Job and extracted requirements.
- Candidate ID, filename, and rank.
- Component and overall scores.
- Requirement-level classifications.
- Semantic similarity signals.
- Evidence, strengths, gaps, and explanation.
- Controlled analysis failure status when provider processing fails.

The old rule-based endpoints may remain temporarily for compatibility, but the MVP frontend must use this endpoint.

### 4. Frontend Integration

- Add the analysis request to `src/frontend/src/lib/api.ts`.
- Submit one job and the uploaded CV batch to the backend.
- Render backend rank, scores, evidence, strengths, and gaps.
- Remove fabricated evidence and successful-looking fallback behavior from `rankingEngine.ts`.
- Show explicit loading, empty, partial-failure, and provider-error states.
- Keep upload validation and progress feedback.

### 5. Single Compose Runtime

Create a root Compose workflow for frontend and backend.

Required behavior:

- Frontend reaches backend by Compose service name.
- Backend reaches OpenRouter through runtime environment variables.
- SQLite and uploaded CVs use a named volume.
- API keys are not copied into the image or committed.
- `docker compose up --build` starts the browser-usable app.
- Backend healthcheck is used by the frontend dependency.

### 6. Documentation and Process Trail

Complete:

- Root README with fresh-clone setup and non-technical user instructions.
- Backend README with AI runtime configuration.
- `docs/PROMPTS.md` with the actual extraction, assessment, and ambiguity prompts.
- `docs/WORKLOG.md` with milestone evidence.
- `docs/DECISIONS.md` with major architectural decisions only.

## Testing Plan

### Backend

- AI schema validation and classification mapping.
- Requirement coverage: exactly one assessment per requirement.
- Chunking and cosine similarity.
- Component score calculation and deterministic ranking.
- Mocked OpenRouter LLM responses and local embedding-provider tests.
- Missing key, timeout, rate limit, invalid JSON, and provider failures.
- Successful analysis, missing job, empty CV batch, and partial provider failure.
- No fabricated output after an AI failure.

### Frontend

- Job creation and multiple PDF upload.
- Analysis loading, success, empty, partial-failure, and failure states.
- Backend results render without client-side re-ranking.
- Evidence modal displays only backend-provided evidence.

### End-to-end

- Start with `docker compose up --build`.
- Open the browser app.
- Enter a job description and upload at least two synthetic PDFs.
- Run analysis using a runtime OpenRouter key.
- Confirm ranked results, component scores, and evidence.
- Confirm invalid PDF and provider failure behavior.

## MVP Exclusions

Do not implement before the core flow works:

- User accounts or authentication.
- Candidate communication or interview scheduling.
- Fine-tuning or custom model training.
- Persistent vector databases.
- Advanced analytics and dashboards.
- Pagination and filtering.
- Background job queues.
- Production-grade multi-tenant deployment.

## Definition Of Done

- A fresh clone runs the full app with the documented Compose command.
- The API key is read at runtime and never stored in the repository or image.
- A job and multiple synthetic CVs produce LLM-backed extraction, embedding similarity, classifications, evidence, scores, and ranking.
- Final scores are calculated by validated, deterministic Python code.
- The frontend displays backend results without fabricating evidence or silently falling back to keywords.
- Provider failures are controlled and covered by tests.
- SPEC, README, WORKLOG, DECISIONS, and PROMPTS describe the implementation that actually runs.


