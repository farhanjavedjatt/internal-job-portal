from __future__ import annotations

import logging
from typing import Any

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from ..normalize import normalize_bundesagentur_row

log = logging.getLogger(__name__)

BASE = "https://rest.arbeitsagentur.de/jobboerse/jobsuche-service"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8), reraise=True)
def _search_page(api_key: str, params: dict[str, Any]) -> dict[str, Any]:
    headers = {
        "X-API-Key": api_key,
        "Accept": "application/json",
        "User-Agent": "JobPortal-Scraper/0.1",
    }
    url = f"{BASE}/pc/v4/jobs"
    r = requests.get(url, headers=headers, params=params, timeout=30)
    if r.status_code == 404:
        # Bundesagentur returns 404 for "no results" sometimes — treat as empty
        return {"stellenangebote": [], "maxErgebnisse": 0}
    r.raise_for_status()
    return r.json()


def scrape_for(
    *,
    api_key: str,
    keyword: str,
    location: str,
    radius_km: int = 50,
    page_size: int = 100,
    max_pages: int = 100,
) -> list[dict[str, Any]]:
    """Fetch jobs from Bundesagentur für Arbeit for (keyword, location).

    Empty `keyword` means "all jobs in this location".
    Bundesagentur paginates max ~100 pages × 100 results = 10,000 per query.
    """
    log.info("bundesagentur: %s @ %s", keyword or "(all)", location)
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    consecutive_empty = 0
    total_max = None
    for page in range(1, max_pages + 1):
        params: dict[str, Any] = {
            "wo": location,
            "umkreis": radius_km,
            "page": page,
            "size": page_size,
        }
        # Only send `was` if a keyword was provided. Empty `was` returns the same
        # results, but skipping the param is cleaner and matches the API's intent.
        if keyword:
            params["was"] = keyword

        try:
            data = _search_page(api_key, params)
        except requests.HTTPError as e:
            log.warning("bundesagentur HTTP error: %s", e)
            break
        except requests.RequestException as e:
            log.warning("bundesagentur network error: %s", e)
            break

        if total_max is None:
            total_max = data.get("maxErgebnisse")

        items = data.get("stellenangebote") or []
        if not items:
            consecutive_empty += 1
            # API often returns empty pages briefly past the 10k cap before settling.
            if consecutive_empty >= 2:
                break
            continue
        consecutive_empty = 0

        for raw in items:
            n = normalize_bundesagentur_row(raw)
            if not n:
                continue
            if n["source_job_id"] in seen:
                continue
            seen.add(n["source_job_id"])
            out.append(n)

        if len(items) < page_size:
            break

    log.info(
        "bundesagentur: got %d rows from %r (api reports %s total matching)",
        len(out), location, total_max,
    )
    return out
