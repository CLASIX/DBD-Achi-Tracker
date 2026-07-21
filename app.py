from __future__ import annotations

import os

from flask import Flask, jsonify, render_template, request

from services.achievement_logic import build_summary, merge_achievements
from services.steam_scraper import SteamScrapeError, fetch_global_achievements, fetch_personal_achievements

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/achievements")
def achievements_api():
    payload = request.get_json(silent=True) or {}
    profile_input = (payload.get("profile") or "").strip()
    force_refresh = bool(payload.get("forceRefresh", True))

    if not profile_input:
        return jsonify({"error": "Enter a Steam profile URL, SteamID64, or custom profile name."}), 400

    try:
        global_achievements = fetch_global_achievements(force_refresh=force_refresh)
        personal_data = fetch_personal_achievements(profile_input)
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

    host = os.environ.get("DBD_HOST", "127.0.0.1")
    port = int(os.environ.get("DBD_PORT", "5000"))
    print(f"Starting DBD Achievement Tracker on http://{host}:{port}")
    serve(app, host=host, port=port)
