#!/usr/bin/env python3
"""
MCP Servers Startup Script for AgentHive Demo.

This script starts all the mock MCP servers for enterprise integrations.
"""

import asyncio
import logging
import subprocess
import sys
import time
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MCP servers configuration
MCP_SERVERS = [
    {
        "name": "Active Directory",
        "file": "active_directory_server.py",
        "port": 3001
    },
    {
        "name": "JIRA ITSM", 
        "file": "jira_itsm_server.py",
        "port": 3002
    },
    {
        "name": "Concur Expense",
        "file": "concur_expense_server.py", 
        "port": 3011
    }
]

def start_mcp_servers():
    """Start all MCP servers as background processes."""
    processes = []
    mcp_dir = Path(__file__).parent
    
    logger.info("Starting AgentHive MCP Servers...")
    
    for server in MCP_SERVERS:
        try:
            server_file = mcp_dir / server["file"]
            if not server_file.exists():
                logger.error(f"Server file not found: {server_file}")
                continue
            
            logger.info(f"Starting {server['name']} on port {server['port']}")
            
            # Start server process
            process = subprocess.Popen(
                [sys.executable, str(server_file)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=str(mcp_dir)
            )
            
            processes.append({
                "name": server["name"],
                "process": process,
                "port": server["port"]
            })
            
            # Give server a moment to start
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"Failed to start {server['name']}: {e}")
    
    if not processes:
        logger.error("No MCP servers were started successfully")
        return []
    
    logger.info(f"Started {len(processes)} MCP servers")
    
    # Print status
    print("\n" + "="*60)
    print("AgentHive MCP Servers Status")
    print("="*60)
    for proc in processes:
        status = "Running" if proc["process"].poll() is None else "Failed"
        print(f"{proc['name']:<20} Port {proc['port']:<6} Status: {status}")
    
    print("\nMCP servers are ready for AgentHive integration!")
    print("Press Ctrl+C to stop all servers")
    print("="*60)
    
    return processes

def stop_servers(processes):
    """Stop all MCP server processes."""
    logger.info("Stopping MCP servers...")
    
    for proc in processes:
        try:
            if proc["process"].poll() is None:
                proc["process"].terminate()
                proc["process"].wait(timeout=5)
                logger.info(f"Stopped {proc['name']}")
        except subprocess.TimeoutExpired:
            proc["process"].kill()
            logger.warning(f"Force killed {proc['name']}")
        except Exception as e:
            logger.error(f"Error stopping {proc['name']}: {e}")

def main():
    """Main function to manage MCP servers."""
    processes = []
    
    try:
        # Start all servers
        processes = start_mcp_servers()
        
        if not processes:
            sys.exit(1)
        
        # Keep running until interrupted
        while True:
            time.sleep(1)
            
            # Check if any process died
            for proc in processes:
                if proc["process"].poll() is not None:
                    logger.error(f"{proc['name']} has stopped unexpectedly")
                    
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
    finally:
        stop_servers(processes)
        logger.info("All MCP servers stopped")

if __name__ == "__main__":
    main()
