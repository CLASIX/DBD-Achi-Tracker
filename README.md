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
- Uses **Waitress** instead of Flask's development server when you start it with `python app.py`, so you do not get the development server warning

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

- Windows 11
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
services/
  steam_scraper.py
  achievement_logic.py
static/
  app.js
  styles.css
templates/
  index.html
data/
  achievement_overrides.json
  character_metadata.json
  global_achievements_cache.json
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
