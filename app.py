from __future__ import annotations

import os

from flask import Flask, jsonify, render_template, request
from werkzeug.middleware.proxy_fix import ProxyFix

from services.achievement_logic import build_summary, merge_achievements
from services.rate_limiter import InMemoryRateLimiter
from services.steam_scraper import SteamScrapeError, fetch_global_achievements, fetch_personal_achievements

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
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


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


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
            }
        )
    except SteamScrapeError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:  # pragma: no cover - safety net
        return jsonify({"error": f"Unexpected error: {exc}"}), 500


if __name__ == "__main__":
    from waitress import serve

    host = os.environ.get("DBD_HOST") or ("0.0.0.0" if os.environ.get("PORT") else "127.0.0.1")
    port = int(os.environ.get("PORT") or os.environ.get("DBD_PORT", "5000"))
    print(f"Starting DBD Achievement Tracker on http://{host}:{port}")
    serve(app, host=host, port=port)
