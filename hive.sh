#!/bin/bash

# Color codes for prettier output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running${NC}"
        exit 1
    fi
}

# Function to start the development environment
start_dev() {
    echo -e "${BLUE}Starting development environment...${NC}"
    
    # Ask if user wants to start Ollama
    read -p "Do you want to start Ollama service? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Starting with Ollama service...${NC}"
        docker compose up --build
    else
        echo -e "${YELLOW}Starting without Ollama service...${NC}"
        docker compose --profile ollama up --build
    fi
}

# Function to stop the development environment
stop_dev() {
    echo -e "${BLUE}Stopping development environment...${NC}"
    docker compose down
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}Showing logs...${NC}"
    docker compose logs -f
}

# Function to show status
show_status() {
    echo -e "${BLUE}Container status:${NC}"
    docker compose ps
}

# Main script
case "$1" in
    "start")
        check_docker
        start_dev
        ;;
    "stop")
        stop_dev
        ;;
    "restart")
        stop_dev
        start_dev
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status}"
        exit 1
        ;;
esac 