# PowerShell script to start both client and server and fix common issues
# This is a workaround for the '&&' operator not working in PowerShell

Write-Host "Starting Quiz Knight Challenge Application..." -ForegroundColor Green

# This start script includes fixes for the following issues:
# 1. Fixed quiz submission - the apiRequest function was being called incorrectly
# 2. Fixed tab switching detection - properly tracking and reporting tab switches
# 3. Added database schema fixes for achievements table
# 4. Automatic creation of the theme.json file required by the client

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

# Check for and run database migrations to fix schema issues
$fixScriptPath = Join-Path -Path $PWD -ChildPath "server\run-fix-schema.js"
if (Test-Path $fixScriptPath) {
    try {
        Write-Host "Running database schema fixes..." -ForegroundColor Yellow
        
        # Change to server directory
        Push-Location -Path "$PWD\server"
        
        # Run the fix script using node
        & node run-fix-schema.js
        
        # Check exit code
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database schema fixes completed successfully" -ForegroundColor Green
        } else {
            Write-Host "Database schema fix encountered issues. Exit code: $LASTEXITCODE" -ForegroundColor Red
        }
        
        # Return to previous directory
        Pop-Location
    } catch {
        Write-Host "Error running database fixes: $_" -ForegroundColor Red
    }
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

# Add a 2-second delay to ensure ports are fully released
Write-Host "Waiting for ports to be released..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Start the server in a new PowerShell window
Write-Host "Starting server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

# Add a short delay to allow server to start before client
Start-Sleep -Seconds 3

# Start the client in a new PowerShell window
Write-Host "Starting client..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\client'; npm run dev"

Write-Host "Application started successfully!" -ForegroundColor Green
Write-Host "Server is running at: http://localhost:5000" -ForegroundColor Green
Write-Host "Client is running at: http://localhost:3000" -ForegroundColor Green
Write-Host "Press Ctrl+C to close this window (server and client will continue running)" -ForegroundColor Yellow 