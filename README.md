# Intelligent Router

An LLM-powered intelligent router that can route requests to different agents based on the content and context of the request.

## Features

- FastAPI backend with async support
- PostgreSQL database with SQLAlchemy ORM
- Redis for caching and session management
- JWT authentication
- Alembic for database migrations
- Docker and Docker Compose for development
- Comprehensive test suite
- API documentation with Swagger UI

## Prerequisites

- Python 3.11+
- Docker and Docker Compose
- PostgreSQL 16+
- Redis 7+

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/intelligent-router.git
   cd intelligent-router
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r backend/requirements.txt
   ```

3. Start the development environment:
   ```bash
   docker-compose up -d
   ```

4. Run database migrations:
```bash
   cd backend
   alembic upgrade head
```

5. Start the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
.
├── backend/
│   ├── alembic/              # Database migrations
│   │   └── versions/        # Migration scripts
│   ├── app/
│   │   ├── api/             # API endpoints
│   │   ├── core/            # Core functionality
│   │   ├── db/              # Database models and session
│   │   ├── domain/          # Domain models and schemas
│   │   └── services/        # Business logic and services
│   ├── tests/               # Test suite
│   ├── Dockerfile           # Backend Dockerfile
│   └── requirements.txt     # Python dependencies
├── docker-compose.yml       # Docker Compose configuration
└── README.md               # Project documentation
```

## Testing

Run the test suite:
```bash
pytest
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Features

- FastAPI backend with async support
- PostgreSQL database with SQLAlchemy ORM
- Redis for caching and session management
- JWT authentication
- Alembic for database migrations
- Docker and Docker Compose for development
- Comprehensive test suite
- API documentation with Swagger UI

## Prerequisites

- Python 3.11+
- Docker and Docker Compose
- PostgreSQL 16+
- Redis 7+

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/intelligent-router.git
   cd intelligent-router
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r backend/requirements.txt
   ```

3. Start the development environment:
   ```bash
   docker-compose up -d
   ```

4. Run database migrations:
   ```bash
   cd backend
   alembic upgrade head
   ```

5. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

The API will be available at http://localhost:8000

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
.
├── backend/
│   ├── alembic/              # Database migrations
│   │   └── versions/        # Migration scripts
│   ├── app/
│   │   ├── api/             # API endpoints
│   │   ├── core/            # Core functionality
│   │   ├── db/              # Database models and session
│   │   ├── domain/          # Domain models and schemas
│   │   └── services/        # Business logic and services
│   ├── tests/               # Test suite
│   ├── Dockerfile           # Backend Dockerfile
│   └── requirements.txt     # Python dependencies
├── docker-compose.yml       # Docker Compose configuration
└── README.md               # Project documentation
```

## Testing

Run the test suite:
```bash
pytest
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
