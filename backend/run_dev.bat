@echo off
setlocal
cd /d "%~dp0"
set "PY=%CD%\.venv\Scripts\python.exe"
if not exist "%PY%" (
  echo Missing "%PY%"
  echo Create venv:  py -3 -m venv .venv
  echo Then install: .\.venv\Scripts\pip.exe install -r requirements.txt
  pause
  exit /b 1
)
REM Use "python -m uvicorn" so Device Guard does not block uvicorn.exe in Scripts\
REM --reload-delay reduces rapid double-reloads (common with OneDrive / editors saving often).
"%PY%" -m uvicorn app.main:app --reload --reload-delay 1.5 --host 127.0.0.1 --port 8001 --reload-dir app --reload-dir config --reload-dir static\web
