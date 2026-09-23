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

## Current Checkpoint

- **Branch:** `feat/api`
- **Status:** Core API, persistence, parsing, matching, and scoring are implemented.
- **Next milestone:** Build focused automated coverage around the end-to-end API flows and matching/scoring behavior.

## Milestone Entry Template

### YYYY-MM-DD - Milestone title

- **Scope:**
- **Outcome:**
- **Evidence:**
- **Next checkpoint:**
