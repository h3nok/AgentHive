#!/usr/bin/env python
"""
Enhanced Test Script for Azure Redis Connection

This script performs comprehensive testing of the Redis connection with detailed diagnostics.
It tests both connection parameters and basic Redis operations, providing detailed logging.
"""
import asyncio
import json
import logging
import os
import socket
import sys
import time
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger("redis-test")

# Add the project root directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))


async def check_network_connectivity(host, port):
    """Check if we can reach the Redis host at the specified port"""
    try:
        logger.info(f"Testing network connectivity to {host}:{port}...")
        start_time = time.time()
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)  # 5 second timeout
        result = sock.connect_ex((host, port))
        duration = time.time() - start_time

        if result == 0:
            logger.info(
                f"✅ Successfully connected to {host}:{port} in {duration:.2f} seconds"
            )
            return True
        else:
            logger.error(
                f"❌ Failed to connect to {host}:{port} - Error code: {result}"
            )
            return False
    except Exception as e:
        logger.error(f"❌ Network connectivity test error: {e}")
        return False
    finally:
        sock.close()


async def test_redis_config():
    """Check Redis configuration in settings and environment"""
    # Import the config and settings
    try:
        from app.core.config import settings

        # Create a dictionary of all Redis-related settings for inspection
        redis_settings = {
            "DATABASE_BACKEND": settings.DATABASE_BACKEND,
            "REDIS_HOST": settings.REDIS_HOST,
            "REDIS_PORT": settings.REDIS_PORT,
            "REDIS_DB": settings.REDIS_DB,
            "REDIS_PASSWORD": "[MASKED]" if settings.REDIS_PASSWORD else "Not Set",
        }

        # Add optional settings if they exist
        if hasattr(settings, 'REDIS_URL'):
            redis_settings["REDIS_URL"] = settings.REDIS_URL
        if hasattr(settings, 'REDIS_URL'):
            redis_settings["REDIS_URL"] = settings.REDIS_URL

        # Check environment variables
        env_vars = {}
        for key in os.environ:
            if key.startswith("REDIS_"):
                value = "[MASKED]" if "PASSWORD" in key else os.environ[key]
                env_vars[key] = value

        # Log all Redis configuration
        logger.info("=== Redis Configuration ===")
        logger.info(
            f"Settings from config module: {json.dumps(redis_settings, indent=2)}"
        )
        logger.info(f"Environment variables: {json.dumps(env_vars, indent=2)}")

        # Return the most important values for connection
        redis_host = settings.REDIS_HOST
        redis_port = settings.REDIS_PORT
        redis_url = (
            os.environ.get('REDIS_URL')
            or getattr(settings, 'REDIS_URL', None)
            or getattr(settings, 'REDIS_URL', None)
        )
        redis_password = settings.REDIS_PASSWORD

        return redis_host, redis_port, redis_url, redis_password

    except Exception as e:
        logger.error(f"❌ Error accessing Redis configuration: {e}")
        logger.error(traceback.format_exc())
        return None, None, None, None


async def test_azure_redis_connection():
    """Test connection to Azure Redis with comprehensive diagnostics"""
    try:
        logger.info("============== REDIS CONNECTION TEST STARTING ==============")

        # Step 1: Check Redis Configuration
        logger.info("\n[Step 1] Checking Redis configuration...")
        redis_host, redis_port, redis_url, redis_password = await test_redis_config()

        # Step 2: Test Network Connectivity
        logger.info("\n[Step 2] Testing network connectivity...")

        # Test direct connection to Redis host
        if redis_host == 'azure' and redis_url:
            # For azure host setting, test connectivity to the actual Redis URL
            host_to_test = redis_url
            logger.info(f"Using Azure Redis URL for connectivity test: {host_to_test}")
        else:
            # Otherwise test the direct Redis host
            host_to_test = redis_host

        # Perform network connectivity test
        network_ok = await check_network_connectivity(host_to_test, redis_port)
        if not network_ok:
            logger.warning(
                "Network connectivity test failed - this may affect Redis connection"
            )

        # Import the RedisClient
        logger.info("\n[Step 3] Testing Redis client...")
        from app.db.redis import RedisClient

        # Create Redis client with the appropriate settings
        logger.info("Creating Redis client...")
        from app.core.config import settings

        # If using azure host, customize parameters using environment settings
        if settings.REDIS_HOST == 'azure':
            logger.info("Using Azure Redis settings from environment...")
            # Try to create a client with URL-based connection for Azure Redis
            try:
                # For Azure Redis, we shouldn't specify port separately as it's included in the URL
                logger.info(f"Creating Redis client for Azure with URL={redis_url}...")
                redis_client = RedisClient(
                    host='azure',  # Keep 'azure' to trigger the special case in the client
                    port=redis_port,
                    password=redis_password,
                )
            except Exception as e:
                logger.error(f"⚠️ Error creating Azure Redis client: {e}")
                logger.error(traceback.format_exc())
                return False
        else:
            # Use standard settings for local or other Redis servers
            redis_client = RedisClient(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD or None,
            )

        # Connect to Redis with detailed error handling
        logger.info("\n[Step 4] Attempting to connect to Redis...")
        try:
            start_time = time.time()
            connected = await redis_client.connect()
            connect_time = time.time() - start_time

            if connected:
                logger.info(
                    f"✅ Successfully connected to Redis in {connect_time:.2f} seconds!"
                )

                # Test Redis server info
                logger.info("\n[Step 5] Checking Redis server information...")
                if hasattr(redis_client.client, 'info'):
                    try:
                        server_info = await redis_client.client.info()
                        logger.info(
                            f"Redis Server Version: {server_info.get('redis_version', 'Unknown')}"
                        )
                        logger.info(
                            f"Redis Memory Used: {server_info.get('used_memory_human', 'Unknown')}"
                        )
                        logger.info(
                            f"Redis Clients Connected: {server_info.get('connected_clients', 'Unknown')}"
                        )
                        logger.info(
                            f"Redis DB Keys: {server_info.get(f'db{settings.REDIS_DB}', 'Unknown')}"
                        )
                    except Exception as e:
                        logger.error(f"⚠️ Error getting Redis server info: {e}")

                # Test basic operations with detailed reporting
                logger.info("\n[Step 6] Testing basic Redis operations...")

                # Set a test value
                test_key = f"azure_test_key_{int(time.time())}"
                test_value = f"test_value_from_script_{int(time.time())}"

                try:
                    # Try simple SET operation
                    logger.info(f"Setting test key: {test_key}")
                    await redis_client.set_with_expiry(
                        test_key, test_value, 60
                    )  # 60 second expiry
                    logger.info(
                        f"✅ Successfully set test key: {test_key} = {test_value}"
                    )

                    # Try GET operation
                    logger.info(f"Getting test key: {test_key}")
                    result = await redis_client.get_value(test_key)
                    logger.info(f"Retrieved value: {result}")

                    if result == test_value:
                        logger.info(
                            f"✅ Successfully read and verified value from Redis!"
                        )
                    else:
                        logger.error(
                            f"❌ Value mismatch! Expected '{test_value}', got '{result}'"
                        )

                    # Try hash operations
                    hash_key = f"hash:{test_key}"
                    hash_data = {
                        "field1": "value1",
                        "field2": "value2",
                        "timestamp": str(time.time()),
                    }

                    logger.info(f"Testing Redis hash operations with key: {hash_key}")
                    await redis_client.set_hash(hash_key, hash_data)
                    hash_result = await redis_client.get_hash(hash_key)

                    if hash_result and len(hash_result) == len(hash_data):
                        logger.info(
                            f"✅ Successfully wrote and read hash data: {hash_result}"
                        )
                    else:
                        logger.error(
                            f"❌ Hash operation failed. Expected: {hash_data}, Got: {hash_result}"
                        )

                    # Try set operations
                    set_key = f"set:{test_key}"
                    set_values = ["item1", "item2", "item3"]

                    logger.info(f"Testing Redis set operations with key: {set_key}")
                    await redis_client.add_to_set(set_key, *set_values)
                    set_result = await redis_client.get_set_members(set_key)

                    if set_result and all(item in set_result for item in set_values):
                        logger.info(
                            f"✅ Successfully wrote and read set data: {set_result}"
                        )
                    else:
                        logger.error(
                            f"❌ Set operation failed. Expected: {set_values}, Got: {set_result}"
                        )

                    # Clean up all test keys
                    logger.info("Cleaning up test keys...")
                    await redis_client.delete_key(test_key)
                    await redis_client.delete_key(hash_key)
                    await redis_client.delete_key(set_key)
                    logger.info(f"✅ Cleaned up all test keys")

                except Exception as e:
                    logger.error(f"❌ Error during Redis operations: {e}")
                    logger.error(traceback.format_exc())

                # Close connection
                await redis_client.close()
                logger.info("Redis connection closed.")

                logger.info(
                    "\n============== REDIS TEST COMPLETED SUCCESSFULLY ==============\n"
                )
                return True
            else:
                logger.error("❌ Failed to connect to Redis.")
                logger.info("\n============== REDIS TEST FAILED ==============\n")
                return False

        except Exception as conn_err:
            logger.error(f"❌ Exception during Redis connection: {conn_err}")
            logger.error(traceback.format_exc())
            logger.info("\n============== REDIS TEST FAILED ==============\n")
            return False

    except Exception as e:
        logger.error(f"❌ Error testing Redis connection: {e}")
        logger.error(traceback.format_exc())
        logger.info("\n============== REDIS TEST FAILED ==============\n")
        return False


if __name__ == "__main__":
    # Run the test
    logger.info("Starting Redis connection test...")
    asyncio.run(test_azure_redis_connection())
