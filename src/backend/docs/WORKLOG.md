# Backend Worklog

The worklog tracks meaningful backend milestones rather than individual commits or routine debugging notes.

## 2026-09-23 - Backend API Foundation

- **Scope:** Project scaffold, health check, PDF upload endpoint, file validation, text extraction, and SQLite persistence.
- **Outcome:** The backend can accept a PDF CV, extract its text, and save the processed CV to SQLite. Job creation was also added.
- **Evidence:** Commits `7939e79` through `69656a4`.
- **Next checkpoint:** Verify the end-to-end CV upload flow with representative fixtures.

## 2026-09-23 - Parsing, Matching, and Scoring

- **Scope:** Rule-based job-description parsing, candidate-profile parsing, CV/job matching, and score calculation.
- **Outcome:** The backend can derive structured requirements and calculate a rule-based candidate score.
- **Evidence:** Commits `ac72d92`, `1085f75`, `5363ec7`, and `e3f28ca`.
- **Next checkpoint:** Add focused tests for parser edge cases and score boundaries.

## 2026-09-23 - API and Persistence Verification

- **Scope:** API test contents and SQLite behavior verification.
- **Outcome:** The active database is `src/backend/storage/cv_rank.db`; it is valid SQLite, has `cvs` and `jobs` tables, and persists successful `POST /jobs` requests.
- **Follow-up:** Keep the API running from `src/backend` while the database URL remains relative. See [DECISIONS.md](DECISIONS.md#sqlite-for-current-development-persistence).

## 2026-09-23 - First Automated API Test Milestone

- **Scope:** Isolated tests for the health endpoint, job creation, persistence, and invalid job input.
- **Outcome:** `3` API tests pass without modifying the development database.
- **Evidence:** `uv run pytest tests/test_api.py -q`.
- **Next checkpoint:** Add parser, matching, scoring, and CV upload test coverage.

## 2026-09-23 - Core Behavior Test Coverage

- **Scope:** Job and candidate parsers, skill/experience/education matching, weighted scoring, rejected uploads, and successful PDF uploads.
- **Outcome:** The backend test suite has `10` passing tests and uses temporary SQLite databases plus temporary upload directories.
- **Evidence:** `uv run pytest -q`.
- **Next checkpoint:** Add matching endpoint tests and decide which read endpoints are needed for the application workflow.

## 2026-09-23 - Matching and Read API Milestone

- **Scope:** End-to-end matching endpoint coverage plus `GET /jobs` and `GET /cvs` collection endpoints.
- **Outcome:** Stored jobs and CVs can be listed as concise summaries, and matching returns component scores plus the weighted overall score.
- **Evidence:** `7` focused endpoint tests pass; the API surface is documented in `README.md`.
- **Next checkpoint:** Add pagination/filtering only when the application workflow requires it, then address the SQLAlchemy datetime deprecation.

## 2026-09-23 - API Contract Hardening

- **Scope:** Typed response schemas, timezone-aware UTC timestamps, empty collection behavior, and missing-record behavior.
- **Outcome:** Read and matching endpoints have explicit response contracts, timestamp deprecation warnings are removed, and the full suite has `17` passing tests.
- **Evidence:** `uv run pytest -q`.
- **Next checkpoint:** Validate the contracts from the application client and add pagination/filtering only when required.

## 2026-09-24 - Job-Level Ranking Milestone

- **Scope:** Rank every stored CV against one job and return rank, score breakdown, and match details.
- **Outcome:** `POST /matching/jobs/{job_id}` now returns candidates in descending overall score order, with deterministic CV ID ordering for ties.
- **Evidence:** Six focused matching tests pass, including empty results and missing jobs.
- **Next checkpoint:** Add batch CV upload and per-file failure reporting for the multi-CV workflow.

## 2026-09-24 - Backend Containerization Milestone

- **Scope:** Docker image, build-context exclusions, healthcheck, and persistent storage instructions.
- **Outcome:** The backend has a Dockerfile that runs Uvicorn on `0.0.0.0:8000` and a named volume can preserve SQLite data and uploaded CVs.
- **Evidence:** `uv run pytest -q` passes with `20` tests. Image build is pending because the local Docker Desktop Linux engine is not running.
- **Next checkpoint:** Build and smoke-test the image after Docker Desktop is started.

## 2026-09-24 - AI Architecture Decision

- **Scope:** Align the implementation plan with the assignment requirement for AI-based scoring and semantic matching.
- **Outcome:** The MVP will use a hosted structured-output LLM for requirement extraction, CV understanding, matching classifications, and evidence. Python will validate AI results, aggregate the weighted score, and rank candidates. No training or embeddings are planned for the first version.
- **Evidence:** Updated [SPEC.md](../../../SPEC.md) and [DECISIONS.md](DECISIONS.md#hosted-llm-for-semantic-assessment).
- **Next checkpoint:** Implement the provider interface, validated AI schemas, mock provider, and runtime configuration on `feat/ai`.

## 2026-09-24 - AI Contract and Mock Provider Milestone

- **Scope:** AI requirement and candidate-assessment schemas, provider protocol, mock provider, runtime settings, and prompt record.
- **Outcome:** AI outputs have validated classifications, evidence fields, and bounded requirement weights. Local tests use the mock provider and do not require an API key.
- **Evidence:** `uv run pytest tests/test_ai.py -q` passes with `4` tests.
- **Next checkpoint:** Implement the hosted provider adapter and integrate validated AI assessments into job analysis and ranking.

## Current Checkpoint

- **Branch:** `feat/ai`
- **Status:** Core API, persistence, parsing, matching, scoring, typed read endpoints, ranking, automated behavior coverage, Docker configuration, and AI contracts are implemented. Hosted AI assessment is not integrated yet.
- **Next milestone:** Add the hosted provider adapter and integrate validated AI assessments.

## Milestone Entry Template

### YYYY-MM-DD - Milestone title

- **Scope:**
- **Outcome:**
- **Evidence:**
- **Next checkpoint:**
