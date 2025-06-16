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

# Function to start the backend services
start_backend() {
    echo -e "${BLUE}Starting backend services (Redis, MongoDB, Backend API)...${NC}"
    
    # Ask if user wants to start Ollama
    read -p "Do you want to start Ollama service? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Starting backend with Ollama service...${NC}"
        docker compose up --build -d
    else
        echo -e "${YELLOW}Starting backend without Ollama service...${NC}"
        docker compose --profile ollama up --build -d
    fi
    
    echo -e "${YELLOW}Note: Frontend runs separately. Use './hive.sh frontend' to start it.${NC}"
}

# Function to start the frontend
start_frontend() {
    echo -e "${BLUE}Starting frontend development server...${NC}"
    
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "${YELLOW}Installing frontend dependencies...${NC}"
        cd frontend && pnpm install && cd ..
    fi
    
    echo -e "${GREEN}Starting frontend on http://localhost:5173${NC}"
    cd frontend && pnpm run dev
}

# Function to start both backend and frontend
start_all() {
    echo -e "${BLUE}Starting full development environment...${NC}"
    
    # Start backend services
    start_backend
    
    echo -e "${YELLOW}Backend started. Starting frontend in a new terminal...${NC}"
    echo -e "${YELLOW}Run './hive.sh frontend' in another terminal to start the frontend.${NC}"
}

# Function to stop the development environment
stop_dev() {
    echo -e "${BLUE}Stopping backend services...${NC}"
    docker compose down
    echo -e "${YELLOW}Note: If frontend is running separately, stop it with Ctrl+C in its terminal.${NC}"
}

# Function to show logs
show_logs() {
    if [ "$2" = "frontend" ]; then
        echo -e "${BLUE}Frontend runs separately. Check the terminal where you ran './hive.sh frontend'${NC}"
        return
    fi
    echo -e "${BLUE}Showing backend logs...${NC}"
    docker compose logs -f
}

# Function to show status
show_status() {
    echo -e "${BLUE}Backend container status:${NC}"
    docker compose ps
    echo
    echo -e "${YELLOW}Frontend status: Check the terminal where you ran './hive.sh frontend'${NC}"
    echo -e "${YELLOW}Frontend should be available at: http://localhost:5173${NC}"
}

# Main script
case "$1" in
    "start")
        check_docker
        start_all
        ;;
    "backend")
        check_docker
        start_backend
        ;;
    "frontend")
        start_frontend
        ;;
    "stop")
        stop_dev
        ;;
    "restart")
        stop_dev
        sleep 2
        start_all
        ;;
    "logs")
        show_logs "$@"
        ;;
    "status")
        show_status
        ;;
    *)
        echo "Usage: $0 {start|backend|frontend|stop|restart|logs|status}"
        echo
        echo "Commands:"
        echo "  start     - Start backend services and show frontend instructions"
        echo "  backend   - Start only backend services (Redis, MongoDB, API)"
        echo "  frontend  - Start only frontend development server"
        echo "  stop      - Stop backend services"
        echo "  restart   - Restart backend services"
        echo "  logs      - Show backend logs"
        echo "  status    - Show backend container status"
        echo
        echo "Examples:"
        echo "  ./hive.sh backend    # Start backend services"
        echo "  ./hive.sh frontend   # Start frontend (run in separate terminal)"
        exit 1
        ;;
esac 