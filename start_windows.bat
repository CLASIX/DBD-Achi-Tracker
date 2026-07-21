@echo off
setlocal
cd /d %~dp0

where py >nul 2>nul
if %errorlevel%==0 (
  set PYTHON_CMD=py
) else (
  set PYTHON_CMD=python
)

if not exist .venv\Scripts\python.exe (
  echo Creating virtual environment...
  %PYTHON_CMD% -m venv .venv
  call .venv\Scripts\activate
  python -m pip install --upgrade pip
  pip install -r requirements.txt
) else (
  call .venv\Scripts\activate
)

echo Starting DBD Achievement Tracker with Waitress...
echo Open http://127.0.0.1:5000 in your browser.
python app.py
pause
