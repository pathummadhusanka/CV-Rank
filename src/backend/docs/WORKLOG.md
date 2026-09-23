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

## Current Checkpoint

- **Branch:** `feat/api`
- **Status:** Core API, persistence, parsing, matching, scoring, and automated behavior coverage are implemented.
- **Next milestone:** Test the matching endpoint end to end and define the read API needed by the application workflow.

## Milestone Entry Template

### YYYY-MM-DD - Milestone title

- **Scope:**
- **Outcome:**
- **Evidence:**
- **Next checkpoint:**
