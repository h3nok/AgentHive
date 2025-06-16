#!/bin/bash

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed. Please install it first."
    echo "Visit https://ollama.ai/download for installation instructions."
    exit 1
fi

# Pull the required model
echo "Pulling the required model..."
ollama pull mistral

# Start the Ollama server in the background
echo "Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for the server to start
sleep 5

# Run the test script
echo "Running tests..."
python tests/test_ollama.py

# Cleanup
echo "Stopping Ollama server..."
kill $OLLAMA_PID

echo "Done!" 