# Backend Decisions

Only record decisions that materially affect backend architecture, data behavior, delivery workflow, or future change cost. Routine implementation choices belong in code and commits.

## Branch and Commit Workflow

- **Date:** 2026-09-23
- **Status:** Accepted
- **Decision:** Develop backend work on `feat/api` and commit a cohesive implementation together with the milestone documentation that explains it.
- **Reason:** The branch isolates backend API work, while commits remain understandable and reversible. The worklog captures milestones rather than duplicating commit history.
- **Impact:** Backend changes should be committed with a concise Conventional Commit-style message. Documentation is updated when a milestone or major decision changes.

## SQLite for Current Development Persistence

- **Date:** 2026-09-23
- **Status:** Accepted
- **Decision:** Use SQLite at `storage/cv_rank.db` for the current backend development setup.
- **Reason:** It keeps local development simple and already supports the CV and job data models.
- **Impact:** The path is relative to the backend working directory. A future deployment should use an application-rooted or deployment-provided path to avoid creating a different database from another working directory.

## Application-Owned Score Aggregation

- **Date:** 2026-09-23
- **Status:** Superseded by Hosted LLM for Semantic Assessment
- **Decision:** Keep weighted score aggregation and ranking in application code.
- **Reason:** Deterministic aggregation makes results reproducible, testable, and explainable while allowing AI to provide the semantic requirement assessments required by the assignment.
- **Impact:** Score weights and classification mapping remain code-owned, but match values must come from validated AI output.

## Hosted LLM for Semantic Assessment

- **Date:** 2026-09-24
- **Status:** Accepted
- **Decision:** Use a hosted, structured-output-capable LLM for job requirement extraction, CV understanding, requirement-level matching, and evidence generation. Do not train or fine-tune a model for the MVP, and defer embeddings.
- **Reason:** The assignment requires AI-based scoring and semantic matching, while the project has no labeled training dataset. A hosted LLM meets the requirement without introducing a training pipeline.
- **Impact:** Provider, model, and API key are runtime configuration. AI outputs must be validated before scoring, and provider failures must produce controlled API errors. Keyword-only matching is not an acceptable fallback for successful analysis.

## Isolated Database for Automated Tests

- **Date:** 2026-09-23
- **Status:** Accepted
- **Decision:** API tests use a temporary SQLite database and override the application session dependency instead of writing to `storage/cv_rank.db`.
- **Reason:** Tests must be repeatable and must not change development data. The dependency override also exercises the real FastAPI route and persistence path.
- **Impact:** New API tests should use the shared temporary-database fixture pattern. The development database remains available for manual API and viewer checks.

## Read Endpoints Return Summaries

- **Date:** 2026-09-23
- **Status:** Accepted
- **Decision:** `GET /jobs` and `GET /cvs` return persisted summaries; CV responses do not expose extracted text or stored file paths.
- **Reason:** The application needs collection views, while extracted CV content and filesystem locations are internal data that should not be returned by default.
- **Impact:** Detailed candidate content or file download behavior requires an explicit endpoint and contract later.

## Typed API Response Contracts

- **Date:** 2026-09-23
- **Status:** Accepted
- **Decision:** Define Pydantic response models for job summaries, CV summaries, uploads, and matching results.
- **Reason:** Explicit response contracts keep the API stable for the application client and prevent accidental exposure of internal fields.
- **Impact:** Changes to returned fields should update the schema, endpoint tests, and API documentation together.

## Deterministic Candidate Ranking

- **Date:** 2026-09-24
- **Status:** Accepted
- **Decision:** Rank candidates by descending overall score and use the CV ID as the deterministic tie-breaker.
- **Reason:** Ranking must be reproducible for the same stored data and must not depend on database row order.
- **Impact:** The job-level matching endpoint returns stable ranks. Changes to score calculation can change ranking, while equal scores remain predictably ordered.

## Container Storage Uses a Named Volume

- **Date:** 2026-09-24
- **Status:** Accepted
- **Decision:** Mount `/app/storage` as a named Docker volume for the SQLite database and uploaded CV files.
- **Reason:** Both kinds of data must survive container replacement, while local database and candidate files must remain outside the image.
- **Impact:** Container deployments must provide the storage volume. The image itself remains stateless apart from runtime memory.

## Decision Entry Template

### Decision title

- **Date:** YYYY-MM-DD
- **Status:** Proposed | Accepted | Superseded
- **Decision:**
- **Reason:**
- **Impact:**
