#!/usr/bin/env python3
import os
import sys
import subprocess
import time
import signal
import psutil

def is_port_in_use(port):
    """Check if a port is in use."""
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            for conn in psutil.Process(proc.info['pid']).connections(kind='inet'):
                if conn.laddr.port == port:
                    return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return False

def kill_process_on_port(port):
    """Kill any process using the specified port."""
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            for conn in psutil.Process(proc.info['pid']).connections(kind='inet'):
                if conn.laddr.port == port:
                    print(f"Killing process {proc.info['pid']} using port {port}")
                    os.kill(proc.info['pid'], signal.SIGTERM)
                    time.sleep(1)  # Give it time to terminate
                    if psutil.pid_exists(proc.info['pid']):
                        os.kill(proc.info['pid'], signal.SIGKILL)
                    return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return False

def start_server(host="0.0.0.0", port=8000, reload=True):
    """Start the FastAPI server."""
    # Check if the port is already in use
    if is_port_in_use(port):
        response = input(f"Port {port} is already in use. Kill the process? (y/n): ")
        if response.lower() == 'y':
            kill_process_on_port(port)
        else:
            print("Exiting...")
            sys.exit(1)
    
    # Build the command
    cmd = [
        "python", "-m", "uvicorn", "app.main:app",
        "--host", host,
        "--port", str(port),
        "--root-path", "/enterprise-api"  # Updated to reflect Enterprise branding
    ]
    if reload:
        cmd.append("--reload")
    
    # Start the server
    print(f"Starting server on http://{host}:{port}")
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\nServer stopped by user")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Start the FastAPI server")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--no-reload", action="store_true", help="Disable auto-reload")
    
    args = parser.parse_args()
    
    start_server(host=args.host, port=args.port, reload=not args.no_reload) 