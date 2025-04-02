# PowerShell script to start both client and server
# This is a workaround for the '&&' operator not working in PowerShell

Write-Host "Starting Quiz Knight Challenge Application..." -ForegroundColor Green

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