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

    Returns (inserted_count, updated_count). We can't reliably tell them apart
    from the PostgREST response, so we pre-query for existing keys.
    """
    if not rows:
        return 0, 0

    now = datetime.now(timezone.utc).isoformat()
    for r in rows:
        r["last_seen_at"] = now
        r["is_active"] = True

    # Find which already exist to split counts
    keys = [(r["source"], r["source_job_id"]) for r in rows]
    sources = list({k[0] for k in keys})
    ids = [k[1] for k in keys]
    existing_resp = (
        client.table("jobs")
        .select("source,source_job_id")
        .in_("source", sources)
        .in_("source_job_id", ids)
        .execute()
    )
    existing_keys = {(r["source"], r["source_job_id"]) for r in (existing_resp.data or [])}

    inserted = sum(1 for k in keys if k not in existing_keys)
    updated = len(keys) - inserted

    # Batch upserts (PostgREST 1000-row limit)
    BATCH = 500
    for i in range(0, len(rows), BATCH):
        batch = rows[i : i + BATCH]
        client.table("jobs").upsert(
            batch,
            on_conflict="source,source_job_id",
            returning="minimal",
        ).execute()

    return inserted, updated


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
