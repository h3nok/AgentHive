#!/usr/bin/env python3
import json
import sys
import os

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Now we can import from app
from app.main import app

def check_openapi():
    """
    Checks the OpenAPI schema for registered routes and dumps it to a file
    """
    try:
        # Get the OpenAPI schema
        schema = app.openapi()
        
        # Print registered paths
        print("Registered API paths:")
        for path in schema["paths"].keys():
            print(f"  {path}")
            
            # Print methods for this path
            methods = schema["paths"][path].keys()
            print(f"    Methods: {', '.join(methods)}")
            
            # Check for the query endpoint specifically
            if path == "/agent/query":
                print("\nDetails for /agent/query:")
                
                post_info = schema["paths"][path].get("post", {})
                print(f"  Summary: {post_info.get('summary', 'N/A')}")
                print(f"  Description: {post_info.get('description', 'N/A')}")
                
                # Check request body
                if "requestBody" in post_info:
                    print("  Request Body Schema Found: Yes")
                else:
                    print("  Request Body Schema Found: No")
                    
                # Check response
                if "responses" in post_info:
                    print("  Response Schema Found: Yes")
                else:
                    print("  Response Schema Found: No")
                    
        # Dump the schema to a file for inspection
        with open("openapi_schema.json", "w") as f:
            json.dump(schema, f, indent=2)
            print("\nFull OpenAPI schema dumped to openapi_schema.json")
            
    except Exception as e:
        print(f"Error checking OpenAPI schema: {e}")
        
if __name__ == "__main__":
    check_openapi() 