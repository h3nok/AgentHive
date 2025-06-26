#!/bin/sh
set -e

# Initialize models
echo "Initializing models..."
python3 /app/scripts/init_models.py

# Start the FastAPI application
echo "Starting model service..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

# This line ensures the script exits with the same status as the uvicorn process
exit $?
