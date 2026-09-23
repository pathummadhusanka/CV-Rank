---
noteId: "28034450b77711f1b7d36fb7948e8c50"
tags: []

---

# Backend Decisions

## Backend Documentation Location and Branch Workflow

- **Date:** 2026-09-23
- **Status:** Accepted
- **Decision:** Keep backend worklog and backend technical decisions in `src/backend/docs/` as Markdown files. Backend changes and their documentation are developed on the `feat/api` branch and committed together when they describe the same work.
- **Reason:** The documentation stays close to the code it describes, while remaining separate from runtime modules and the repository-level product specification.
- **Files:** `README.md`, `WORKLOG.md`, and `DECISIONS.md`.

## Relative SQLite Database Path

- **Date:** 2026-09-23
- **Status:** Accepted
- **Decision:** Continue using `storage/cv_rank.db` from the backend working directory for the current development setup.
- **Reason:** The existing configuration and startup instructions use this path, and the database is valid and writable. The SQLite viewer must open `src/backend/storage/cv_rank.db`.
- **Constraint:** Starting the backend from another working directory can create or look for a different relative path. A future production setup should use an explicit application-rooted path or a deployment-provided absolute path.
