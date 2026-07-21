# DBD Achievement Tracker

A Windows-friendly local app for scraping your completed **Dead by Daylight** achievements from a **public Steam profile**.

## Current features

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
- Adds **saved profiles** stored locally in your browser
- Adds **export to CSV/JSON** for the currently visible browser results and adept results
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

## Free hosting: easiest path

The easiest free hosting option for this app is:

1. create a GitHub repository
2. push this project to GitHub
3. deploy it on **Render** as a Python web service

This project already includes:

- `render.yaml`
- `Procfile`
- `runtime.txt`
- Waitress startup
- `/health` endpoint
- profile caching
- simple in-memory rate limiting

### Render deploy steps

1. Create a new GitHub repo.
2. Upload/push the contents of this project.
3. Create a Render account.
4. Choose **New Web Service**.
5. Connect your GitHub repo.
6. Render should detect the Python app. If needed, use:

```text
Build command: pip install -r requirements.txt
Start command: python app.py
```

7. Set the free plan if available.
8. Deploy.

### Render environment variables

The app is ready to use these environment variables:

- `PORT`
  - Automatically used when supplied by the host.
- `DBD_HOST`
  - Defaults to `0.0.0.0` when `PORT` exists, otherwise `127.0.0.1` locally.
- `DBD_PROFILE_CACHE_TTL_SECONDS`
  - Default: `900`
- `DBD_RATE_LIMIT_MAX`
  - Default: `30`
- `DBD_RATE_LIMIT_WINDOW_SECONDS`
  - Default: `60`

### Using a `.env` file

If your hosting platform reads a `.env` file and exposes those values as real environment variables, you do **not** need any code updates.

A starter file is included here:

```text
.env.example
```

If your platform does **not** auto-load `.env` files into the process environment, then the current app will **not** read `.env` by itself. In that case you should either:

1. add the variables in the host's environment variable dashboard, or
2. ask me to add `python-dotenv` support in the code

### Notes about free hosting

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
templates/
  index.html
data/
  achievement_overrides.json
  character_metadata.json
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
