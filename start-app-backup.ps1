# PowerShell script to start both client and server and fix common issues
# This is a workaround for the '&&' operator not working in PowerShell

Write-Host "Starting Quiz Knight Challenge Application..." -ForegroundColor Green

# Check for theme.json and create it if missing
$themeJsonPath = Join-Path -Path $PWD -ChildPath "client\theme.json"
if (-not (Test-Path $themeJsonPath)) {
    Write-Host "Creating missing theme.json file..." -ForegroundColor Yellow
    $themeJsonContent = @"
{
  "name": "QuizKnight",
  "colors": {
    "background": "#ffffff",
    "foreground": "#09090b",
    "card": "#ffffff",
    "card-foreground": "#09090b",
    "primary": "#7856ff",
    "primary-foreground": "#ffffff",
    "secondary": "#f4f4f5",
    "secondary-foreground": "#09090b",
    "muted": "#f4f4f5",
    "muted-foreground": "#71717a",
    "accent": "#f4f4f5",
    "accent-foreground": "#09090b",
    "destructive": "#ef4444",
    "destructive-foreground": "#ffffff",
    "border": "#e4e4e7",
    "input": "#e4e4e7",
    "ring": "#7856ff"
  },
  "radius": 0.5
}
"@
    Set-Content -Path $themeJsonPath -Value $themeJsonContent
    Write-Host "Theme file created successfully" -ForegroundColor Green
}

# Run database migration fixes if needed
$fixScriptPath = Join-Path -Path $PWD -ChildPath "server\run-fix-schema.js"
if (Test-Path $fixScriptPath) {
    Write-Host "Running database schema fixes..." -ForegroundColor Yellow
    Set-Location -Path "$PWD\server"
    node run-fix-schema.js
    Set-Location -Path $PWD
    Write-Host "Database schema fixes completed" -ForegroundColor Green
}

# Kill any processes that might be using port 5000 (server) or 3000 (client)
try {
    $serverProcess = Get-Process -Id (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue
    if ($serverProcess) {
        Write-Host "Stopping existing process on port 5000..." -ForegroundColor Yellow
        Stop-Process -Id $serverProcess.Id -Force
    }
} catch {
    # No process on port 5000, which is fine
}

try {
    $clientProcess = Get-Process -Id (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue
    if ($clientProcess) {
        Write-Host "Stopping existing process on port 3000..." -ForegroundColor Yellow
        Stop-Process -Id $clientProcess.Id -Force
    }
} catch {
    # No process on port 3000, which is fine
}

# Add a 1-second delay to ensure ports are fully released
Start-Sleep -Seconds 1

# Start the server in a new PowerShell window
Write-Host "Starting server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD; npm run dev"

# Start the client in a new PowerShell window
Write-Host "Starting client..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD\client; npm run dev"

Write-Host "Application started successfully!" -ForegroundColor Green
Write-Host "Server is running at: http://localhost:5000" -ForegroundColor Green
Write-Host "Client is running at: http://localhost:3000" -ForegroundColor Green
Write-Host "Press Ctrl+C to close this window (server and client will continue running)" -ForegroundColor Yellow 