.PHONY: install test lint format type-check run-docker stop-docker clean help

# Variables
PYTHON = python3
PIP = pip3
DOCKER_COMPOSE = docker-compose
SERVICE_NAME = model-service

# Help message
help:
	@echo "Available commands:"
	@echo "  make install         Install dependencies"
	@echo "  make test            Run tests"
	@echo "  make lint            Run linters"
	@echo "  make format          Format code"
	@echo "  make type-check      Run type checking"
	@echo "  make run-docker      Start the service with Docker Compose"
	@echo "  make stop-docker     Stop the Docker containers"
	@echo "  make clean           Clean up temporary files"

# Install dependencies
install:
	$(PIP) install -r requirements.txt -r requirements-dev.txt

# Run tests
test:
	PYTHONPATH=. pytest -v --cov=app --cov-report=term-missing

# Run linters
lint:
	flake8 app tests
	mypy app

# Format code
format:
	black app tests
	isort app tests

# Run type checking
type-check:
	mypy app

# Start the service with Docker Compose
run-docker:
	$(DOCKER_COMPOSE) up -d --build
	@echo "\nModel service is running at http://localhost:8001"
	@echo "API documentation: http://localhost:8001/docs\n"

# Stop the Docker containers
stop-docker:
	$(DOCKER_COMPOSE) down

# Clean up temporary files
clean:
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type d -name ".pytest_cache" -exec rm -r {} +
	find . -type d -name ".mypy_cache" -exec rm -r {} +
	rm -rf .coverage htmlcov
