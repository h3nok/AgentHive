# Enterprise API Testing Scripts

This directory contains scripts for testing the Enterprise API.

## test.sh

This is a shell script wrapper that makes it easy to run the API tests. It:

- Checks if the API server is running
- Automatically detects and activates the project's virtual environment
- Ensures the `requests` library is installed
- Runs the Python test script
- Handles exit codes properly

### Usage

From the project root directory:

```bash
# Make sure the script is executable
chmod +x scripts/test.sh

# Run the tests
./scripts/test.sh
```

## test_enterprise_agent_api.py

This script tests the Enterprise API endpoints by:
1. Creating a new session
2. Submitting a prompt
3. Checking session status
4. Getting and answering clarifying questions
5. Retrieving results

### Prerequisites

- The Enterprise API server must be running on http://localhost:8000
- Python 3.6 or higher
- The `requests` library is required

### Installation

If you're using the project's virtual environment, the `requests` library should already be installed. If not, you can install it with:

```bash
pip install requests
```

### Running directly

While it's recommended to use the `test.sh` wrapper, you can also run the Python script directly:

```bash
# Make sure the script is executable
chmod +x scripts/test_enterprise_agent_api.py

# Run the test script
./scripts/test_enterprise_agent_api.py
```

Or directly with Python:

```bash
python scripts/test_enterprise_agent_api.py
```

### Output

The script will output detailed information about each step of the API interaction process, including:
- Responses from each endpoint
- Success/failure status of each step
- JSON data returned by the API

If all tests pass successfully, you'll see a final summary with the session ID that was created. You can use this session ID for further manual testing or inspection.

### Troubleshooting

If the script fails, it will provide an error message indicating which step failed and why. Common issues:

1. **Server not running**: Ensure the Enterprise API server is running on http://localhost:8000
2. **Connection errors**: Check network connectivity
3. **API changes**: If the API endpoints or data formats have changed, the script may need to be updated 