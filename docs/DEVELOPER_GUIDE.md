# Developer Guide

## Prerequisites

- Python 3.12+
- `uv`
- Node.js 22+
- `pnpm`
- Docker Desktop with the Linux engine for container work

## Repository Layout

- `SPEC.md`: product specification and scoring rules.
- `MVP_PLAN.md`: MVP scope and delivery plan.
- `src/backend`: FastAPI, AI pipeline, persistence, and backend tests.
- `src/frontend`: React/Vite browser application.
- `docs`: user, feature, architecture, and developer documentation.

## Local Backend Development

```bash
cd src/backend
uv sync
uv run pytest -q
uv run main.py
```

The backend runs at `http://127.0.0.1:8000`; Swagger is at `/docs`.

## Local Frontend Development

Start the backend first, then:

```bash
cd src/frontend
pnpm install --frozen-lockfile
pnpm dev
```

The Vite proxy forwards `/api` requests to the local backend.

## AI Configuration

Copy `.env.example` to `.env` and set `AI_API_KEY` for OpenRouter. See [ENVIRONMENT.md](ENVIRONMENT.md) for every variable, defaults, and security rules. The LLM model and local embedding model are configurable. Tests use mock providers and do not require a key.

Never commit `.env`, API keys, real CVs, or personally identifying test data.

## Docker Development

From the repository root:

```bash
docker compose config
docker compose up --build
```

Open `http://localhost:3000`. For the assignment-required direct image workflow:

```bash
docker build -t cv-rank .
docker run --rm --env-file .env -p 3000:80 -v cv-rank-storage:/app/backend/storage cv-rank
```

## Making Changes

- Update `SPEC.md` when the product contract changes.
- Keep the LLM, embeddings, validation, scoring, and ranking boundaries separate.
- Add or update prompt contracts in `src/backend/docs/PROMPTS.md` when prompts change.
- Add milestone-level entries to `WORKLOG.md`; record only major architectural decisions in `DECISIONS.md`.
- Use mock providers for tests; do not make network calls from the test suite.
- Commit cohesive changes early with concise Conventional Commit messages.

## Core API

- `GET /health`
- `POST /jobs`
- `POST /cvs`
- `POST /analysis/jobs/{job_id}`
- `GET /jobs`
- `GET /cvs`

The analysis endpoint is the MVP path. The older rule-based matching endpoints remain for compatibility and should not be used for the final user workflow.
