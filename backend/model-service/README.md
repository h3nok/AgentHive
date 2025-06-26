# AgentHive Model Service

A microservice for handling LLM model interactions with a provider-agnostic interface. This service is part of the AgentHive platform.

## Features

- 🚀 **Multi-provider Support**: Seamlessly switch between different LLM providers (Ollama, OpenAI, etc.)
- ⚡ **Streaming API**: Real-time token streaming for responsive user experiences
- 🔒 **Authentication**: Secure API endpoints with JWT authentication
- 📊 **Monitoring**: Built-in logging and metrics
- 🐳 **Docker Support**: Easy deployment with Docker and Docker Compose

## Prerequisites

- Docker and Docker Compose
- Python 3.10+
- Ollama (for local model serving)

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository and navigate to the model service directory:
   ```bash
   cd backend/model-service
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Start the services:
   ```bash
   docker-compose up -d
   ```

4. The service will be available at `http://localhost:8001`

### Running Locally

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Start the service:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Documentation

Once the service is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Host to bind the server to |
| `PORT` | `8000` | Port to run the server on |
| `RELOAD` | `True` | Enable auto-reload for development |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warning, error, critical) |
| `PROVIDER` | `ollama` | Default LLM provider |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Base URL for Ollama API |
| `DEFAULT_MODEL` | `llama3` | Default model to use |
| `DEFAULT_TEMPERATURE` | `0.7` | Default sampling temperature |
| `DEFAULT_MAX_TOKENS` | `1000` | Default maximum number of tokens to generate |

## Available Endpoints

### Generate Completion

```http
POST /api/v1/completions
```

**Request Body:**
```json
{
  "prompt": "Explain quantum computing in simple terms",
  "model": "llama3",
  "temperature": 0.7,
  "max_tokens": 100,
  "stream": false
}
```

### Stream Completion

```http
POST /api/v1/completions
```

**Request Body:**
```json
{
  "prompt": "Explain quantum computing in simple terms",
  "model": "llama3",
  "temperature": 0.7,
  "max_tokens": 100,
  "stream": true
}
```

### List Available Models

```http
GET /api/v1/models
```

## Adding a New LLM Provider

1. Create a new provider class in `app/providers/` that inherits from `BaseModelProvider`
2. Implement the required methods (`generate` and `generate_stream`)
3. Register the provider in `app/providers/__init__.py`

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black .
isort .
```

### Linting

```bash
flake8 .
mypy .
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
