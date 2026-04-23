# Self-contained scraper image. Build context is this directory (scraper/).
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv

WORKDIR /app

# Copy dependency files first for better layer caching
COPY pyproject.toml uv.lock* README.md ./
COPY scraper ./scraper

RUN uv sync --frozen --no-dev || uv sync --no-dev

ENV PYTHONUNBUFFERED=1
CMD ["uv", "run", "python", "-m", "scraper.run"]
