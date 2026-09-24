FROM node:22-alpine AS frontend-builder

WORKDIR /frontend
RUN npm install -g pnpm
COPY src/frontend/package.json src/frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY src/frontend/ ./
RUN pnpm run build

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app/backend

RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx \
    && rm -rf /var/lib/apt/lists/*

COPY src/backend/requirements.txt ./
RUN pip install --upgrade pip \
    && pip install --index-url https://download.pytorch.org/whl/cpu torch \
    && pip install -r requirements.txt

COPY src/backend/app ./app
COPY src/frontend/nginx-single.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-builder /frontend/dist /usr/share/nginx/html

RUN mkdir -p /app/backend/storage/cvs \
    && rm -f /etc/nginx/sites-enabled/default

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1/api/health')"

CMD ["sh", "-c", "uvicorn app.app:app --host 127.0.0.1 --port 8000 & exec nginx -g 'daemon off;'"]
