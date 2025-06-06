/**
 * Simple test script to verify router simulation integration
 * Run this in the browser console when the app is loaded
 */

// Test router simulation functionality
export const testRouterSimulation = async () => {
  console.log('🧪 Testing Router Simulation Integration...');
  
  try {
    // Test 1: Check if router simulation service is available
    const { routerSimulationService } = await import('./services/routerSimulation');
    console.log('✅ Router simulation service imported successfully');
    
    // Test 2: Test basic routing simulation
    const testQuery = "I need help with a lease agreement";
    console.log(`🔍 Testing query: "${testQuery}"`);
    
    const decision = await routerSimulationService.simulateRouting(testQuery);
    console.log('✅ Router simulation decision:', decision);
    
    // Test 3: Check performance metrics
    const metrics = routerSimulationService.getPerformanceMetrics();
    console.log('📊 Performance metrics:', metrics);
    
    // Test 4: Test router trace creation
    const trace = routerSimulationService.createRouterTrace(decision, 'test-session');
    console.log('📝 Router trace created:', trace);
    
    console.log('🎉 All router simulation tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Router simulation test failed:', error);
    return false;
  }
};

// Test router simulation hooks
export const testRouterHooks = () => {
  console.log('🔗 Testing Router Simulation Hooks...');
  
  try {
    // This would be called from within a React component
    console.log('ℹ️  Router hooks should be tested within React components');
    console.log('ℹ️  Check the Chat Interface for floating action buttons:');
    console.log('   • 🧠 Psychology icon - Toggle router simulation mode');
    console.log('   • 🐛 Bug icon - Open router debug drawer');
    console.log('   • 🔀 Router icon - Open router simulation panel');
    
    return true;
  } catch (error) {
    console.error('❌ Router hooks test failed:', error);
    return false;
  }
};

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).testRouterSimulation = testRouterSimulation;
  (window as any).testRouterHooks = testRouterHooks;
}
