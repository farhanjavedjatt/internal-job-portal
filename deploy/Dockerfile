# Scraper container
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# uv for fast installs
RUN pip install --no-cache-dir uv

WORKDIR /app
COPY scraper/pyproject.toml /app/scraper/
COPY scraper/scraper /app/scraper/scraper
COPY scraper/README.md /app/scraper/

WORKDIR /app/scraper
RUN uv sync --frozen --no-dev || uv sync --no-dev

ENV PYTHONUNBUFFERED=1
CMD ["uv", "run", "python", "-m", "scraper.run"]
