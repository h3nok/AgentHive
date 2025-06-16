#!/bin/bash

# Save the original directory
ORIGINAL_DIR=$(pwd)

# Color codes for prettier output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for Python, MongoDB, Redis, and Ollama
echo -e "${BLUE}Checking requirements...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is required but not installed${NC}"
    exit 1
fi

# Check for Ollama
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}Warning: Ollama not found. You may need to install it for local LLM support.${NC}"
    echo -e "${YELLOW}  - Install from: https://ollama.ai/${NC}"
    echo -e "${YELLOW}  - Or use Azure OpenAI by setting LLM_PROVIDER=azure in .env${NC}"
else
    echo -e "${GREEN}Ollama found in PATH${NC}"
    
    # Check if Ollama is running
    if ! curl -s http://localhost:11434/api/version &> /dev/null; then
        echo -e "${YELLOW}Ollama is installed but not running. You may need to start it.${NC}"
        echo -e "${YELLOW}  - Start with: ollama serve${NC}"
    else
        echo -e "${GREEN}Ollama service is running${NC}"
    fi
fi

# Check for MongoDB
if ! command -v mongod &> /dev/null; then
    echo -e "${YELLOW}Warning: MongoDB not found in PATH. Checking common install locations...${NC}"
    
    # Check common MongoDB install locations
    if [ -f "/usr/local/bin/mongod" ]; then
        echo -e "${GREEN}MongoDB found at /usr/local/bin/mongod${NC}"
        MONGOD_PATH="/usr/local/bin/mongod"
    elif [ -f "/opt/homebrew/bin/mongod" ]; then
        echo -e "${GREEN}MongoDB found at /opt/homebrew/bin/mongod${NC}"
        MONGOD_PATH="/opt/homebrew/bin/mongod"
    elif [ -f "C:/Program Files/MongoDB/Server/6.0/bin/mongod.exe" ]; then
        echo -e "${GREEN}MongoDB found at C:/Program Files/MongoDB/Server/6.0/bin/mongod.exe${NC}"
        MONGOD_PATH="C:/Program Files/MongoDB/Server/6.0/bin/mongod.exe"
    else
        echo -e "${RED}MongoDB not found. Please install MongoDB:${NC}"
        echo -e "${YELLOW}  - On MacOS: brew install mongodb-community${NC}"
        echo -e "${YELLOW}  - On Ubuntu: sudo apt install mongodb${NC}"
        echo -e "${YELLOW}  - On Windows: Download from https://www.mongodb.com/try/download/community${NC}"
        echo -e "${YELLOW}Alternatively, update MONGODB_URI in .env to use MongoDB Atlas${NC}"
        
        read -p "Continue without local MongoDB? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    MONGOD_PATH="mongod"
    echo -e "${GREEN}MongoDB found in PATH${NC}"
fi

# Check if MongoDB is running
if [ -n "$MONGOD_PATH" ]; then
    echo -e "${BLUE}Checking if MongoDB is running...${NC}"
    
    # Platform-specific MongoDB check
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # MacOS
        if ! pgrep -x "mongod" > /dev/null; then
            echo -e "${YELLOW}MongoDB is not running. Starting MongoDB...${NC}"
            brew services start mongodb-community > /dev/null 2>&1 || 
                (echo -e "${RED}Failed to start MongoDB. Try: brew services start mongodb-community${NC}" && 
                 read -p "Continue without MongoDB? (y/n) " -n 1 -r && 
                 echo && 
                 [[ $REPLY =~ ^[Yy]$ ]] || exit 1)
        else
            echo -e "${GREEN}MongoDB is running${NC}"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if ! systemctl is-active --quiet mongodb; then
            echo -e "${YELLOW}MongoDB is not running. Starting MongoDB...${NC}"
            sudo systemctl start mongodb > /dev/null 2>&1 || 
                (echo -e "${RED}Failed to start MongoDB. Try: sudo systemctl start mongodb${NC}" && 
                 read -p "Continue without MongoDB? (y/n) " -n 1 -r && 
                 echo && 
                 [[ $REPLY =~ ^[Yy]$ ]] || exit 1)
        else
            echo -e "${GREEN}MongoDB is running${NC}"
        fi
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        echo -e "${YELLOW}Unable to automatically check MongoDB service on Windows.${NC}"
        echo -e "${YELLOW}Please ensure MongoDB service is running.${NC}"
        read -p "Is MongoDB running? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Please start MongoDB service before continuing.${NC}"
            exit 1
        fi
    fi
fi

# Check for Redis
echo -e "${BLUE}Checking for Redis...${NC}"
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}Warning: Redis CLI not found in PATH. Checking common install locations...${NC}"
    
    # Check common Redis install locations
    if [ -f "/usr/local/bin/redis-cli" ]; then
        echo -e "${GREEN}Redis found at /usr/local/bin/redis-cli${NC}"
        REDIS_CLI_PATH="/usr/local/bin/redis-cli"
    elif [ -f "/opt/homebrew/bin/redis-cli" ]; then
        echo -e "${GREEN}Redis found at /opt/homebrew/bin/redis-cli${NC}"
        REDIS_CLI_PATH="/opt/homebrew/bin/redis-cli"
    else
        echo -e "${RED}Redis not found. Please install Redis:${NC}"
        echo -e "${YELLOW}  - On MacOS: brew install redis${NC}"
        echo -e "${YELLOW}  - On Ubuntu: sudo apt install redis-server${NC}"
        echo -e "${YELLOW}  - On Windows: Download from https://github.com/microsoftarchive/redis/releases${NC}"
        
        read -p "Continue without Redis? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    REDIS_CLI_PATH="redis-cli"
    echo -e "${GREEN}Redis CLI found in PATH${NC}"
fi

# Check if Redis is running
if [ -n "$REDIS_CLI_PATH" ]; then
    echo -e "${BLUE}Checking if Redis is running...${NC}"
    
    if ! $REDIS_CLI_PATH ping 2>/dev/null | grep -q "PONG"; then
        echo -e "${YELLOW}Redis is not running. Starting Redis...${NC}"
        
        # Platform-specific Redis start
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # MacOS
            brew services start redis > /dev/null 2>&1 || 
                (echo -e "${RED}Failed to start Redis. Try: brew services start redis${NC}" && 
                 read -p "Continue without Redis? (y/n) " -n 1 -r && 
                 echo && 
                 [[ $REPLY =~ ^[Yy]$ ]] || exit 1)
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            sudo systemctl start redis > /dev/null 2>&1 || 
                (echo -e "${RED}Failed to start Redis. Try: sudo systemctl start redis${NC}" && 
                 read -p "Continue without Redis? (y/n) " -n 1 -r && 
                 echo && 
                 [[ $REPLY =~ ^[Yy]$ ]] || exit 1)
        elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
            # Windows
            echo -e "${YELLOW}Unable to automatically start Redis service on Windows.${NC}"
            echo -e "${YELLOW}Please ensure Redis service is running.${NC}"
            read -p "Is Redis running? (y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}Please start Redis service before continuing.${NC}"
                exit 1
            fi
        fi
        
        # Check again if Redis is running after start attempt
        if $REDIS_CLI_PATH ping 2>/dev/null | grep -q "PONG"; then
            echo -e "${GREEN}Redis is now running${NC}"
        else
            echo -e "${YELLOW}Redis might not be running. Continuing anyway...${NC}"
        fi
    else
        echo -e "${GREEN}Redis is running${NC}"
    fi
fi

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating from template...${NC}"
    # Create basic .env file
    cat > .env << EOF
# Application Settings
APP_NAME=AgentHive
DEBUG=True
SECRET_KEY=your-secret-key-here
LOG_LEVEL=INFO

# Database Backend (mongodb or redis)
DATABASE_BACKEND=mongodb

# LLM Provider Configuration
LLM_PROVIDER=ollama  # Options: azure, ollama

# Azure OpenAI Settings
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_API_VERSION=2023-05-15
AZURE_OPENAI_DEPLOYMENT=
AZURE_OPENAI_MODEL=gpt-4

# Ollama Settings
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Snowflake Configuration
SNOWFLAKE_USER=
SNOWFLAKE_PASSWORD=
SNOWFLAKE_ACCOUNT=
SNOWFLAKE_WAREHOUSE=
SNOWFLAKE_DATABASE=
SNOWFLAKE_SCHEMA=

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=lease_agent
MONGODB_SESSION_TTL_HOURS=24

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
REDIS_URL=
EOF
    echo -e "${YELLOW}Created .env file with default values. Please edit with your configuration.${NC}"
fi

# Ensure MongoDB URI is in .env
if ! grep -q "MONGODB_URI" .env; then
    echo -e "${YELLOW}Adding MongoDB configuration to .env file...${NC}"
    echo "" >> .env
    echo "# MongoDB Configuration" >> .env
    echo "MONGODB_URI=mongodb://localhost:27017" >> .env
    echo "MONGODB_DB_NAME=lease_agent" >> .env
    echo "MONGODB_SESSION_TTL_HOURS=24" >> .env
fi

# Ensure LLM configuration is in .env
if ! grep -q "LLM_PROVIDER" .env; then
    echo -e "${YELLOW}Adding LLM configuration to .env file...${NC}"
    echo "" >> .env
    echo "# LLM Provider Configuration" >> .env
    echo "LLM_PROVIDER=ollama  # Options: azure, ollama" >> .env
    echo "OLLAMA_BASE_URL=http://localhost:11434" >> .env
    echo "OLLAMA_MODEL=llama3" >> .env
fi

# Ensure DATABASE_BACKEND is in .env
if ! grep -q "DATABASE_BACKEND" .env; then
    echo -e "${YELLOW}Adding DATABASE_BACKEND configuration to .env file...${NC}"
    echo "" >> .env
    echo "# Database Backend Configuration" >> .env
    echo "DATABASE_BACKEND=mongodb  # Options: mongodb, redis" >> .env
fi

# Ensure Redis configuration is in .env
if ! grep -q "REDIS_HOST" .env; then
    echo -e "${YELLOW}Adding Redis configuration to .env file...${NC}"
    echo "" >> .env
    echo "# Redis Configuration" >> .env
    echo "REDIS_HOST=localhost" >> .env
    echo "REDIS_PORT=6379" >> .env
    echo "REDIS_DB=0" >> .env
    echo "REDIS_PASSWORD=" >> .env
    echo "REDIS_URL=" >> .env
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${BLUE}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate

# Install dependencies
echo -e "${BLUE}Installing Python dependencies...${NC}"

# Check if uv is installed
if command -v uv &> /dev/null; then
    echo -e "${GREEN}Using uv for faster package installation${NC}"
    uv pip install --upgrade -r requirements.txt
else
    echo -e "${YELLOW}uv not found, using standard pip${NC}"
    pip install --upgrade pip
    pip install --upgrade -r requirements.txt
fi

# Make sure critical packages are installed regardless of requirements.txt
echo -e "${BLUE}Ensuring critical packages are installed...${NC}"
pip install uvicorn fastapi python-dotenv httpx

# Check if argument is provided
if [ "$1" == "mock-data" ]; then
    # Run script to setup mock data
    echo -e "${BLUE}Setting up mock data in Snowflake...${NC}"
    python scripts/setup_mock_data.py
elif [ "$1" == "docker" ]; then
    # Run backend services with Docker Compose (frontend runs separately)
    echo -e "${BLUE}Starting backend services with Docker Compose...${NC}"
    echo -e "${YELLOW}Note: Frontend runs separately. Use './run-frontend.sh' to start the frontend.${NC}"
    docker-compose up
elif [ "$1" == "debug" ]; then
    # Run debug integration tests
    echo -e "${BLUE}Running WebSocket debug integration tests...${NC}"
    python test_websocket_integration.py
elif [ "$1" == "debug-simple" ]; then
    # Run simple debug test
    echo -e "${BLUE}Running simple debug test...${NC}"
    python simple_debug_test.py
elif [ "$1" == "mongodb-check" ]; then
    # Just check MongoDB connection
    echo -e "${BLUE}Checking MongoDB connection...${NC}"
    python -c "
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv
import os

async def check_mongo():
    load_dotenv()
    uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    db_name = os.getenv('MONGODB_DB_NAME', 'lease_agent')
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print(f'\033[0;32mSuccessfully connected to MongoDB: {uri}\033[0m')
        print(f'\033[0;34mDatabase: {db_name}\033[0m')
        client.close()
        return True
    except Exception as e:
        print(f'\033[0;31mFailed to connect to MongoDB: {str(e)}\033[0m')
        return False

asyncio.run(check_mongo())
"
elif [ "$1" == "ollama-check" ]; then
    # Check Ollama connection
    echo -e "${BLUE}Checking Ollama connection...${NC}"
    python -c "
import asyncio
import httpx
from dotenv import load_dotenv
import os

async def check_ollama():
    load_dotenv()
    base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
    model = os.getenv('OLLAMA_MODEL', 'llama3')
    try:
        async with httpx.AsyncClient(base_url=base_url, timeout=10.0) as client:
            response = await client.get('/api/version')
            if response.status_code == 200:
                version = response.json().get('version', 'unknown')
                print(f'\033[0;32mOllama server running! Version: {version}\033[0m')
                
                # Check if the model is pulled
                models_resp = await client.get('/api/tags')
                if models_resp.status_code == 200:
                    models = [m.get('name') for m in models_resp.json().get('models', [])]
                    if model in models:
                        print(f'\033[0;32mModel {model} is available\033[0m')
                    else:
                        available = ', '.join(models) if models else 'none'
                        print(f'\033[0;33mModel {model} not found. Available models: {available}\033[0m')
                        print(f'\033[0;33mYou can pull it with: ollama pull {model}\033[0m')
                return True
    except Exception as e:
        print(f'\033[0;31mFailed to connect to Ollama: {str(e)}\033[0m')
        print(f'\033[0;33mMake sure Ollama is running with: ollama serve\033[0m')
        return False

asyncio.run(check_ollama())
"
else
    # Kill any existing process running on port 8000
    echo -e "${BLUE}Checking for existing processes on port 8000...${NC}"
    
    # Platform-specific process killing
    if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # macOS or Linux
        EXISTING_PID=$(lsof -ti:8000)
        if [ -n "$EXISTING_PID" ]; then
            echo -e "${YELLOW}Found process running on port 8000 (PID: $EXISTING_PID). Killing it...${NC}"
            kill -9 $EXISTING_PID
            sleep 1
        else
            echo -e "${GREEN}No existing process found on port 8000${NC}"
        fi
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        netstat -ano | findstr :8000 > temp.txt
        if [ -s temp.txt ]; then
            PID=$(awk '{print $5}' temp.txt | head -1)
            echo -e "${YELLOW}Found process running on port 8000 (PID: $PID). Killing it...${NC}"
            taskkill //F //PID $PID 2>/dev/null
            sleep 1
        else
            echo -e "${GREEN}No existing process found on port 8000${NC}"
        fi
        rm -f temp.txt
    fi
    
    # Change to backend directory
    # Load environment variables from root .env so they persist after changing directories
if [ -f "$ORIGINAL_DIR/.env" ]; then
    echo -e "${BLUE}Loading environment variables from $ORIGINAL_DIR/.env ...${NC}"
    set -a
    # shellcheck disable=SC1090
    source "$ORIGINAL_DIR/.env"
    set +a
fi

echo -e "${BLUE}Changing to backend directory...${NC}"
    cd backend
    
    # Run backend serve from the correct directory
    echo -e "${GREEN}Starting AgentHive API server from backend directory...${NC}"
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
    
    # This line will not be reached while the server is running, but will show if startup fails
    echo -e "${BLUE}API documentation available at:${NC}"
    echo -e "${GREEN}  - ReDoc UI: http://localhost:8001/redoc${NC}"
    echo -e "${GREEN}  - Debug Endpoints: http://localhost:8001/api/debug/health${NC}"
    echo -e "${GREEN}  - WebSocket Debug: ws://localhost:8001/api/debug/router_trace${NC}"
fi

# Deactivate virtual environment and return to original directory on exit
trap "deactivate 2>/dev/null; cd '$ORIGINAL_DIR'" EXIT 