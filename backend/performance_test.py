#!/usr/bin/env python3
"""
Performance optimization integration test script.

This script tests the multi-layer caching, load balancing, and metrics
collection systems for the ChatTSC intelligent router.
"""

import asyncio
import time
import json
import random
from typing import List, Dict, Any
from datetime import datetime

import httpx
import redis
import pytest


class PerformanceTestSuite:
    """Performance optimization test suite."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
        self.redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
        
        # Test queries for different scenarios
        self.test_queries = [
            "I need help with my apartment lease",  # Lease agent
            "I want to buy a house",  # Sales agent
            "The system is broken and won't login",  # Support agent
            "Hello, how are you?",  # General agent
            "What's my security deposit status?",  # Lease agent - cached
            "I'm having trouble logging in",  # Support agent - cached
        ]
        
        # Performance metrics
        self.metrics = {
            'cache_hits': 0,
            'cache_misses': 0,
            'avg_response_time': 0.0,
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0
        }
    
    async def setup(self):
        """Setup test environment."""
        print("🔧 Setting up performance test environment...")
        
        # Check if backend is running
        try:
            response = await self.client.get(f"{self.base_url}/health")
            if response.status_code != 200:
                raise Exception(f"Backend health check failed: {response.status_code}")
            print("✅ Backend is running")
        except Exception as e:
            print(f"❌ Backend connection failed: {e}")
            return False
        
        # Check Redis connection
        try:
            self.redis_client.ping()
            print("✅ Redis is connected")
        except Exception as e:
            print(f"⚠️  Redis connection failed (caching will be disabled): {e}")
        
        # Clear any existing cache data for clean testing
        try:
            self.redis_client.flushall()
            print("🗑️  Cleared cache for clean testing")
        except:
            pass
        
        return True
    
    async def test_cache_performance(self) -> Dict[str, Any]:
        """Test multi-layer caching performance."""
        print("\n📊 Testing cache performance...")
        
        cache_results = {
            'first_requests': [],
            'cached_requests': [],
            'cache_hit_ratio': 0.0
        }
        
        # Make initial requests (should be cache misses)
        for query in self.test_queries[:3]:  # Test first 3 queries
            start_time = time.time()
            
            try:
                response = await self.client.post(
                    f"{self.base_url}/api/v1/chat",
                    json={
                        "prompt": query,
                        "session_id": f"test_session_{random.randint(1000, 9999)}"
                    },
                    headers={"Authorization": "Bearer test_token"}
                )
                
                duration = (time.time() - start_time) * 1000
                cache_results['first_requests'].append({
                    'query': query,
                    'duration_ms': duration,
                    'success': response.status_code == 200
                })
                
                print(f"  🔸 First request: {query[:30]}... - {duration:.1f}ms")
                
            except Exception as e:
                print(f"  ❌ Request failed: {e}")
        
        # Wait a moment for cache to settle
        await asyncio.sleep(1)
        
        # Make identical requests (should be cache hits)
        for query in self.test_queries[:3]:
            start_time = time.time()
            
            try:
                response = await self.client.post(
                    f"{self.base_url}/api/v1/chat",
                    json={
                        "prompt": query,
                        "session_id": f"test_session_{random.randint(1000, 9999)}"
                    },
                    headers={"Authorization": "Bearer test_token"}
                )
                
                duration = (time.time() - start_time) * 1000
                cache_results['cached_requests'].append({
                    'query': query,
                    'duration_ms': duration,
                    'success': response.status_code == 200
                })
                
                print(f"  🔸 Cached request: {query[:30]}... - {duration:.1f}ms")
                
            except Exception as e:
                print(f"  ❌ Cached request failed: {e}")
        
        # Calculate performance improvement
        if cache_results['first_requests'] and cache_results['cached_requests']:
            avg_first = sum(r['duration_ms'] for r in cache_results['first_requests']) / len(cache_results['first_requests'])
            avg_cached = sum(r['duration_ms'] for r in cache_results['cached_requests']) / len(cache_results['cached_requests'])
            
            improvement = ((avg_first - avg_cached) / avg_first) * 100
            cache_results['performance_improvement'] = improvement
            
            print(f"  📈 Average first request: {avg_first:.1f}ms")
            print(f"  📈 Average cached request: {avg_cached:.1f}ms")
            print(f"  🚀 Performance improvement: {improvement:.1f}%")
        
        return cache_results
    
    async def test_load_balancing(self) -> Dict[str, Any]:
        """Test load balancing with concurrent requests."""
        print("\n⚖️  Testing load balancing...")
        
        load_test_results = {
            'concurrent_requests': 20,
            'successful_requests': 0,
            'failed_requests': 0,
            'avg_response_time': 0.0,
            'response_times': []
        }
        
        async def make_request(session_id: str):
            """Make a single request."""
            query = random.choice(self.test_queries)
            start_time = time.time()
            
            try:
                response = await self.client.post(
                    f"{self.base_url}/api/v1/chat",
                    json={
                        "prompt": query,
                        "session_id": session_id
                    },
                    headers={"Authorization": "Bearer test_token"}
                )
                
                duration = (time.time() - start_time) * 1000
                
                return {
                    'success': response.status_code == 200,
                    'duration_ms': duration,
                    'status_code': response.status_code,
                    'query': query
                }
                
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                return {
                    'success': False,
                    'duration_ms': duration,
                    'error': str(e),
                    'query': query
                }
        
        # Launch concurrent requests
        print(f"  🚀 Launching {load_test_results['concurrent_requests']} concurrent requests...")
        
        tasks = [
            make_request(f"load_test_session_{i}")
            for i in range(load_test_results['concurrent_requests'])
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        for result in results:
            if isinstance(result, dict):
                load_test_results['response_times'].append(result['duration_ms'])
                
                if result['success']:
                    load_test_results['successful_requests'] += 1
                    print(f"    ✅ {result['query'][:30]}... - {result['duration_ms']:.1f}ms")
                else:
                    load_test_results['failed_requests'] += 1
                    print(f"    ❌ {result.get('query', 'Unknown')[:30]}... - Error: {result.get('error', 'Unknown')}")
        
        # Calculate statistics
        if load_test_results['response_times']:
            load_test_results['avg_response_time'] = sum(load_test_results['response_times']) / len(load_test_results['response_times'])
            load_test_results['min_response_time'] = min(load_test_results['response_times'])
            load_test_results['max_response_time'] = max(load_test_results['response_times'])
        
        success_rate = (load_test_results['successful_requests'] / load_test_results['concurrent_requests']) * 100
        
        print(f"  📊 Success rate: {success_rate:.1f}%")
        print(f"  📊 Average response time: {load_test_results['avg_response_time']:.1f}ms")
        print(f"  📊 Min response time: {load_test_results.get('min_response_time', 0):.1f}ms")
        print(f"  📊 Max response time: {load_test_results.get('max_response_time', 0):.1f}ms")
        
        return load_test_results
    
    async def test_metrics_collection(self) -> Dict[str, Any]:
        """Test metrics collection and monitoring."""
        print("\n📊 Testing metrics collection...")
        
        metrics_results = {
            'metrics_endpoint_available': False,
            'prometheus_metrics': {},
            'router_analytics': {}
        }
        
        # Test metrics endpoint
        try:
            response = await self.client.get(
                f"{self.base_url}/api/v1/router/metrics",
                headers={"Authorization": "Bearer test_token"}
            )
            
            if response.status_code == 200:
                metrics_results['metrics_endpoint_available'] = True
                metrics_data = response.json()
                print(f"  ✅ Metrics endpoint available")
                print(f"  📊 Enhanced routing: {metrics_data.get('enhanced_routing', False)}")
                
                # Check for learning metrics
                if 'learning_metrics' in metrics_data:
                    learning = metrics_data['learning_metrics']
                    print(f"  📊 Total decisions: {learning.get('total_decisions', 0)}")
                    print(f"  📊 Learning enabled: {learning.get('learning_enabled', False)}")
                
                # Check for context metrics
                if 'context_metrics' in metrics_data:
                    context = metrics_data['context_metrics']
                    print(f"  📊 Active sessions: {context.get('active_sessions', 0)}")
                    print(f"  📊 Active users: {context.get('active_users', 0)}")
                
            else:
                print(f"  ❌ Metrics endpoint failed: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Metrics endpoint error: {e}")
        
        # Test Prometheus metrics
        try:
            response = await self.client.get(f"{self.base_url}/metrics")
            
            if response.status_code == 200:
                metrics_text = response.text
                
                # Parse some key metrics
                for line in metrics_text.split('\n'):
                    if line.startswith('router_requests_total'):
                        metrics_results['prometheus_metrics']['router_requests'] = line
                    elif line.startswith('router_duration_seconds'):
                        metrics_results['prometheus_metrics']['router_duration'] = line
                    elif line.startswith('cache_operations_total'):
                        metrics_results['prometheus_metrics']['cache_operations'] = line
                
                print(f"  ✅ Prometheus metrics available")
                print(f"  📊 Found {len(metrics_results['prometheus_metrics'])} key metrics")
                
            else:
                print(f"  ⚠️  Prometheus metrics not available: {response.status_code}")
                
        except Exception as e:
            print(f"  ⚠️  Prometheus metrics error: {e}")
        
        # Test router analytics dashboard
        try:
            response = await self.client.get(
                f"{self.base_url}/api/v1/router/analytics/dashboard",
                headers={"Authorization": "Bearer test_token"}
            )
            
            if response.status_code == 200:
                analytics_data = response.json()
                metrics_results['router_analytics'] = analytics_data
                
                print(f"  ✅ Analytics dashboard available")
                
                if 'summary' in analytics_data:
                    summary = analytics_data['summary']
                    print(f"  📊 Total decisions: {summary.get('total_decisions', 0)}")
                    print(f"  📊 Success rate: {summary.get('success_rate', 0):.2f}")
                    print(f"  📊 Avg satisfaction: {summary.get('avg_satisfaction', 0):.2f}")
                
            else:
                print(f"  ❌ Analytics dashboard failed: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Analytics dashboard error: {e}")
        
        return metrics_results
    
    async def test_kubernetes_hpa_config(self) -> Dict[str, Any]:
        """Test Kubernetes HPA configuration validation."""
        print("\n☸️  Testing Kubernetes HPA configuration...")
        
        hpa_results = {
            'config_valid': False,
            'scaling_metrics': [],
            'resource_limits': {}
        }
        
        # Check if HPA config file exists and is valid
        try:
            with open('/Users/henokghebrechristos/Repo/TSC/chattsc/kubernetes/hpa.yml', 'r') as f:
                hpa_config = f.read()
            
            print("  ✅ HPA configuration file found")
            
            # Basic validation checks
            required_fields = [
                'apiVersion: autoscaling/v2',
                'kind: HorizontalPodAutoscaler',
                'targetCPUUtilizationPercentage',
                'metrics:'
            ]
            
            for field in required_fields:
                if field in hpa_config:
                    print(f"    ✅ Found: {field}")
                    hpa_results['config_valid'] = True
                else:
                    print(f"    ❌ Missing: {field}")
                    hpa_results['config_valid'] = False
                    break
            
            # Check for custom metrics
            if 'custom.metrics.k8s.io' in hpa_config:
                print("    ✅ Custom metrics configuration found")
                hpa_results['scaling_metrics'].append('custom_metrics')
            
            if 'cpu' in hpa_config:
                print("    ✅ CPU scaling metric found")
                hpa_results['scaling_metrics'].append('cpu')
            
            if 'memory' in hpa_config:
                print("    ✅ Memory scaling metric found")
                hpa_results['scaling_metrics'].append('memory')
            
        except FileNotFoundError:
            print("  ❌ HPA configuration file not found")
        except Exception as e:
            print(f"  ❌ HPA configuration error: {e}")
        
        # Check deployment resource limits
        try:
            with open('/Users/henokghebrechristos/Repo/TSC/chattsc/kubernetes/backend_deployment.yml', 'r') as f:
                deployment_config = f.read()
            
            print("  ✅ Deployment configuration file found")
            
            if 'resources:' in deployment_config:
                print("    ✅ Resource limits configured")
                hpa_results['resource_limits']['configured'] = True
            
            if 'cpu: ' in deployment_config:
                print("    ✅ CPU limits found")
                hpa_results['resource_limits']['cpu'] = True
            
            if 'memory: ' in deployment_config:
                print("    ✅ Memory limits found")
                hpa_results['resource_limits']['memory'] = True
            
        except FileNotFoundError:
            print("  ❌ Deployment configuration file not found")
        except Exception as e:
            print(f"  ❌ Deployment configuration error: {e}")
        
        return hpa_results
    
    async def generate_performance_report(
        self,
        cache_results: Dict[str, Any],
        load_results: Dict[str, Any],
        metrics_results: Dict[str, Any],
        hpa_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate comprehensive performance report."""
        print("\n📋 Generating performance report...")
        
        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'test_duration': time.time(),
            'cache_performance': cache_results,
            'load_balancing': load_results,
            'metrics_collection': metrics_results,
            'kubernetes_hpa': hpa_results,
            'overall_score': 0.0,
            'recommendations': []
        }
        
        # Calculate overall score
        score = 0.0
        max_score = 100.0
        
        # Cache performance (25 points)
        if cache_results.get('performance_improvement', 0) > 10:
            score += 25
            print("  ✅ Cache performance: Excellent (>10% improvement)")
        elif cache_results.get('performance_improvement', 0) > 0:
            score += 15
            print("  ⚠️  Cache performance: Good (>0% improvement)")
        else:
            print("  ❌ Cache performance: Needs improvement")
            report['recommendations'].append("Investigate cache configuration and TTL settings")
        
        # Load balancing (25 points)
        success_rate = (load_results.get('successful_requests', 0) / load_results.get('concurrent_requests', 1)) * 100
        avg_response = load_results.get('avg_response_time', 1000)
        
        if success_rate >= 95 and avg_response < 500:
            score += 25
            print("  ✅ Load balancing: Excellent (>95% success, <500ms avg)")
        elif success_rate >= 90 and avg_response < 1000:
            score += 15
            print("  ⚠️  Load balancing: Good (>90% success, <1000ms avg)")
        else:
            print("  ❌ Load balancing: Needs improvement")
            report['recommendations'].append("Review load balancing configuration and resource limits")
        
        # Metrics collection (25 points)
        if metrics_results.get('metrics_endpoint_available') and metrics_results.get('prometheus_metrics'):
            score += 25
            print("  ✅ Metrics collection: Excellent (all endpoints working)")
        elif metrics_results.get('metrics_endpoint_available'):
            score += 15
            print("  ⚠️  Metrics collection: Good (basic metrics available)")
        else:
            print("  ❌ Metrics collection: Needs improvement")
            report['recommendations'].append("Enable metrics collection and Prometheus integration")
        
        # Kubernetes HPA (25 points)
        if hpa_results.get('config_valid') and len(hpa_results.get('scaling_metrics', [])) >= 2:
            score += 25
            print("  ✅ Kubernetes HPA: Excellent (multi-metric scaling)")
        elif hpa_results.get('config_valid'):
            score += 15
            print("  ⚠️  Kubernetes HPA: Good (basic configuration)")
        else:
            print("  ❌ Kubernetes HPA: Needs improvement")
            report['recommendations'].append("Configure Kubernetes HPA with multiple scaling metrics")
        
        report['overall_score'] = score
        
        print(f"\n🏆 Overall Performance Score: {score:.1f}/{max_score} ({score/max_score*100:.1f}%)")
        
        if score >= 90:
            print("🎉 Excellent! Your performance optimizations are working great!")
        elif score >= 70:
            print("👍 Good! Some optimizations are working, but there's room for improvement.")
        else:
            print("⚠️  Your system needs performance optimization work.")
        
        return report
    
    async def run_full_test_suite(self) -> Dict[str, Any]:
        """Run the complete performance test suite."""
        print("🚀 Starting ChatTSC Performance Optimization Test Suite")
        print("=" * 60)
        
        # Setup
        if not await self.setup():
            return {'error': 'Setup failed'}
        
        try:
            # Run all tests
            cache_results = await self.test_cache_performance()
            load_results = await self.test_load_balancing()
            metrics_results = await self.test_metrics_collection()
            hpa_results = await self.test_kubernetes_hpa_config()
            
            # Generate report
            report = await self.generate_performance_report(
                cache_results, load_results, metrics_results, hpa_results
            )
            
            # Save report
            report_file = f"performance_report_{int(time.time())}.json"
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            print(f"\n📄 Report saved to: {report_file}")
            
            return report
            
        except Exception as e:
            print(f"❌ Test suite failed: {e}")
            return {'error': str(e)}
        
        finally:
            await self.client.aclose()


async def main():
    """Main test execution function."""
    test_suite = PerformanceTestSuite()
    
    # Check for command line arguments
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == '--cache-only':
            await test_suite.setup()
            await test_suite.test_cache_performance()
        elif sys.argv[1] == '--load-only':
            await test_suite.setup()
            await test_suite.test_load_balancing()
        elif sys.argv[1] == '--metrics-only':
            await test_suite.setup()
            await test_suite.test_metrics_collection()
        elif sys.argv[1] == '--hpa-only':
            await test_suite.test_kubernetes_hpa_config()
        else:
            print("Usage: python performance_test.py [--cache-only|--load-only|--metrics-only|--hpa-only]")
    else:
        # Run full suite
        await test_suite.run_full_test_suite()


if __name__ == "__main__":
    asyncio.run(main())
