@echo off
REM Same API and /ui/ as run_dev.bat, but NO auto-reload — avoids noisy reloads / subprocess races
REM (especially with OneDrive or rapid saves). Use while demoing or if reload keeps interrupting startup.
setlocal
cd /d "%~dp0"
set "PY=%CD%\.venv\Scripts\python.exe"
if not exist "%PY%" (
  echo Missing "%PY%" — create .venv and pip install -r requirements.txt
  pause
  exit /b 1
)
"%PY%" -m uvicorn app.main:app --host 127.0.0.1 --port 8001
