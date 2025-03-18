#!/bin/bash

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Display network information
echo "============================================"
echo "🌐 Starting QuizKnight for network access"
echo "============================================"
echo "📡 Server will be available at: http://$HOST:$PORT"
echo "🖥️ Access from other devices using this address"
echo "============================================"

# Run the application
npm run dev 