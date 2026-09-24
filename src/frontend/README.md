# CV-Rank Frontend

React/Vite frontend for the CV-Rank browser application.

## Development

From `src/frontend`:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The Vite development proxy forwards `/api` requests to the backend at `127.0.0.1:8000`.

## Production

The root `Dockerfile` builds this frontend and serves it with Nginx alongside the FastAPI backend. Use the root README and [developer guide](../../docs/DEVELOPER_GUIDE.md) for the supported full-stack startup commands.

The frontend consumes `POST /analysis/jobs/{job_id}` for the MVP ranking flow. Scoring, ranking, and evidence generation remain backend responsibilities.
