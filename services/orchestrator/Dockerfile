FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY services/orchestrator /app
COPY services/agents /app/agents
# Remove local stub now that official pydantic-ai package is installed
RUN if [ -f /app/pydantic_ai.py ]; then rm /app/pydantic_ai.py; fi
EXPOSE 5000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
