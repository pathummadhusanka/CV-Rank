# CV-Rank MVP

CV-Rank compares multiple candidate PDF CVs against one job description using a hybrid AI pipeline:

- OpenRouter LLM for requirement extraction, CV understanding, ambiguous matching, and evidence.
- Local Hugging Face Sentence Transformers embeddings for semantic similarity between job requirements and CV sections.
- Python for deterministic weighted scoring and ranking.

The system supports human review and does not make autonomous hiring decisions.

## Run The Application

Requirements:

- Docker Desktop with the Linux engine running.
- An OpenRouter API key for real AI analysis.

From the repository root:

```bash
copy .env.example .env
type .env
```

Put your OpenRouter key in `.env` as `AI_API_KEY`. The embedding model runs locally in the backend container. Do not commit `.env`.

Start the application:

```bash
docker compose up --build
```

Open the browser at <http://localhost:3000>.

The same full-stack application can be run as one Docker container:

```bash
docker build -t cv-rank .
docker run --rm \
	--name cv-rank \
	--env-file .env \
	-p 3000:80 \
	-v cv-rank-storage:/app/backend/storage \
	cv-rank
```

The container serves the browser application and backend API together. The first startup may download the local embedding model.

Stop the application:

```bash
docker compose down
```

The named Docker volume preserves the SQLite database and uploaded CV files. Remove it only when resetting local data:

```bash
docker compose down --volumes
```

## User Manual

See the complete [User Manual](docs/USER_MANUAL.md) for the hiring-manager workflow. In short: select a job, upload PDF CVs, run AI analysis, review the ranked evidence, and save the evaluation project.

The application shows an error when the AI provider is unavailable. It does not replace failed AI results with keyword-only rankings.

## Project Documents

- [SPEC.md](SPEC.md) - product specification and scoring methodology.
- [MVP_PLAN.md](MVP_PLAN.md) - implementation milestones and definition of done.
- [User Manual](docs/USER_MANUAL.md) - non-technical hiring-manager instructions.
- [Available Features](docs/FEATURES.md) - implemented features and explicit exclusions.
- [Architecture](docs/ARCHITECTURE.md) - system flow, AI boundaries, and code areas.
- [Developer Guide](docs/DEVELOPER_GUIDE.md) - local development, Docker, testing, and contribution workflow.
- [Environment Configuration](docs/ENVIRONMENT.md) - every `.env` variable and its purpose.
- [Backend worklog](src/backend/docs/WORKLOG.md) - milestone history.
- [Backend decisions](src/backend/docs/DECISIONS.md) - major architectural decisions.
- [Prompt record](src/backend/docs/PROMPTS.md) - AI prompt contracts.
