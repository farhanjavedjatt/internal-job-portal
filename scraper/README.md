# scraper

Daily job scraper for Job Portal. Pulls from JobSpy (LinkedIn/Indeed/Glassdoor) + Bundesagentur für Arbeit and upserts into Supabase.

## Setup

```bash
cd scraper
uv sync
cp .env.example .env   # fill in SUPABASE_SECRET_KEY
```

## Run

```bash
uv run python -m scraper.run                    # all enabled profiles
uv run python -m scraper.run --profile profile_a_de   # one profile
uv run python -m scraper.run --dry-run          # fetch, don't write
```

## Test

```bash
uv run pytest
```
