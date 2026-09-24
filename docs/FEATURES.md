# Available Features

## Core Workflow

- Create and store a job description.
- Extract structured job requirements with an LLM.
- Upload multiple PDF CVs.
- Extract readable CV text locally.
- Split CV text into labeled evidence chunks.
- Analyze all stored CVs for a selected job.
- Rank candidates from highest to lowest score.
- Inspect requirement-level evidence, strengths, gaps, and explanation.
- Save and revisit evaluation projects in the browser.
- Export the displayed ranking as CSV.

## AI And Scoring

- OpenRouter LLM for job requirements, candidate interpretation, ambiguous matches, and explanations.
- Local Hugging Face Sentence Transformers model for semantic embeddings.
- Cosine similarity between requirements and CV chunks.
- Deterministic weighted score calculation in Python.
- Controlled errors for missing keys, invalid AI responses, provider failures, and embedding failures.

## Runtime Features

- Single-container Docker image serving frontend and backend together.
- Root Compose workflow for local startup.
- SQLite persistence for jobs, CV metadata, and uploaded files.
- Named storage volume for container replacement.
- Runtime-only API key configuration.
- Backend healthcheck.
- Swagger API documentation at `/docs` when the backend is exposed directly.

## Explicitly Out Of Scope

- User accounts and authentication.
- Candidate communication and interview scheduling.
- Background checks or personality assessment.
- Autonomous hiring decisions.
- Model training or fine-tuning.
- Vector databases and persistent embedding indexes.
- Advanced analytics, pagination, and multi-tenant deployment.
