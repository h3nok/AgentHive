#!/usr/bin/env python3
"""
Simple HR Agent Import Test
"""

import sys
from pathlib import Path

print("=== HR Agent Import Test ===")

# Add the backend app to Python path for imports
app_path = str(Path(__file__).parent / "app")
sys.path.insert(0, app_path)
print(f"Added to Python path: {app_path}")

print("Testing imports...")

try:
    print("1. Importing settings...")
    from app.core.settings import settings
    print("   ✅ Settings imported")
    
    print("2. Importing agent factory...")
    from app.domain.agent_factory import AgentRegistry
    print("   ✅ AgentRegistry imported")
    
    print("3. Importing schemas...")
    from app.domain.schemas import AgentType, RequestContext, PromptIn
    print("   ✅ Schemas imported")
    
    print("4. Testing PromptIn creation...")
    prompt_in = PromptIn(prompt="test")
    print("   ✅ PromptIn created")
    
    print("5. Testing RequestContext creation...")
    context = RequestContext(
        prompt=prompt_in,
        user_id="test-user",
        metadata={}
    )
    print("   ✅ RequestContext created")
    
    print("6. Checking HR plugin directory...")
    hr_plugin_path = Path(__file__).parent / "app" / "plugins" / "hr_agent"
    print(f"   Plugin path: {hr_plugin_path}")
    print(f"   Exists: {hr_plugin_path.exists()}")
    
    if hr_plugin_path.exists():
        manifest_path = hr_plugin_path / "manifest.json"
        agent_path = hr_plugin_path / "agent.py"
        print(f"   Manifest exists: {manifest_path.exists()}")
        print(f"   Agent file exists: {agent_path.exists()}")
    
    print("\n✅ All imports and basic tests passed!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
