# Environment Configuration

The root `.env` file configures the container at runtime. Create it from `.env.example` and keep the real file private.

```powershell
copy .env.example .env
```

Never commit `.env`. Commit only `.env.example` with empty or placeholder values.

## Variables

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `AI_PROVIDER` | Yes for real analysis | `openrouter` | Selects the AI provider implementation. Use `mock` only for offline development and tests. |
| `AI_MODEL` | Yes for real analysis | `openai/gpt-4o-mini` | OpenRouter chat model used for requirement extraction, candidate interpretation, ambiguous matching, and evidence. |
| `AI_EMBEDDING_MODEL` | Yes for real analysis | `sentence-transformers/all-MiniLM-L6-v2` | Local Hugging Face Sentence Transformers model used to calculate semantic similarity. It does not require an API key. |
| `AI_API_KEY` | Yes when `AI_PROVIDER=openrouter` | `your-openrouter-key` | Secret key used by the backend to call OpenRouter. Never commit or display it. |
| `AI_BASE_URL` | Usually no | `https://openrouter.ai/api/v1` | OpenAI-compatible API endpoint used by the LLM adapter. |
| `AI_HTTP_REFERER` | No | `https://your-app.example.com` | Optional OpenRouter attribution URL. Leave empty for local development. |
| `AI_APP_TITLE` | No | `CV-Rank` | Optional application title sent to OpenRouter for attribution. |
| `AI_TIMEOUT_SECONDS` | No | `30` | Maximum time allowed for an individual AI request. |
| `MAX_UPLOAD_SIZE_MB` | No | `5` | Maximum size of one uploaded PDF CV. |
| `DATABASE_URL` | No | `sqlite:///storage/cv_rank.db` | SQLAlchemy database URL. The default stores SQLite inside the mounted application storage volume. |

## Local Development

For tests and offline development:

```env
AI_PROVIDER=mock
AI_API_KEY=
```

The mock provider avoids network requests. The local embedding model may still be downloaded by the backend environment the first time it is loaded.

## Real AI Analysis

For the full MVP workflow:

```env
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
AI_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
AI_API_KEY=your-openrouter-key
AI_BASE_URL=https://openrouter.ai/api/v1
```

The LLM uses the API key. The embedding model runs locally in the container. The final score and ranking are calculated by Python.

## Docker Usage

The root Compose file passes these values into the single application container:

```bash
docker compose up --build
```

The direct image workflow uses the same file:

```bash
docker build -t cv-rank .
docker run --rm --env-file .env -p 3000:80 -v cv-rank-storage:/app/backend/storage cv-rank
```

Do not place the API key directly in a Dockerfile, Compose file, source file, image layer, or Git commit.

