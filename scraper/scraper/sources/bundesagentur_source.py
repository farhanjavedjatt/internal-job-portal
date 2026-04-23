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
    page_size: int = 50,
    max_pages: int = 3,
) -> list[dict[str, Any]]:
    """Fetch jobs from Bundesagentur für Arbeit for (keyword, location)."""
    log.info("bundesagentur: %s @ %s", keyword, location)
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for page in range(1, max_pages + 1):
        try:
            data = _search_page(
                api_key,
                {
                    "was": keyword,
                    "wo": location,
                    "umkreis": radius_km,
                    "page": page,
                    "size": page_size,
                },
            )
        except requests.HTTPError as e:
            log.warning("bundesagentur HTTP error: %s", e)
            break
        except requests.RequestException as e:
            log.warning("bundesagentur network error: %s", e)
            break

        items = data.get("stellenangebote") or []
        if not items:
            break

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

    log.info("bundesagentur: got %d rows", len(out))
    return out
