# Ollama Integration Guide

This guide explains how to use the Ollama integration with AgentHive.

## Prerequisites

1. Install Ollama from [https://ollama.ai/download](https://ollama.ai/download)
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Tests

1. Start the Ollama server:
   ```bash
   ollama serve
   ```

2. Pull the required model:
   ```bash
   ollama pull mistral
   ```

3. Run the test script:
   ```bash
   python tests/test_ollama.py
   ```

Alternatively, you can use the provided script that handles all of the above:
```bash
./scripts/run_ollama.sh
```

## Configuration

The Ollama integration can be configured through environment variables or the `.env` file:

```env
LLM_PROVIDER=ollama
LLM_MODEL=mistral
LLM_API_BASE=http://localhost:11434
LLM_MAX_TOKENS=2000
LLM_TEMPERATURE=0.7
```

## Available Models

You can use any model available in Ollama. Some recommended models:

- `mistral`: Good balance of performance and resource usage
- `llama2`: Meta's Llama 2 model
- `codellama`: Specialized for code generation
- `neural-chat`: Optimized for chat applications

To use a different model:

1. Pull the model:
   ```bash
   ollama pull <model-name>
   ```

2. Update the configuration:
   ```env
   LLM_MODEL=<model-name>
   ```

## Troubleshooting

1. **Server Connection Issues**
   - Ensure Ollama server is running (`ollama serve`)
   - Check if the server is accessible at `http://localhost:11434`

2. **Model Not Found**
   - Verify the model is pulled (`ollama list`)
   - Pull the model if needed (`ollama pull <model-name>`)

3. **Performance Issues**
   - Try a smaller model
   - Adjust `LLM_MAX_TOKENS` to a lower value
   - Check system resources (CPU, RAM, GPU)

## Contributing

Feel free to contribute to the Ollama integration by:

1. Adding support for more Ollama features
2. Improving error handling
3. Adding more test cases
4. Optimizing performance

## License

This integration is part of AgentHive and follows the same license terms. 