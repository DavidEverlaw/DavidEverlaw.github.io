#!/bin/bash

echo "Starting Coin Flip Idle server..."
echo "Server will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first, then Python 2, then Node.js
if command -v python3 &> /dev/null; then
    echo "Using Python 3..."
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Using Python..."
    python -m http.server 8000
elif command -v node &> /dev/null; then
    echo "Using Node.js..."
    npx http-server -p 8000
else
    echo "Error: No suitable server found. Please install Python or Node.js."
    exit 1
fi 