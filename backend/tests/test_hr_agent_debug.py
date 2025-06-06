#!/usr/bin/env python3
"""
HR Agent Integration Test - Debug Version
This script tests the complete HR agent functionality with detailed debugging.
"""

import asyncio
import sys
from pathlib import Path

print("🚀 Starting HR Agent Integration Test - Debug Version")
print("📍 Current working directory:", Path.cwd())

# Add the backend app to Python path for imports
app_path = str(Path(__file__).parent / "app")
sys.path.insert(0, app_path)
print("📦 Added to Python path:", app_path)

try:
    print("📥 Importing AgentRegistry...")
    from app.domain.agent_factory import AgentRegistry
    print("✅ AgentRegistry imported successfully")
    
    print("📥 Importing schemas...")
    from app.domain.schemas import AgentType, RequestContext, PromptIn
    print("✅ Schemas imported successfully")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

async def test_hr_agent_basic():
    """Test basic HR agent functionality."""
    print("\n=== Basic HR Agent Test ===")
    
    try:
        print("🏭 Initializing AgentRegistry...")
        registry = AgentRegistry()
        print("✅ AgentRegistry initialized")
        
        print("📂 Locating HR plugin...")
        hr_plugin_path = Path(__file__).parent / "app" / "plugins" / "hr_agent"
        print(f"📍 HR plugin path: {hr_plugin_path}")
        print(f"📁 Plugin directory exists: {hr_plugin_path.exists()}")
        
        if hr_plugin_path.exists():
            manifest_path = hr_plugin_path / "manifest.json"
            print(f"📄 Manifest exists: {manifest_path.exists()}")
            
        print("🔄 Loading HR plugin...")
        agent_id = await registry.load_plugin(hr_plugin_path)
        
        if not agent_id:
            print("❌ Failed to load HR agent plugin")
            return False
        
        print(f"✅ Loaded HR agent: {agent_id}")
        
        print("🤖 Creating HR agent instance...")
        hr_agent = await registry.create_agent(AgentType.HR)
        print(f"✅ Created HR agent instance: {hr_agent.agent_id}")
        
        print("🔍 Testing agent capabilities...")
        capabilities = hr_agent.get_capabilities()
        print(f"📋 Agent capabilities ({len(capabilities)}): {capabilities}")
        
        print("💰 Testing cost estimation...")
        prompt_in = PromptIn(prompt="What are the company benefits?")
        context = RequestContext(
            prompt=prompt_in,
            user_id="test-user",
            metadata={"test_mode": True}
        )
        
        cost = hr_agent.get_cost_estimate(context)
        print(f"💵 Estimated cost: ${cost:.4f}")
        
        print("✅ Basic HR agent test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Basic test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run the debug version of HR agent test."""
    print("🎯 Running debug HR agent test...\n")
    
    success = await test_hr_agent_basic()
    
    if success:
        print("\n🎉 DEBUG TEST: ✅ SUCCESS")
        print("HR agent is working correctly!")
    else:
        print("\n❌ DEBUG TEST: FAILED")
        print("Check the errors above for troubleshooting.")
    
    return 0 if success else 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
