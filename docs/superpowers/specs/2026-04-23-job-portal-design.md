# Job Portal — System Design

_Date: 2026-04-23_
_Status: Approved for implementation_

## Goal

A daily-refreshed job portal that:
1. Scrapes jobs from multiple sources (JobSpy: LinkedIn/Indeed/Glassdoor + Bundesagentur für Arbeit for Germany)
2. Stores them in Supabase with dedup and observability
3. Presents them through a glassmorphism dashboard ("Prism.work") with search, filter, and sort
4. Runs on a daily cron (VPS later; local now)

## Repo layout

```
Job Portal/
├── scraper/                     # Python package
│   ├── pyproject.toml
│   ├── .env.example
│   ├── scraper/
│   │   ├── __init__.py
│   │   ├── run.py               # CLI entrypoint: python -m scraper.run
│   │   ├── config.py            # env loading, profile loading from Supabase
│   │   ├── normalize.py         # map source rows → unified schema
│   │   ├── supabase_client.py   # upsert jobs, log runs
│   │   └── sources/
│   │       ├── __init__.py
│   │       ├── jobspy_source.py
│   │       └── bundesagentur_source.py
│   └── tests/
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql        # tables, indexes, RLS, FTS
│       └── 0002_seed_profiles.sql
├── jobportal/                   # Next.js 15 app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             # server component, reads from Supabase
│   │   └── globals.css          # ported from design/styles.css
│   ├── components/
│   │   ├── Aurora.tsx
│   │   ├── SalaryScrubber.tsx
│   │   ├── SortWheel.tsx
│   │   ├── JobCard.tsx
│   │   ├── FilterRail.tsx
│   │   ├── JobDetail.tsx
│   │   └── JobsDashboard.tsx
│   ├── lib/
│   │   ├── supabase.ts          # client + server helpers
│   │   ├── jobs.ts              # typed queries
│   │   └── types.ts
│   ├── hooks/
│   │   └── useTweaks.ts
│   ├── .env.local
│   └── package.json
├── deploy/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── cron.md                  # systemd timer + crontab sample
└── docs/superpowers/specs/      # this doc
```

## Data model

### `jobs` (dedup via `(source, source_job_id)`)
| column | type | notes |
|---|---|---|
| id | uuid pk default gen_random_uuid() | |
| source | text not null | `linkedin`, `indeed`, `glassdoor`, `bundesagentur`, etc. |
| source_job_id | text not null | JobSpy `id` or Bundesagentur `refnr` |
| title | text not null | |
| company | text | |
| company_url | text | |
| location_country | text | ISO code when known |
| location_city | text | |
| location_state | text | |
| is_remote | bool | |
| description | text | |
| job_type | text | full-time, contract, etc. |
| job_function | text | |
| job_level | text | from LinkedIn when available |
| date_posted | date | |
| salary_min | numeric | |
| salary_max | numeric | |
| salary_currency | text | |
| salary_interval | text | yearly, hourly |
| job_url | text | |
| tags | text[] | |
| raw | jsonb | full source row for debugging |
| first_seen_at | timestamptz default now() | |
| last_seen_at | timestamptz default now() | bumped on re-scrape |
| is_active | bool default true | |
| search_tsv | tsvector generated | FTS column on title+company+description |

- Unique index: `(source, source_job_id)`
- Index: `date_posted desc`
- GIN index: `search_tsv`
- GIN index: `tags`

### `search_profiles`
| column | type |
|---|---|
| id | uuid pk |
| name | text unique |
| keywords | text[] |
| locations | text[] |
| sites | text[] |
| country_indeed | text |
| hours_old | int |
| results_wanted | int |
| include_bundesagentur | bool |
| enabled | bool default true |

**Seed (Profile A):**
- keywords: `["software engineer", "data engineer"]`
- locations: `["New York, NY", "London, UK", "Berlin, Germany"]`
- sites: `["linkedin", "indeed", "glassdoor"]`
- country_indeed rotates per location (`usa`, `uk`, `germany`)
- hours_old: 72
- results_wanted: 50
- include_bundesagentur: true (Berlin only)

### `scrape_runs`
| column | type |
|---|---|
| id | uuid pk |
| profile_id | uuid fk |
| source | text |
| started_at | timestamptz |
| finished_at | timestamptz |
| jobs_found | int |
| jobs_inserted | int |
| jobs_updated | int |
| error | text nullable |

### RLS
- `jobs`: readable by `anon` (publishable key); no direct writes (service role only).
- `search_profiles`, `scrape_runs`: no access via `anon`; service role only.

## Scraper behavior

1. Load enabled profiles from `search_profiles`.
2. For each profile × (site × location) combo:
   - If site is in JobSpy list → call `scrape_jobs(...)`.
   - Else if `include_bundesagentur` and location is in Germany → call Bundesagentur adapter.
3. Normalize rows to unified schema.
4. Upsert on `(source, source_job_id)` — insert new, update `last_seen_at` + `is_active=true` on match.
5. Log a row in `scrape_runs` per (profile, source) with counts and any caught exceptions.
6. 429 / network errors: caught, logged, run continues.
7. CLI: `python -m scraper.run [--profile name] [--dry-run]`.

### Bundesagentur adapter
- Base URL: `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/`
- Header: `X-API-Key: jobboerse-jobsuche` (stored as `BA_API_KEY` env var, default to that literal string)
- Search: `GET /pc/v4/jobs?was={keyword}&wo={location}&umkreis=50&page=1&size=50`
- Normalize: `refnr → source_job_id`, `stellenangebotsTitel → title`, `externeUrl → job_url`, etc.

## Dashboard port

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind v4 + the handoff `styles.css` ported to `globals.css` as-is (it's vanilla CSS with custom properties — no conversion needed). Tailwind utility classes used for new layout adjustments only; the design system already uses OKLCH custom properties throughout.
- **Fonts:** `next/font/google` for Inter Tight, JetBrains Mono, Space Grotesk, Fraunces
- **Theme:** `next-themes` for SSR-safe theme switching; preserves the `data-theme`/`data-font`/`data-card` attributes on `<html>`
- **Data:** Server component on `/` queries Supabase with filters from URL search params. Pagination is cursor-based (25/page). Filter state in URL for shareability. Client components handle interactions (scrubber drag, wheel rotate).
- **Detail:** Keep as modal drawer initially; route-parallel upgrade deferred.
- **Search:** Postgres FTS via `.textSearch('search_tsv', q)`.

## Cron / deploy

- **Local (now):** `launchd` plist or `cron` entry running `cd scraper && uv run python -m scraper.run` daily at 03:00 local.
- **VPS (later):** Dockerfile → `docker compose run --rm scraper` from a systemd timer. `.env` mounted in. Logs to stdout captured by systemd journal.

## Test strategy

- Unit: each source adapter has a frozen-fixture test (sample JSON in `tests/fixtures/`). Normalize functions tested against fixtures.
- Integration: end-to-end test runs a tiny profile (`"site reliability" in Berlin, results_wanted=5`) against the real Supabase, writes to a `jobs_test` schema, asserts row count > 0 and re-run updates `last_seen_at`.
- Dashboard: smoke test — `next build` succeeds, `/` renders with seeded data.

## Environment variables

`scraper/.env`:
```
SUPABASE_URL=https://ekkgtqxmvkqvaxjfkwbn.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...   # server-side only
BA_API_KEY=jobboerse-jobsuche
```

`jobportal/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://ekkgtqxmvkqvaxjfkwbn.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Both `.env` files `.gitignore`d; `.env.example` committed.

## Open items (deferred)

- VPS provider + domain (user will decide later).
- Auth / user accounts (not in scope; dashboard is read-only public).
- Applicant counts, relevance score — the design references these fields, but our scraped data doesn't supply them. Dashboard will compute relevance client-side from keyword match count; hide applicant count if unavailable.
- Route-parallel modal for deep-linked job detail (upgrade later).
