---
noteId: "28034450b77711f1b7d36fb7948e8c50"
tags: []

---

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

## Application-Owned Rule-Based Scoring

- **Date:** 2026-09-23
- **Status:** Accepted
- **Decision:** Keep the final candidate score and ranking in application code rather than delegating the numeric result to an AI model.
- **Reason:** Deterministic scoring makes results reproducible, testable, and explainable. AI or parsers may provide structured evidence, but application code owns the calculation.
- **Impact:** Changes to score weights or match values require code and focused tests. See the scoring requirements in `SPEC.md`.

## Isolated Database for Automated Tests

- **Date:** 2026-09-23
- **Status:** Accepted
- **Decision:** API tests use a temporary SQLite database and override the application session dependency instead of writing to `storage/cv_rank.db`.
- **Reason:** Tests must be repeatable and must not change development data. The dependency override also exercises the real FastAPI route and persistence path.
- **Impact:** New API tests should use the shared temporary-database fixture pattern. The development database remains available for manual API and viewer checks.

## Decision Entry Template

### Decision title

- **Date:** YYYY-MM-DD
- **Status:** Proposed | Accepted | Superseded
- **Decision:**
- **Reason:**
- **Impact:**
