# Load environment variables
$env:HOST = "192.168.56.1"
$env:PORT = "5000"

# Display network information
Write-Host "============================================"
Write-Host "Starting QuizKnight for network access"
Write-Host "============================================"
Write-Host "Server will be available at: http://localhost:$env:PORT and http://$env:HOST`:$env:PORT"
Write-Host "Access from other devices using the IP address"
Write-Host "============================================"

# Run the application
npm run dev 