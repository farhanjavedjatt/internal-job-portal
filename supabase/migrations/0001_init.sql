-- Job Portal: initial schema
-- Safe to run multiple times.

create extension if not exists "pgcrypto";

-- ============================================================
-- jobs
-- ============================================================
create table if not exists public.jobs (
  id                uuid primary key default gen_random_uuid(),
  source            text not null,
  source_job_id     text not null,
  title             text not null,
  company           text,
  company_url       text,
  location_country  text,
  location_city     text,
  location_state    text,
  is_remote         boolean default false,
  description       text,
  job_type          text,
  job_function      text,
  job_level         text,
  date_posted       date,
  salary_min        numeric,
  salary_max        numeric,
  salary_currency   text,
  salary_interval   text,
  job_url           text,
  tags              text[] default '{}',
  raw               jsonb,
  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  is_active         boolean not null default true,
  search_tsv        tsvector generated always as (
                      to_tsvector('simple',
                        coalesce(title,'') || ' ' ||
                        coalesce(company,'') || ' ' ||
                        coalesce(description,''))
                    ) stored
);

create unique index if not exists jobs_source_unique
  on public.jobs (source, source_job_id);

create index if not exists jobs_date_posted_idx
  on public.jobs (date_posted desc nulls last);

create index if not exists jobs_last_seen_idx
  on public.jobs (last_seen_at desc);

create index if not exists jobs_search_tsv_idx
  on public.jobs using gin (search_tsv);

create index if not exists jobs_tags_idx
  on public.jobs using gin (tags);

create index if not exists jobs_country_idx
  on public.jobs (location_country);

create index if not exists jobs_is_remote_idx
  on public.jobs (is_remote);

-- ============================================================
-- search_profiles
-- ============================================================
create table if not exists public.search_profiles (
  id                     uuid primary key default gen_random_uuid(),
  name                   text unique not null,
  keywords               text[] not null default '{}',
  locations              text[] not null default '{}',
  sites                  text[] not null default '{}',
  country_indeed         text,
  hours_old              int default 72,
  results_wanted         int default 50,
  include_bundesagentur  boolean default false,
  enabled                boolean not null default true,
  created_at             timestamptz not null default now()
);

-- ============================================================
-- scrape_runs
-- ============================================================
create table if not exists public.scrape_runs (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references public.search_profiles(id) on delete set null,
  profile_name    text,
  source          text not null,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  jobs_found      int default 0,
  jobs_inserted   int default 0,
  jobs_updated    int default 0,
  error           text
);

create index if not exists scrape_runs_started_idx
  on public.scrape_runs (started_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table public.jobs              enable row level security;
alter table public.search_profiles   enable row level security;
alter table public.scrape_runs       enable row level security;

-- anon/authenticated: read jobs only
drop policy if exists "jobs_read_public" on public.jobs;
create policy "jobs_read_public" on public.jobs
  for select to anon, authenticated
  using (is_active = true);

-- no policies on search_profiles or scrape_runs → anon blocked.
-- service_role bypasses RLS automatically.
