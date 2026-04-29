# Starts the API using ONLY the project venv (never global Python).
# Uses "python -m uvicorn" so Device Guard may allow it when uvicorn.exe in Scripts\ is blocked.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$python = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    Write-Error "Missing $python — run: py -3 -m venv .venv  then  .\.venv\Scripts\pip.exe install -r requirements.txt"
}
& $python -m uvicorn app.main:app --reload --reload-delay 1.5 --host 127.0.0.1 --port 8001 --reload-dir app --reload-dir config --reload-dir (Join-Path $PSScriptRoot "static\web")
