#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env.production ]; then
    echo "Loading environment variables from .env.production"
    export $(grep -v '^#' .env.production | xargs)
else
    echo "Error: .env.production file not found. Please create it from .env.production.example"
    exit 1
fi

# Create necessary directories
mkdir -p ./monitoring

# Build and start services
echo "Starting deployment..."
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo "==============================================="
echo "AgentHive has been deployed successfully!"
echo ""
echo "Access the application at: http://localhost"
echo ""
echo "Monitoring:"
echo "- Grafana: http://localhost:3000"
echo "- Prometheus: http://localhost:9090"
echo ""
echo "To view logs, run: docker-compose -f docker-compose.prod.yml logs -f"
echo "==============================================="
