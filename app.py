from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from werkzeug.middleware.proxy_fix import ProxyFix

from services.achievement_logic import (
    build_summary,
    delete_achievement_override,
    load_achievement_overrides,
    merge_achievements,
    refresh_metadata_caches,
    upsert_achievement_override,
)
from services.rate_limiter import InMemoryRateLimiter
from services.steam_scraper import (
    SteamScrapeError,
    clear_global_cache,
    clear_profile_cache,
    fetch_global_achievements,
    fetch_personal_achievements,
    get_cache_summary,
)

BASE_DIR = Path(__file__).resolve().parent
VERSION_FILE = BASE_DIR / "VERSION.txt"
CHANGELOG_FILE = BASE_DIR / "data" / "changelog.json"
APP_VERSION = VERSION_FILE.read_text(encoding="utf-8").strip() if VERSION_FILE.exists() else "DBD-Achi-Tracker v1.4"
APP_NAME = "DBD Achievement Tracker"
ACCESS_PASSWORD = os.environ.get("DBD_ACCESS_PASSWORD", "").strip()
AUTH_REQUIRED = bool(ACCESS_PASSWORD)
ADMIN_TOOLS_ENABLED = os.environ.get("DBD_ENABLE_ADMIN_TOOLS", "1" if AUTH_REQUIRED else "0").strip().lower() in {"1", "true", "yes", "on"}


def load_changelog() -> list[dict[str, Any]]:
    if not CHANGELOG_FILE.exists():
        return []
    try:
        loaded = json.loads(CHANGELOG_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    return loaded if isinstance(loaded, list) else []


app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
app.secret_key = os.environ.get("DBD_SECRET_KEY") or os.environ.get("SECRET_KEY") or "dbd-achi-tracker-change-me"
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)  # type: ignore[assignment]

rate_limiter = InMemoryRateLimiter(
    max_requests=int(os.environ.get("DBD_RATE_LIMIT_MAX", "30")),
    window_seconds=int(os.environ.get("DBD_RATE_LIMIT_WINDOW_SECONDS", "60")),
)


def get_client_ip() -> str:
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return request.remote_addr or "unknown"


def is_authenticated() -> bool:
    return not AUTH_REQUIRED or session.get("dbd_authenticated") is True


def safe_next_url(value: str | None) -> str:
    if value and value.startswith("/") and not value.startswith("//"):
        return value
    return url_for("index")


def site_mode_label() -> str:
    return "Private" if AUTH_REQUIRED else "Public"


@app.before_request
def require_authentication_if_enabled():
    if not AUTH_REQUIRED:
        return None

    endpoint = request.endpoint or ""
    if endpoint in {"static", "login", "health"}:
        return None

    if is_authenticated():
        return None

    if request.path.startswith("/api/"):
        return jsonify({"error": "This instance is password-protected. Sign in first."}), 401

    return redirect(url_for("login", next=request.full_path if request.query_string else request.path))


def admin_tools_guard():
    if not ADMIN_TOOLS_ENABLED:
        return jsonify({"error": "Admin tools are disabled for this deployment."}), 403
    return None


@app.get("/")
def index():
    return render_template(
        "index.html",
        app_version=APP_VERSION,
        app_name=APP_NAME,
        changelog=load_changelog(),
        auth_required=AUTH_REQUIRED,
        admin_tools_enabled=ADMIN_TOOLS_ENABLED,
        site_mode=site_mode_label(),
    )


@app.route("/login", methods=["GET", "POST"])
def login():
    if not AUTH_REQUIRED:
        return redirect(url_for("index"))

    error = None
    next_url = safe_next_url(request.args.get("next") or request.form.get("next"))

    if request.method == "POST":
        submitted_password = request.form.get("password", "")
        if submitted_password == ACCESS_PASSWORD:
            session["dbd_authenticated"] = True
            return redirect(next_url)
        error = "Incorrect password."

    return render_template("login.html", app_version=APP_VERSION, app_name=APP_NAME, error=error, next_url=next_url)


@app.get("/logout")
def logout():
    session.clear()
    return redirect(url_for("login") if AUTH_REQUIRED else url_for("index"))


@app.get("/health")
def health():
    return jsonify({"status": "ok", "version": APP_VERSION, "siteMode": site_mode_label()})


@app.get("/api/admin/status")
def admin_status_api():
    guard = admin_tools_guard()
    if guard:
        return guard
    return jsonify(
        {
            "enabled": True,
            "siteMode": site_mode_label(),
            "authRequired": AUTH_REQUIRED,
            "cache": get_cache_summary(),
            "overrideCount": len(load_achievement_overrides()),
        }
    )


@app.post("/api/admin/cache/clear")
def clear_cache_api():
    guard = admin_tools_guard()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    target = (payload.get("target") or "all").strip().lower()
    profile_input = (payload.get("profile") or "").strip() or None

    cleared_global = False
    cleared_profiles = 0

    if target in {"all", "global"}:
        cleared_global = clear_global_cache()
    if target in {"all", "profiles"}:
        cleared_profiles = clear_profile_cache(profile_input)

    return jsonify(
        {
            "message": "Cache cleared.",
            "clearedGlobal": cleared_global,
            "clearedProfiles": cleared_profiles,
            "cache": get_cache_summary(),
        }
    )


@app.post("/api/admin/overrides")
def upsert_override_api():
    guard = admin_tools_guard()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    achievement_name = (payload.get("achievementName") or "").strip()

    try:
        overrides = upsert_achievement_override(
            achievement_name,
            {
                "role": payload.get("role"),
                "character": payload.get("character"),
                "chapter": payload.get("chapter"),
                "description": payload.get("description"),
                "releaseOrder": payload.get("releaseOrder"),
            },
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(
        {
            "message": f"Saved override for {achievement_name}.",
            "override": overrides.get(achievement_name, {}),
            "overrideCount": len(overrides),
        }
    )


@app.delete("/api/admin/overrides")
def delete_override_api():
    guard = admin_tools_guard()
    if guard:
        return guard

    payload = request.get_json(silent=True) or {}
    achievement_name = (payload.get("achievementName") or "").strip()
    overrides = delete_achievement_override(achievement_name)
    return jsonify({"message": f"Removed override for {achievement_name}.", "overrideCount": len(overrides)})


@app.post("/api/admin/reload-metadata")
def reload_metadata_api():
    guard = admin_tools_guard()
    if guard:
        return guard

    refresh_metadata_caches()
    return jsonify({"message": "Metadata caches refreshed."})


@app.post("/api/achievements")
def achievements_api():
    allowed, retry_after = rate_limiter.is_allowed(get_client_ip())
    if not allowed:
        return (
            jsonify(
                {
                    "error": "Rate limit reached. Please wait a moment before scraping Steam again.",
                    "retryAfter": retry_after,
                }
            ),
            429,
        )

    payload = request.get_json(silent=True) or {}
    profile_input = (payload.get("profile") or "").strip()
    force_refresh = bool(payload.get("forceRefresh", False))

    if not profile_input:
        return jsonify({"error": "Enter a Steam profile URL, SteamID64, or custom profile name."}), 400

    try:
        global_achievements = fetch_global_achievements(force_refresh=force_refresh)
        personal_data = fetch_personal_achievements(profile_input, force_refresh=force_refresh)
        merged = merge_achievements(global_achievements, personal_data["achievements"])
        summary = build_summary(merged)

        return jsonify(
            {
                "profile": {
                    "input": profile_input,
                    "profileName": personal_data["profile_name"],
                    "resolvedProfileUrl": personal_data["resolved_profile_url"],
                    "statsUrl": personal_data["stats_url"],
                },
                "summary": summary,
                "achievements": merged,
                "version": APP_VERSION,
            }
        )
    except SteamScrapeError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:  # pragma: no cover
        return jsonify({"error": f"Unexpected error: {exc}"}), 500


if __name__ == "__main__":
    from waitress import serve

    host = os.environ.get("DBD_HOST") or ("0.0.0.0" if os.environ.get("PORT") else "127.0.0.1")
    port = int(os.environ.get("PORT") or os.environ.get("DBD_PORT", "5000"))
    print(f"Starting {APP_VERSION} on http://{host}:{port}")
    serve(app, host=host, port=port)
