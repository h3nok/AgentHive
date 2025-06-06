import os
import requests
from connectors.base import BaseConnector

class UKGConnector(BaseConnector):
    def __init__(self, mcp_url=None, api_key=None, mock=False):
        self.mcp_url = mcp_url or os.getenv("MCP_URL", "https://mcp.example.com/api/ukg")
        self.api_key = api_key or os.getenv("MCP_API_KEY", "demo-key")
        self.mock = mock

    def call(self, action: str, params: dict) -> dict:
        if self.mock:
            return self._mock_call(action, params)
        payload = {"action": action, "params": params}
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        try:
            resp = requests.post(self.mcp_url, json=payload, headers=headers, timeout=10)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            print(f"[UKGConnector] MCP call failed: {e}")
            return {"error": str(e), "action": action, "params": params}

    def _mock_call(self, action, params):
        if action == "get_balance":
            return {"pto_balance": 5, "employee_id": params.get("employee_id", "E123")}
        elif action == "submit_time_off":
            return {
                "ukg_request_id": "REQ12345",
                "status": "submitted",
                "start": params.get("start"),
                "end": params.get("end"),
                "type": params.get("time_off_type", "Personal Day")
            }
        elif action == "clock_in":
            return {
                "clock_action": "in",
                "timestamp": params.get("timestamp"),
                "location": params.get("location", "HQ"),
                "status": "success"
            }
        elif action == "clock_out":
            return {
                "clock_action": "out",
                "timestamp": params.get("timestamp"),
                "location": params.get("location", "HQ"),
                "status": "success"
            }
        elif action == "get_manager":
            return {"manager_email": "manager@example.com", "manager_name": "Sarah Johnson"}
        else:
            return {"mock": True, "action": action, "params": params} 