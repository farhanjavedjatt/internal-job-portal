from scraper.normalize import normalize_bundesagentur_row, normalize_jobspy_row


def test_normalize_jobspy_row_basic():
    row = {
        "site": "indeed",
        "id": "abc123",
        "title": "Senior Data Engineer",
        "company": "Acme",
        "location": "Berlin, Germany",
        "is_remote": True,
        "description": "Build pipelines",
        "date_posted": "2026-04-20",
        "min_amount": 90000,
        "max_amount": 120000,
        "currency": "EUR",
        "interval": "yearly",
        "job_url": "https://indeed.com/jobs/abc123",
    }
    out = normalize_jobspy_row(row)
    assert out is not None
    assert out["source"] == "indeed"
    assert out["source_job_id"] == "abc123"
    assert out["title"] == "Senior Data Engineer"
    assert out["location_country"] == "Germany"
    assert out["location_city"] == "Berlin"
    assert out["is_remote"] is True
    assert out["salary_min"] == 90000
    assert out["date_posted"] == "2026-04-20"


def test_normalize_jobspy_row_missing_id():
    assert normalize_jobspy_row({"site": "indeed"}) is None


def test_normalize_bundesagentur_row():
    row = {
        "refnr": "ABC-99",
        "titel": "DevOps Engineer",
        "arbeitgeber": "Beispiel GmbH",
        "arbeitsort": {"ort": "Berlin"},
        "aktuelleVeroeffentlichungsdatum": "2026-04-15",
        "externeUrl": "https://example.de/job/ABC-99",
    }
    out = normalize_bundesagentur_row(row)
    assert out is not None
    assert out["source"] == "bundesagentur"
    assert out["source_job_id"] == "ABC-99"
    assert out["location_country"] == "Germany"
    assert out["location_city"] == "Berlin"
    assert out["job_url"] == "https://example.de/job/ABC-99"


def test_normalize_bundesagentur_row_missing_refnr():
    assert normalize_bundesagentur_row({"titel": "no ref"}) is None
