"""
Swarm Dashboard API endpoints for real-time agent monitoring and management.
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any, Optional
import asyncio
import json
from datetime import datetime, timedelta
import random

from app.domain.agent_factory import agent_registry
from app.domain.schemas import AgentType
from app.core.observability import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/swarm", tags=["swarm"])

# In-memory store for demo purposes (use Redis/DB in production)
agent_status_store: Dict[str, Dict[str, Any]] = {}
active_connections: List[WebSocket] = []

# Mock agent statuses for demonstration
AGENT_STATUSES = ["idle", "busy", "collaborating", "thinking", "offline"]

class SwarmWebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        if self.active_connections:
            disconnected = []
            for connection in self.active_connections:
                try:
                    await connection.send_text(json.dumps(data))
                except Exception as e:
                    logger.warning(f"Failed to send message to WebSocket: {e}")
                    disconnected.append(connection)
            
            # Clean up disconnected connections
            for conn in disconnected:
                self.disconnect(conn)

manager = SwarmWebSocketManager()

def get_agent_avatar_url(agent_type: str) -> str:
    """Generate avatar URL based on agent type."""
    avatar_map = {
        "general": "/api/static/avatars/bee-general.png",
        "sales": "/api/static/avatars/bee-sales.png", 
        "support": "/api/static/avatars/bee-support.png",
        "hr": "/api/static/avatars/bee-hr.png",
        "marketing": "/api/static/avatars/bee-marketing.png",
        "analytics": "/api/static/avatars/bee-analytics.png",
        "custom": "/api/static/avatars/bee-custom.png"
    }
    return avatar_map.get(agent_type.lower(), "/api/static/avatars/bee-default.png")

def simulate_agent_activity():
    """Simulate real-time agent activity for demo purposes."""
    registrations = agent_registry.list_agents()
    
    for reg in registrations:
        agent_id = reg.agent_id
        
        if agent_id not in agent_status_store:
            # Initialize agent status
            agent_status_store[agent_id] = {
                "id": agent_id,
                "name": reg.manifest.name,
                "type": reg.agent_type.value,
                "status": random.choice(AGENT_STATUSES),
                "avatarUrl": get_agent_avatar_url(reg.agent_type.value),
                "currentTask": None,
                "lastActivity": datetime.utcnow().isoformat(),
                "totalTasks": random.randint(0, 50),
                "successRate": round(random.uniform(0.8, 1.0), 2),
                "responseTime": round(random.uniform(100, 2000), 0),
                "collaborationCount": random.randint(0, 10)
            }
        else:
            # Randomly update agent status
            if random.random() < 0.3:  # 30% chance to change status
                old_status = agent_status_store[agent_id]["status"]
                new_status = random.choice(AGENT_STATUSES)
                agent_status_store[agent_id]["status"] = new_status
                agent_status_store[agent_id]["lastActivity"] = datetime.utcnow().isoformat()
                
                if new_status == "busy":
                    agent_status_store[agent_id]["currentTask"] = f"Processing user query #{random.randint(1000, 9999)}"
                elif new_status == "collaborating":
                    agent_status_store[agent_id]["currentTask"] = f"Collaborating with {random.choice(['Sales', 'Support', 'HR'])} agent"
                elif new_status == "thinking":
                    agent_status_store[agent_id]["currentTask"] = "Analyzing complex request"
                else:
                    agent_status_store[agent_id]["currentTask"] = None

@router.get("/agents")
async def list_swarm_agents():
    """Get all agents with their current status."""
    simulate_agent_activity()
    return {"agents": list(agent_status_store.values())}

@router.get("/agents/{agent_id}")
async def get_agent_details(agent_id: str):
    """Get detailed information about a specific agent."""
    if agent_id not in agent_status_store:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = agent_status_store[agent_id].copy()
    
    # Add detailed logs/history (mock data)
    agent["recentLogs"] = [
        {
            "timestamp": (datetime.utcnow() - timedelta(minutes=random.randint(1, 60))).isoformat(),
            "level": random.choice(["info", "warning", "error"]),
            "message": f"Agent {random.choice(['started', 'completed', 'failed'])} task #{random.randint(1000, 9999)}"
        }
        for _ in range(5)
    ]
    
    agent["capabilities"] = [
        "Natural Language Processing",
        "Intent Recognition", 
        "Context Understanding",
        "Multi-turn Conversations"
    ]
    
    return agent

@router.post("/agents/{agent_id}/action")
async def perform_agent_action(agent_id: str, action: Dict[str, Any]):
    """Perform an action on a specific agent (pause, resume, reset, etc.)."""
    if agent_id not in agent_status_store:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    action_type = action.get("type")
    
    if action_type == "pause":
        agent_status_store[agent_id]["status"] = "offline"
        agent_status_store[agent_id]["currentTask"] = None
    elif action_type == "resume":
        agent_status_store[agent_id]["status"] = "idle"
    elif action_type == "reset":
        agent_status_store[agent_id]["totalTasks"] = 0
        agent_status_store[agent_id]["collaborationCount"] = 0
    
    agent_status_store[agent_id]["lastActivity"] = datetime.utcnow().isoformat()
    
    # Broadcast update to all connected WebSockets
    await manager.broadcast({
        "type": "agent_update",
        "agent": agent_status_store[agent_id]
    })
    
    return {"success": True, "agent": agent_status_store[agent_id]}

@router.get("/stats")
async def get_swarm_stats():
    """Get overall swarm statistics."""
    agents = list(agent_status_store.values())
    
    stats = {
        "totalAgents": len(agents),
        "activeAgents": len([a for a in agents if a["status"] not in ["offline"]]),
        "busyAgents": len([a for a in agents if a["status"] == "busy"]),
        "collaboratingAgents": len([a for a in agents if a["status"] == "collaborating"]),
        "totalTasks": sum(a.get("totalTasks", 0) for a in agents),
        "averageResponseTime": round(sum(a.get("responseTime", 0) for a in agents) / len(agents) if agents else 0, 0),
        "averageSuccessRate": round(sum(a.get("successRate", 0) for a in agents) / len(agents) if agents else 0, 2)
    }
    
    return stats

@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time swarm updates."""
    await manager.connect(websocket)
    try:
        # Send initial data
        await websocket.send_text(json.dumps({
            "type": "initial_data",
            "agents": list(agent_status_store.values())
        }))
        
        # Keep connection alive and send periodic updates
        while True:
            await asyncio.sleep(5)  # Update every 5 seconds
            simulate_agent_activity()
            
            await manager.broadcast({
                "type": "agents_update",
                "agents": list(agent_status_store.values())
            })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@router.post("/simulate")
async def simulate_swarm_activity():
    """Manually trigger swarm activity simulation."""
    simulate_agent_activity()
    
    # Broadcast update
    await manager.broadcast({
        "type": "simulation_update", 
        "agents": list(agent_status_store.values())
    })
    
    return {"success": True, "message": "Swarm activity simulated"}
