$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$uvicorn = Join-Path $PSScriptRoot ".venv\Scripts\uvicorn.exe"
if (-not (Test-Path $uvicorn)) {
    Write-Error "Missing $uvicorn — create venv and pip install -r requirements.txt first."
}
& $uvicorn app.main:app --reload --host 127.0.0.1 --port 8001 --reload-dir app --reload-dir config
