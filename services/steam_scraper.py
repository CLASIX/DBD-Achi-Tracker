from __future__ import annotations

import hashlib
import json
import os
import re
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse

import requests
from bs4 import BeautifulSoup

APP_ID = 381210
GLOBAL_ACHIEVEMENTS_URL = f"https://steamcommunity.com/stats/{APP_ID}/achievements/?l=english"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
GLOBAL_CACHE_PATH = DATA_DIR / "global_achievements_cache.json"
PROFILE_CACHE_DIR = DATA_DIR / "profile_cache"
GLOBAL_CACHE_TTL = timedelta(hours=24)
REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}


def node_text(node: Any) -> str:
    if not node:
        return ""
    return normalize_whitespace(node.get_text(" ", strip=True))


class SteamScrapeError(Exception):
    pass


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\xa0", " ")).strip()


def get_profile_cache_ttl() -> timedelta:
    seconds = int(os.environ.get("DBD_PROFILE_CACHE_TTL_SECONDS", "900"))
    return timedelta(seconds=max(0, seconds))


def build_stats_url(profile_input: str) -> str:
    profile_url = normalize_profile_input(profile_input)
    return f"{profile_url.rstrip('/')}/stats/{APP_ID}/?tab=achievements&l=english"


def normalize_profile_input(profile_input: str) -> str:
    raw_value = (profile_input or "").strip()
    if not raw_value:
        raise SteamScrapeError("Enter a Steam profile URL, SteamID64, or custom profile name.")

    if raw_value.isdigit():
        return f"https://steamcommunity.com/profiles/{raw_value}"

    if "steamcommunity.com" in raw_value.lower():
        value = raw_value if raw_value.startswith(("http://", "https://")) else f"https://{raw_value}"
        parsed = urlparse(value)
        path = parsed.path.rstrip("/")
        if path.startswith("/id/") or path.startswith("/profiles/"):
            return f"https://steamcommunity.com{path}"
        raise SteamScrapeError("That Steam URL does not look like a profile URL. Use /id/<name> or /profiles/<steamid64>.")

    safe_name = quote(raw_value.strip("/"))
    return f"https://steamcommunity.com/id/{safe_name}"


def request_html(url: str) -> requests.Response:
    try:
        response = requests.get(url, headers=REQUEST_HEADERS, timeout=30, allow_redirects=True)
    except requests.RequestException as exc:  # pragma: no cover - network exception path
        raise SteamScrapeError(f"Could not reach Steam: {exc}") from exc

    if response.status_code >= 400:
        raise SteamScrapeError(f"Steam returned HTTP {response.status_code} for {url}")

    return response


def parse_global_achievements(html: str) -> list[dict[str, Any]]:
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.select(".achieveRow")
    achievements: list[dict[str, Any]] = []

    for row in rows:
        name = node_text(row.select_one("h3"))
        description = node_text(row.select_one("h5"))
        percent_text = node_text(row.select_one(".achievePercent")).replace("%", "")
        icon = row.select_one("img")

        if not name:
            continue

        try:
            global_percent = float(percent_text)
        except ValueError:
            global_percent = None

        achievements.append(
            {
                "name": name,
                "description": description,
                "icon": icon.get("src") if icon else "",
                "globalPercent": global_percent,
            }
        )

    if not achievements:
        raise SteamScrapeError("Could not parse the global Dead by Daylight achievement list from Steam.")

    return achievements


def parse_unlock_time(unlock_text: str) -> tuple[str | None, str | None]:
    cleaned = normalize_whitespace(unlock_text.replace("Unlocked", "", 1))
    if not cleaned:
        return None, None

    for fmt in ("%b %d, %Y @ %I:%M%p", "%b %d, %Y @ %I:%M %p"):
        try:
            parsed = datetime.strptime(cleaned, fmt)
            return parsed.isoformat(), cleaned
        except ValueError:
            continue

    return None, cleaned


def parse_personal_achievements(html: str, resolved_url: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    page_text = normalize_whitespace(soup.get_text(" ", strip=True))

    if "this profile is private" in page_text.lower():
        raise SteamScrapeError("That Steam profile is private, so the app cannot scrape its achievements.")
    if "error" in (soup.title.get_text(" ", strip=True).lower() if soup.title else ""):
        raise SteamScrapeError("Steam returned an error page for that profile.")

    rows = soup.select(".achieveRow")
    achievements: list[dict[str, Any]] = []

    for row in rows:
        if row.select_one(".achieveHiddenBox"):
            continue

        name = node_text(row.select_one("h3"))
        description = node_text(row.select_one("h5"))
        unlock_element = row.select_one(".achieveUnlockTime")
        unlock_text = node_text(unlock_element)
        progress_text = node_text(row.select_one(".progressText"))
        icon = row.select_one("img")
        unlock_iso, unlock_display = parse_unlock_time(unlock_text)
        unlocked = bool(unlock_element)

        if not name:
            continue

        achievements.append(
            {
                "name": name,
                "description": description,
                "icon": icon.get("src") if icon else "",
                "unlocked": unlocked,
                "unlockDate": unlock_iso,
                "unlockDisplay": unlock_display,
                "progressDisplay": progress_text or None,
            }
        )

    profile_name = "Unknown Steam user"
    title_text = soup.title.get_text(" ", strip=True) if soup.title else ""
    if "::" in title_text:
        profile_name = title_text.split("::")[-1].strip()

    if not achievements and "achievements earned" not in page_text.lower():
        raise SteamScrapeError(
            "Could not find Dead by Daylight achievements for that profile. Make sure the profile is public and the URL is correct."
        )

    return {
        "profile_name": profile_name,
        "resolved_profile_url": resolved_url.split("/stats/")[0].rstrip("/"),
        "stats_url": resolved_url,
        "achievements": achievements,
    }


def read_json_file(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def write_json_file(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def read_global_cache() -> list[dict[str, Any]] | None:
    cached = read_json_file(GLOBAL_CACHE_PATH)
    if not cached:
        return None

    fetched_at = cached.get("fetchedAt")
    achievements = cached.get("achievements")
    if not fetched_at or not isinstance(achievements, list):
        return None

    try:
        fetched_at_dt = datetime.fromisoformat(fetched_at)
    except ValueError:
        return None

    if datetime.now(UTC) - fetched_at_dt > GLOBAL_CACHE_TTL:
        return None

    return achievements


def write_global_cache(achievements: list[dict[str, Any]]) -> None:
    payload = {
        "fetchedAt": datetime.now(UTC).isoformat(),
        "achievements": achievements,
    }
    write_json_file(GLOBAL_CACHE_PATH, payload)


def profile_cache_path(profile_input: str) -> Path:
    normalized = normalize_profile_input(profile_input)
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    return PROFILE_CACHE_DIR / f"{digest}.json"


def read_profile_cache(profile_input: str) -> dict[str, Any] | None:
    ttl = get_profile_cache_ttl()
    if ttl <= timedelta(0):
        return None

    cached = read_json_file(profile_cache_path(profile_input))
    if not cached:
        return None

    fetched_at = cached.get("fetchedAt")
    data = cached.get("data")
    if not fetched_at or not isinstance(data, dict):
        return None

    try:
        fetched_at_dt = datetime.fromisoformat(fetched_at)
    except ValueError:
        return None

    if datetime.now(UTC) - fetched_at_dt > ttl:
        return None

    return data


def write_profile_cache(profile_input: str, data: dict[str, Any]) -> None:
    payload = {
        "fetchedAt": datetime.now(UTC).isoformat(),
        "data": data,
    }
    write_json_file(profile_cache_path(profile_input), payload)


def clear_global_cache() -> bool:
    if GLOBAL_CACHE_PATH.exists():
        GLOBAL_CACHE_PATH.unlink()
        return True
    return False


def clear_profile_cache(profile_input: str | None = None) -> int:
    if profile_input:
        cache_path = profile_cache_path(profile_input)
        if cache_path.exists():
            cache_path.unlink()
            return 1
        return 0

    if not PROFILE_CACHE_DIR.exists():
        return 0

    removed = 0
    for path in PROFILE_CACHE_DIR.glob('*.json'):
        path.unlink()
        removed += 1
    return removed


def get_cache_summary() -> dict[str, Any]:
    profile_cache_count = len(list(PROFILE_CACHE_DIR.glob('*.json'))) if PROFILE_CACHE_DIR.exists() else 0
    return {
        'globalCacheExists': GLOBAL_CACHE_PATH.exists(),
        'profileCacheCount': profile_cache_count,
        'profileCacheTtlSeconds': int(get_profile_cache_ttl().total_seconds()),
    }


def fetch_global_achievements(force_refresh: bool = False) -> list[dict[str, Any]]:
    if not force_refresh:
        cached = read_global_cache()
        if cached:
            return cached

    response = request_html(GLOBAL_ACHIEVEMENTS_URL)
    achievements = parse_global_achievements(response.text)
    write_global_cache(achievements)
    return achievements


def fetch_personal_achievements(profile_input: str, force_refresh: bool = False) -> dict[str, Any]:
    if not force_refresh:
        cached = read_profile_cache(profile_input)
        if cached:
            return cached

    stats_url = build_stats_url(profile_input)
    response = request_html(stats_url)
    parsed = parse_personal_achievements(response.text, response.url)
    write_profile_cache(profile_input, parsed)
    return parsed
