from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from supabase import Client, create_client

from .config import Settings

log = logging.getLogger(__name__)


def build_client(settings: Settings) -> Client:
    return create_client(settings.supabase_url, settings.supabase_secret_key)


def load_enabled_profiles(client: Client) -> list[dict[str, Any]]:
    resp = (
        client.table("search_profiles")
        .select("*")
        .eq("enabled", True)
        .execute()
    )
    return resp.data or []


def upsert_jobs(client: Client, rows: list[dict[str, Any]]) -> tuple[int, int]:
    """Upsert jobs on (source, source_job_id).

    Returns (upserted_total, 0). We don't split inserted vs updated for the
    full-Germany sweep — PostgREST's `in.()` URL filter overflows past a few
    hundred ids, and per-row pre-queries are too slow at this scale. The DB
    handles dedup via the unique constraint; jobs.first_seen_at vs last_seen_at
    is the source of truth for new-vs-seen.
    """
    if not rows:
        return 0, 0

    now = datetime.now(timezone.utc).isoformat()
    for r in rows:
        r["last_seen_at"] = now
        r["is_active"] = True

    BATCH = 200  # keeps each request body well under PostgREST 1MB cap
    upserted = 0
    for i in range(0, len(rows), BATCH):
        batch = rows[i : i + BATCH]
        client.table("jobs").upsert(
            batch,
            on_conflict="source,source_job_id",
            returning="minimal",
        ).execute()
        upserted += len(batch)

    return upserted, 0


def log_run_start(
    client: Client,
    profile_id: str | None,
    profile_name: str,
    source: str,
) -> str:
    resp = (
        client.table("scrape_runs")
        .insert(
            {
                "profile_id": profile_id,
                "profile_name": profile_name,
                "source": source,
            }
        )
        .execute()
    )
    return resp.data[0]["id"]


def log_run_finish(
    client: Client,
    run_id: str,
    jobs_found: int,
    jobs_inserted: int,
    jobs_updated: int,
    error: str | None,
) -> None:
    client.table("scrape_runs").update(
        {
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "jobs_found": jobs_found,
            "jobs_inserted": jobs_inserted,
            "jobs_updated": jobs_updated,
            "error": error,
        }
    ).eq("id", run_id).execute()


def coerce_uuid(value: Any) -> str | None:
    if value is None:
        return None
    try:
        return str(UUID(str(value)))
    except (ValueError, TypeError):
        return None
