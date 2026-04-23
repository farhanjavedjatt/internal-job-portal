"""CLI entrypoint: python -m scraper.run [--profile name] [--dry-run]"""
from __future__ import annotations

import argparse
import logging
import sys
import traceback
from typing import Any

from .config import load_settings
from .sources import bundesagentur_source, jobspy_source
from .supabase_client import (
    build_client,
    load_enabled_profiles,
    log_run_finish,
    log_run_start,
    upsert_jobs,
)


def _configure_logging(verbose: bool) -> None:
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    # Silence noisy HTTP-layer debug even when -v is on.
    for name in ("hpack", "hpack.hpack", "hpack.table", "httpcore", "httpx", "urllib3"):
        logging.getLogger(name).setLevel(logging.WARNING)


def run_profile(
    client: Any,
    profile: dict[str, Any],
    proxies: list[str],
    ba_api_key: str,
    dry_run: bool,
) -> dict[str, int]:
    totals = {"found": 0, "inserted": 0, "updated": 0}
    keywords = profile.get("keywords") or []
    locations = profile.get("locations") or []
    sites = profile.get("sites") or []
    country_indeed = profile.get("country_indeed")
    hours_old = profile.get("hours_old") or 72
    results_wanted = profile.get("results_wanted") or 50
    include_ba = bool(profile.get("include_bundesagentur"))

    # JobSpy: one call per keyword×location, all sites in one shot
    for kw in keywords:
        for loc in locations:
            run_id = (
                None
                if dry_run
                else log_run_start(client, profile.get("id"), profile["name"], "jobspy")
            )
            error: str | None = None
            rows: list[dict[str, Any]] = []
            inserted = updated = 0
            try:
                rows = jobspy_source.scrape_for(
                    sites=sites,
                    keyword=kw,
                    location=loc,
                    country_indeed=country_indeed,
                    hours_old=hours_old,
                    results_wanted=results_wanted,
                    proxies=proxies,
                )
                totals["found"] += len(rows)
                if not dry_run and rows:
                    inserted, updated = upsert_jobs(client, rows)
                    totals["inserted"] += inserted
                    totals["updated"] += updated
            except Exception as e:
                error = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
                logging.exception("jobspy run failed for %s @ %s", kw, loc)
            finally:
                if not dry_run and run_id:
                    log_run_finish(client, run_id, len(rows), inserted, updated, error)

    # Bundesagentur: same pattern, Germany-only
    if include_ba:
        for kw in keywords:
            for loc in locations:
                if "german" not in loc.lower() and "berlin" not in loc.lower():
                    continue
                run_id = (
                    None
                    if dry_run
                    else log_run_start(client, profile.get("id"), profile["name"], "bundesagentur")
                )
                error = None
                rows = []
                inserted = updated = 0
                try:
                    rows = bundesagentur_source.scrape_for(
                        api_key=ba_api_key,
                        keyword=kw,
                        location=loc.split(",")[0],  # Bundesagentur wants just the city
                    )
                    totals["found"] += len(rows)
                    if not dry_run and rows:
                        inserted, updated = upsert_jobs(client, rows)
                        totals["inserted"] += inserted
                        totals["updated"] += updated
                except Exception as e:
                    error = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
                    logging.exception("bundesagentur run failed for %s @ %s", kw, loc)
                finally:
                    if not dry_run and run_id:
                        log_run_finish(
                            client, run_id, len(rows), inserted, updated, error
                        )

    return totals


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the job portal scraper.")
    parser.add_argument("--profile", help="Profile name filter (default: all enabled)")
    parser.add_argument("--dry-run", action="store_true", help="Fetch only; do not write")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    _configure_logging(args.verbose)
    settings = load_settings()
    client = build_client(settings)

    profiles = load_enabled_profiles(client)
    if args.profile:
        profiles = [p for p in profiles if p["name"] == args.profile]
    if not profiles:
        logging.error("No enabled profiles found%s.", f" named {args.profile!r}" if args.profile else "")
        return 2

    grand = {"found": 0, "inserted": 0, "updated": 0}
    for profile in profiles:
        logging.info("=== profile: %s ===", profile["name"])
        totals = run_profile(client, profile, settings.proxies, settings.ba_api_key, args.dry_run)
        for k in grand:
            grand[k] += totals[k]
        logging.info("profile %s done: %s", profile["name"], totals)

    logging.info("grand totals: %s", grand)
    return 0


if __name__ == "__main__":
    sys.exit(main())
