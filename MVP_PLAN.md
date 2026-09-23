# CV-Rank MVP Plan

## Goal

Deliver the smallest honest, locally runnable CV scoring application that satisfies the assignment:

1. A hiring manager enters one job description.
2. The hiring manager uploads multiple PDF CVs.
3. A hosted LLM analyzes the job and CVs through OpenRouter.
4. The backend returns AI-backed requirement matches, evidence, scores, and ranking.
5. The browser displays the ranked candidates and explains each score.
6. The whole application runs from one Docker Compose command with the API key supplied at runtime.

The MVP does not train or fine-tune a model. It does not use keyword-only matching as a successful analysis path.

## Current State

### Backend

Implemented:

- FastAPI application with health, job, CV, matching, and ranking endpoints.
- PDF upload, text extraction, SQLite persistence, and named Docker storage volume.
- Rule-based parser, matcher, scorer, and ranking used by the current prototype.
- Typed API response models and isolated SQLite test fixtures.
- AI schemas, provider protocol, mock provider, OpenRouter runtime settings, and prompt/process documentation.
- Dockerfile and backend Compose configuration.

Missing for the MVP:

- Real OpenRouter provider adapter.
- AI-backed requirement extraction and candidate assessment service.
- AI-derived evidence, strengths, gaps, and explanations in API responses.
- Provider failure handling and end-to-end AI tests.

### Frontend

Implemented:

- React/Vite recruiter workflow for job creation, CV upload, ranking display, evidence modal, health status, and CSV export.
- Backend development proxy and components for requirements, uploading, leaderboard, and evidence.

Missing or unsafe for the MVP:

- The frontend calls the per-CV matching endpoint instead of the backend job-level ranking endpoint.
- `rankingEngine.ts` fabricates evidence and fallback results from keyword matches.
- Backend/API failures must not be presented as successful candidate analysis.
- Frontend and backend are not yet combined into one runnable Docker Compose stack.
- The frontend README is not yet a non-technical user manual.

## Target Architecture

```text
Browser
  -> Frontend
      -> POST /analysis/jobs/{job_id}
          -> Backend loads job and CV text
          -> OpenRouter LLM extracts weighted requirements
          -> OpenRouter LLM assesses every requirement for every CV
          -> Pydantic validates the structured AI response
          -> Python maps classifications to values
          -> Python calculates weighted scores and ranks candidates
      <- Ranked candidates, evidence, strengths, gaps, explanation
```

### Model Decision

- Provider: OpenRouter.
- API style: OpenAI-compatible HTTP API.
- Initial model: configurable, default `openai/gpt-4o-mini`.
- Credentials: `AI_API_KEY` supplied at runtime only.
- Local tests: mock provider; no network or API key required.
- Embeddings: deferred for this MVP.
- Custom training/fine-tuning: out of scope.

The LLM owns semantic understanding, requirement-level classifications, and evidence. Python owns validation, weighted aggregation, and deterministic ranking.

## Milestones

### 1. OpenRouter Adapter

Implement `OpenRouterProvider` behind the existing `AIProvider` protocol.

Required behavior:

- Send structured prompts and request JSON output.
- Use `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`, timeout, and optional attribution headers.
- Fail clearly when the API key is missing.
- Translate timeout, HTTP, rate-limit, and malformed-response errors into controlled application errors.
- Never log API keys or full candidate CV text.

Acceptance checks:

- Mocked successful response becomes validated `AIJobAnalysis` or `AICandidateAssessment`.
- Invalid JSON and invalid classifications are rejected.
- Provider errors produce stable application errors.

### 2. AI Analysis Service

Create one service that performs the complete job analysis:

1. Validate the job description and candidate text.
2. Extract weighted requirements with the LLM.
3. Assess every requirement against every CV.
4. Require one assessment per requirement.
5. Require evidence for positive matches where available.
6. Map classifications:
   - `strong_match = 1.0`
   - `partial_match = 0.5`
   - `no_evidence = 0.0`
   - `contradictory_evidence = 0.0`
7. Calculate weighted scores in Python.
8. Rank candidates deterministically.
9. Return strengths, gaps, evidence, and a short explanation.

Do not silently fall back to keyword-only matching when the AI provider fails.

### 3. Analysis API Contract

Add the core endpoint:

```text
POST /analysis/jobs/{job_id}
```

The response should include:

- Job ID and analyzed requirement list.
- Candidate ID, filename, and rank.
- Overall score from `0` to `100`.
- Requirement-level classification and evidence.
- Strengths and gaps.
- Short explanation.
- Analysis status and controlled failure details when appropriate.

The existing rule-based endpoints may remain temporarily for development compatibility, but the frontend MVP must use the AI analysis endpoint.

### 4. Frontend Integration

Replace client-side ranking and fabricated evidence with the backend analysis contract.

Required changes:

- Add the analysis API call to `src/frontend/src/lib/api.ts`.
- Submit one job and all uploaded CVs through the backend workflow.
- Render backend rank, score, evidence, strengths, and gaps.
- Remove the successful-looking fallback in `rankingEngine.ts`.
- Show an explicit error state when analysis fails.
- Preserve upload progress and per-file validation feedback.

### 5. Single-Container Runtime

Provide one root Compose workflow that starts the frontend and backend together.

Required behavior:

- Frontend can reach backend by Compose service name.
- Backend can reach OpenRouter using runtime environment variables.
- SQLite and uploaded CVs use a named volume.
- API keys are not copied into the image or committed to Git.
- `docker compose up --build` starts the browser-usable application.
- Healthcheck confirms backend availability.

### 6. User Documentation and Process Trail

Update:

- Root `README.md` with fresh-clone setup and non-technical user instructions.
- Backend README with runtime AI configuration.
- `docs/PROMPTS.md` with the actual extraction and assessment prompts.
- `docs/WORKLOG.md` with milestone outcomes and evidence.
- `docs/DECISIONS.md` with only major architectural choices.

## Testing Plan

### Backend unit tests

- AI schema validation and classification mapping.
- Requirement coverage: every requirement receives exactly one assessment.
- Weighted score calculation and ranking.
- OpenRouter adapter with mocked HTTP responses.
- Missing key, timeout, rate limit, invalid JSON, and provider failure.

### Backend API tests

- Successful AI analysis with a mock provider.
- Missing job and missing CV handling.
- Empty CV batch handling.
- AI failure returns a controlled error and never fabricated results.

### Frontend checks

- Job creation and multiple PDF upload.
- Loading, success, empty, and failure states.
- Backend AI results render without client-side re-ranking.
- Evidence modal displays only backend-provided evidence.

### End-to-end smoke test

- Start with `docker compose up --build`.
- Open the browser application.
- Enter a job description.
- Upload at least two synthetic PDFs.
- Run analysis with a runtime OpenRouter key.
- Confirm ranked results and evidence.
- Confirm invalid PDF and provider failure states.

## MVP Exclusions

Do not implement before the core flow works:

- User accounts or authentication.
- Candidate communication or interview scheduling.
- Fine-tuning or custom model training.
- Embedding search or vector databases.
- Advanced analytics and dashboards.
- Pagination, filtering, or bulk administration.
- Background job queues.
- Production-grade multi-tenant deployment.

## Definition Of Done

The MVP is complete when:

- A fresh clone can run the full app using the documented Docker Compose command.
- The runtime API key is read from environment variables and never stored in the repository or image.
- A job plus multiple synthetic CVs produces AI-backed classifications and evidence.
- Scores are calculated from validated AI classifications and ranked by backend code.
- The frontend displays the backend results without fabricating evidence or silently falling back to keyword matching.
- Provider failures are visible, controlled, and covered by tests.
- The specification, README, worklog, decisions, and prompts describe the implementation that actually runs.


