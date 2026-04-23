from __future__ import annotations

import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_secret_key: str
    ba_api_key: str
    proxies: list[str] = field(default_factory=list)


def load_settings() -> Settings:
    url = os.environ["SUPABASE_URL"]
    secret = os.environ["SUPABASE_SECRET_KEY"]
    ba = os.environ.get("BA_API_KEY", "jobboerse-jobsuche")
    proxies_raw = os.environ.get("PROXIES", "").strip()
    proxies = [p.strip() for p in proxies_raw.split(",") if p.strip()] if proxies_raw else []
    return Settings(
        supabase_url=url,
        supabase_secret_key=secret,
        ba_api_key=ba,
        proxies=proxies,
    )
