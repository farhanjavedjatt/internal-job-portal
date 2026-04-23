"""Normalize source rows to the unified `jobs` schema."""
from __future__ import annotations

import math
import re
from datetime import date, datetime
from typing import Any


def _clean(value: Any) -> Any:
    """Convert NaN / empty string / pandas NA to None."""
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if isinstance(value, str):
        stripped = value.strip()
        return stripped or None
    return value


def _parse_date(value: Any) -> str | None:
    value = _clean(value)
    if value is None:
        return None
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, datetime):
        return value.date().isoformat()
    try:
        return datetime.fromisoformat(str(value)).date().isoformat()
    except (ValueError, TypeError):
        return None


def _split_location(loc: str | None) -> tuple[str | None, str | None, str | None]:
    """Heuristic split of free-text location into (country, city, state)."""
    loc = _clean(loc)
    if not loc:
        return None, None, None
    parts = [p.strip() for p in str(loc).split(",") if p.strip()]
    if len(parts) == 1:
        return None, parts[0], None
    if len(parts) == 2:
        return parts[1], parts[0], None
    return parts[-1], parts[0], parts[1]


def normalize_jobspy_row(row: dict[str, Any]) -> dict[str, Any] | None:
    """Map a JobSpy DataFrame row (as dict) to the unified schema."""
    source = _clean(row.get("site"))
    source_job_id = _clean(row.get("id")) or _clean(row.get("job_url"))
    if not source or not source_job_id:
        return None

    country, city, state = _split_location(row.get("location"))

    return {
        "source": source,
        "source_job_id": str(source_job_id),
        "title": _clean(row.get("title")) or "(untitled)",
        "company": _clean(row.get("company")),
        "company_url": _clean(row.get("company_url")),
        "location_country": country,
        "location_city": city,
        "location_state": state,
        "is_remote": bool(row.get("is_remote")) if _clean(row.get("is_remote")) is not None else False,
        "description": _clean(row.get("description")),
        "job_type": _clean(row.get("job_type")),
        "job_function": _clean(row.get("job_function")),
        "job_level": _clean(row.get("job_level")),
        "date_posted": _parse_date(row.get("date_posted")),
        "salary_min": _to_number(row.get("min_amount")),
        "salary_max": _to_number(row.get("max_amount")),
        "salary_currency": _clean(row.get("currency")),
        "salary_interval": _clean(row.get("interval")),
        "job_url": _clean(row.get("job_url")),
        "tags": _extract_tags(row),
        "raw": _serializable(row),
    }


def normalize_bundesagentur_row(row: dict[str, Any]) -> dict[str, Any] | None:
    """Map a Bundesagentur search result entry to the unified schema."""
    refnr = _clean(row.get("refnr")) or _clean(row.get("referenznummer"))
    if not refnr:
        return None

    city = _clean((row.get("arbeitsort") or {}).get("ort")) if isinstance(row.get("arbeitsort"), dict) else None
    country = "Germany"

    return {
        "source": "bundesagentur",
        "source_job_id": str(refnr),
        "title": _clean(row.get("titel")) or _clean(row.get("beruf")) or "(untitled)",
        "company": _clean(row.get("arbeitgeber")),
        "company_url": None,
        "location_country": country,
        "location_city": city,
        "location_state": None,
        "is_remote": False,
        "description": _clean(row.get("stellenbeschreibung")),
        "job_type": None,
        "job_function": _clean(row.get("beruf")),
        "job_level": None,
        "date_posted": _parse_date(row.get("aktuelleVeroeffentlichungsdatum") or row.get("eintrittsdatum")),
        "salary_min": None,
        "salary_max": None,
        "salary_currency": "EUR",
        "salary_interval": None,
        "job_url": _clean(row.get("externeUrl")) or f"https://www.arbeitsagentur.de/jobsuche/jobdetail/{refnr}",
        "tags": [],
        "raw": _serializable(row),
    }


def _to_number(value: Any) -> float | None:
    value = _clean(value)
    if value is None:
        return None
    try:
        f = float(value)
        return None if math.isnan(f) else f
    except (TypeError, ValueError):
        return None


def _extract_tags(row: dict[str, Any]) -> list[str]:
    """Pull skills from description if possible. Naukri already gives skills."""
    existing = row.get("skills")
    if isinstance(existing, list) and existing:
        return [str(t).strip().lower() for t in existing if t]
    if isinstance(existing, str) and existing.strip():
        return [t.strip().lower() for t in re.split(r"[,;|]", existing) if t.strip()]
    return []


def _serializable(row: dict[str, Any]) -> dict[str, Any]:
    """Best-effort JSON-safe dict (drops NaN, datetimes → iso)."""
    out: dict[str, Any] = {}
    for k, v in row.items():
        if isinstance(v, float) and math.isnan(v):
            out[k] = None
        elif isinstance(v, (datetime, date)):
            out[k] = v.isoformat()
        elif isinstance(v, (str, int, bool, type(None))):
            out[k] = v
        elif isinstance(v, float):
            out[k] = v
        elif isinstance(v, (list, tuple)):
            out[k] = [_serializable_scalar(x) for x in v]
        elif isinstance(v, dict):
            out[k] = {kk: _serializable_scalar(vv) for kk, vv in v.items()}
        else:
            out[k] = str(v)
    return out


def _serializable_scalar(v: Any) -> Any:
    if isinstance(v, float) and math.isnan(v):
        return None
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    if isinstance(v, (str, int, bool, float, type(None))):
        return v
    return str(v)
