# DBD Achievement Tracker

A Windows-friendly and Render-friendly app for scraping your completed **Dead by Daylight** achievements from a **public Steam profile**.

## Current features

- Includes a `.gitattributes` file to keep Git line endings predictable across Windows and Linux/Render

- Scrapes your completed DBD achievements from Steam
- Pulls the full DBD achievement list from Steam so locked achievements are shown too
- Lets you search by name, description, role, character, chapter, and status
- Lets you sort by:
  - name A-Z / Z-A
  - unlocked first / locked first
  - newest unlock / oldest unlock
  - role
  - character
  - release order
  - chapter
  - adept first
  - rarest / commonest
- Lets you filter by:
  - killer
  - survivor
  - general
  - unlocked / locked
  - exclude adept achievements from the main browser
- Uses a **curated override file** plus heuristics to improve role and character tagging accuracy
- Adds **character/chapter metadata** for release-based sorting
- Splits adept tools into two separate modules:
  - **Adept Browser** for sorting/filtering/searching adepts
  - **Random Adept Picker** for drawing a random locked killer, survivor, or combined adept
- Adds **export to CSV/JSON** for the currently visible browser results and adept results
- Adds a **force refresh** button to bypass cache and re-scrape Steam on demand
- Adds an in-app **About / Changelog** modal
- Adds **real local portrait assets** for most killers and survivors, with fallback portraits for the rest
- Adds a **custom theme selector**
- Adds a **pinned goals / challenge queue**
- Adds a **compare / leaderboard** module for loading multiple friend profiles
- Adds **insights views** including a role chart, unlock heatmap, and chapter grouping view
- Adds optional **Admin Tools** for:
  - clearing caches
  - editing achievement overrides from the UI
  - saving and force-refreshing metadata changes
- Supports optional **password protection** for hosted deployments
- Uses **Waitress** instead of Flask's development server when you start it with `python app.py`
- Adds **profile caching**, a **health endpoint**, and **basic rate limiting** for easier free hosting deployment

## Data files

### Achievement overrides

```text
data/achievement_overrides.json
```

Use this if you want to manually correct an achievement's role, description, character, or other tags.

### Character metadata

```text
data/character_metadata.json
```

Used for release/chapter sorting and character-linked UI details.

### In-app changelog

```text
data/changelog.json
```

Used by the About / Changelog modal.

## Requirements

- Windows 11 for local use
- Python 3.11+ recommended
- Internet connection
- Public Steam profile

## Quick start on Windows

### Option 1: easiest

Double-click:

```text
start_windows.bat
```

That will:
1. create a virtual environment
2. install dependencies
3. start the app with Waitress

Then open:

```text
http://127.0.0.1:5000
```

### Option 2: manual

Open PowerShell in this folder and run:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

## Render deploy steps

1. Create a GitHub repo.
2. Push this project.
3. Create a Render Web Service.
4. Use:

```text
Build command: pip install -r requirements.txt
Start command: python app.py
```

5. Deploy.

## Environment variables

The app supports these environment variables:

- `PORT`
  - Automatically used when provided by the host.
- `DBD_HOST`
  - Defaults to `0.0.0.0` when `PORT` exists, otherwise `127.0.0.1` locally.
- `DBD_PROFILE_CACHE_TTL_SECONDS`
  - Default: `900`
- `DBD_RATE_LIMIT_MAX`
  - Default: `30`
- `DBD_RATE_LIMIT_WINDOW_SECONDS`
  - Default: `60`
- `DBD_ACCESS_PASSWORD`
  - Optional. If set, the whole site requires login.
- `DBD_SECRET_KEY`
  - Strongly recommended when using password protection.
- `DBD_ENABLE_ADMIN_TOOLS`
  - Optional. Defaults to `1` when password protection is enabled, otherwise `0`.

## Using a `.env` file

If your host reads `.env` files and exposes them as real environment variables, no code changes are needed.

A starter file is included here:

```text
.env.example
```

## Notes about free hosting

- Free hosts may sleep after inactivity.
- The first request after sleeping may be slow.
- Since this app scrapes Steam pages, avoid refreshing too aggressively.
- The built-in rate limit is intentionally simple and intended mainly to protect a hobby deployment.

## Profile input formats supported

You can enter any of these:

- full Steam profile URL
  - `https://steamcommunity.com/id/yourname`
  - `https://steamcommunity.com/profiles/7656119xxxxxxxxxx`
- bare SteamID64
- bare custom profile name

## Project structure

```text
app.py
requirements.txt
start_windows.bat
render.yaml
Procfile
runtime.txt
services/
  steam_scraper.py
  achievement_logic.py
  rate_limiter.py
static/
  app.js
  styles.css
  portraits/
templates/
  index.html
  login.html
data/
  achievement_overrides.json
  character_metadata.json
  changelog.json
  portrait_manifest.json
  global_achievements_cache.json
  profile_cache/              # created automatically at runtime
VERSION.txt
```

## Troubleshooting

### "Profile is private"
Your Steam profile must be public for scraping to work.

### No achievements found
Make sure:
- the profile URL is correct
- the account owns/has played Dead by Daylight
- the profile is public

### Steam page structure changes
This app scrapes Steam HTML pages. If Steam changes the page structure, the parser may need a small update.
