#!/usr/bin/env python3
import os
import sys
import asyncio

# Add project root to the Python path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(SCRIPT_DIR)
from app.db.snowflake import snowflake_client

async def main():
    """Run a health check against Snowflake and print the results."""
    result = await snowflake_client.health_check()
    print('Snowflake Health Check Result:')
    for key, value in result.items():
        print(f'{key}: {value}')

    # Print the role, database, and warehouse being used
    print('\nConnection Context:')
    print(f"Role: {os.getenv('SNOWFLAKE_ROLE')}")
    print(f"Database: {os.getenv('SNOWFLAKE_DATABASE')}")
    print(f"Warehouse: {os.getenv('SNOWFLAKE_WAREHOUSE')}")

    # Execute a sample query to test execution
    print('\nExecuting sample query...')
    sample_sql = 'SELECT CURRENT_TIMESTAMP() AS now'
    query_results = await snowflake_client.execute_query(sample_sql)
    print('Sample Query Results:')
    for row in query_results:
        print(row)

if __name__ == '__main__':
    # Ensure required environment variables are set
    if not os.getenv('SNOWFLAKE_ACCOUNT') or not os.getenv('SNOWFLAKE_USER'):
        print('Error: Please set SNOWFLAKE_ACCOUNT and SNOWFLAKE_USER environment variables.')
        sys.exit(1)
    if not (os.getenv('SNOWFLAKE_PASSWORD') or os.getenv('SNOWFLAKE_PRIVATE_KEY_PATH')):
        print('Error: Please set SNOWFLAKE_PASSWORD or SNOWFLAKE_PRIVATE_KEY_PATH environment variable.')
        sys.exit(1)
    asyncio.run(main()) 