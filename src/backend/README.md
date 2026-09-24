# CV-Rank API

## API Endpoints

* `GET /health` - API health check
* `GET /jobs` - List stored job summaries
* `POST /jobs` - Create a job description
* `GET /cvs` - List processed CV summaries
* `POST /cvs` - Upload CV in PDF format
* `POST /matching/jobs/{job_id}/cvs/{cv_id}` - Match a CV against a job
* `POST /matching/jobs/{job_id}` - Rank all stored CVs against a job
* `POST /analysis/jobs/{job_id}` - Analyze and rank CVs with the configured AI provider
* Swagger UI: `http://127.0.0.1:8000/docs`

## Configurations
Create `.env` file in project root with:

Optional variables:  
- Change maximum upload-file size in MB (Default is set to 5 MB, if not set).  
`MAX_UPLOAD_SIZE_MB`=2

- Change DB Server URL (Default is set to SQLite: sqlite:///storage/cv_rank.db).  
`DATABASE_URL`=sqlite:///storage/cv_rank.db

- Configure the AI provider at runtime. The selected provider is OpenRouter.
- `AI_PROVIDER`=openrouter
- `AI_MODEL`=openai/gpt-4o-mini
- `AI_EMBEDDING_MODEL`=openai/text-embedding-3-small
- `AI_API_KEY`=your-openrouter-key
- `AI_BASE_URL`=https://openrouter.ai/api/v1

### Run

```bash
uv run main.py
```

API: `http://127.0.0.1:8000`

### Docker

Build and start the backend from `src/backend`:

```bash
docker build -t cv-rank-backend .
docker volume create cv-rank-storage
docker run --rm \
	--name cv-rank-backend \
	-p 8000:8000 \
	-v cv-rank-storage:/app/storage \
	cv-rank-backend
```

The API is available at `http://127.0.0.1:8000`, and the Swagger UI is available at `http://127.0.0.1:8000/docs`.

The named volume preserves the SQLite database and uploaded CV files when the container is replaced. Pass `--env-file .env` to `docker run` when runtime environment variables are needed.

Compose can manage the image, port, environment, and storage volume together:

```bash
docker compose up --build
```

Stop the service with:

```bash
docker compose down
```

The named volume is retained by `docker compose down`; remove it explicitly with `docker compose down --volumes` when the development database and uploaded files should be deleted.
