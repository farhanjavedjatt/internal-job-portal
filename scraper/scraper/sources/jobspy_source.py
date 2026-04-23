from __future__ import annotations

import logging
from typing import Any

from jobspy import scrape_jobs

from ..normalize import normalize_jobspy_row

log = logging.getLogger(__name__)

# Sites JobSpy supports — we only pass sites the user asked for.
SUPPORTED = {"linkedin", "indeed", "glassdoor", "zip_recruiter", "google", "bayt", "bdjobs", "naukri"}


def scrape_for(
    *,
    sites: list[str],
    keyword: str,
    location: str,
    country_indeed: str | None,
    hours_old: int,
    results_wanted: int,
    proxies: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Call JobSpy for a single (keyword, location) across sites. Normalizes rows."""
    sites = [s for s in sites if s in SUPPORTED]
    if not sites:
        return []

    log.info("jobspy: %s @ %s sites=%s", keyword, location, sites)
    try:
        df = scrape_jobs(
            site_name=sites,
            search_term=keyword,
            location=location,
            country_indeed=country_indeed or "usa",
            results_wanted=results_wanted,
            hours_old=hours_old,
            proxies=proxies or None,
            verbose=1,
        )
    except Exception as e:
        log.warning("jobspy call failed: %s", e)
        return []

    if df is None or df.empty:
        return []

    rows = df.to_dict(orient="records")
    normalized: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for r in rows:
        n = normalize_jobspy_row(r)
        if not n:
            continue
        key = (n["source"], n["source_job_id"])
        if key in seen:
            continue
        seen.add(key)
        normalized.append(n)

    log.info("jobspy: got %d normalized rows (raw=%d)", len(normalized), len(rows))
    return normalized
