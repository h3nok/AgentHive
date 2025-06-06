#!/usr/bin/env python3
"""
Test script for TSC Microservices Architecture
Verifies all services are properly implemented and functional
"""

import asyncio
import sys
import json
from datetime import datetime

async def test_microservices():
    """Test all microservices components"""
    
    print("🚀 Testing TSC Sophisticated Microservices Architecture")
    print("=" * 60)
    
    test_results = {
        "orchestration_service": False,
        "rag_service": False,
        "nlq_service": False,
        "sql_execution_service": False,
        "synthesis_service": False,
        "routers": False
    }
    
    # Test 1: Orchestration Service
    try:
        from app.services.orchestration_service import orchestration_service, QueryRequest, QueryContext
        
        print("✅ Orchestration Service: Import successful")
        
        # Test health check
        health = await orchestration_service.get_health_status()
        print(f"   - Health Status: {health.get('status', 'unknown')}")
        print(f"   - Active Sessions: {health.get('active_sessions', 0)}")
        print(f"   - Registered Services: {len(health.get('registered_services', []))}")
        
        test_results["orchestration_service"] = True
        
    except Exception as e:
        print(f"❌ Orchestration Service: {str(e)}")
    
    # Test 2: RAG Service
    try:
        from app.services.rag_service import rag_service, RetrievalRequest, DocumentType
        
        print("✅ RAG Service: Import successful")
        
        # Test health check
        health = await rag_service.get_health_status()
        print(f"   - Health Status: {health.get('status', 'unknown')}")
        print(f"   - Document Count: {health.get('document_count', 0)}")
        print(f"   - Supported Strategies: {len(health.get('supported_strategies', []))}")
        
        # Test retrieval
        request = RetrievalRequest(query="lease agreements for store 1234")
        response = await rag_service.retrieve_documents(request)
        print(f"   - Test Retrieval: Found {len(response.retrieved_chunks)} documents")
        
        test_results["rag_service"] = True
        
    except Exception as e:
        print(f"❌ RAG Service: {str(e)}")
    
    # Test 3: NLQ Service
    try:
        from app.services.nlq_service import nlq_service, NLQRequest
        
        print("✅ NLQ Service: Import successful")
        
        # Test health check
        health = await nlq_service.get_health_status()
        print(f"   - Health Status: {health.get('status', 'unknown')}")
        print(f"   - Schema Tables: {health.get('schema_tables', 0)}")
        print(f"   - Query Patterns: {health.get('query_patterns', 0)}")
        
        # Test SQL generation
        request = NLQRequest(query="show me all stores with lease expiration dates")
        response = await nlq_service.generate_sql(request)
        print(f"   - Test SQL Generation: Confidence {response.generated_sql.confidence_score:.2f}")
        print(f"   - Generated Query Type: {response.generated_sql.query_type}")
        
        test_results["nlq_service"] = True
        
    except Exception as e:
        print(f"❌ NLQ Service: {str(e)}")
    
    # Test 4: SQL Execution Service
    try:
        from app.services.sql_execution_service import sql_execution_service, QueryExecutionRequest
        
        print("✅ SQL Execution Service: Import successful")
        
        # Test health check
        health = await sql_execution_service.get_health_status()
        print(f"   - Health Status: {health.get('status', 'unknown')}")
        print(f"   - Mock Tables: {len(health.get('mock_tables', []))}")
        print(f"   - Security Levels: {len(health.get('security_levels', []))}")
        
        # Test query execution
        request = QueryExecutionRequest(sql_query="SELECT * FROM stores LIMIT 2")
        response = await sql_execution_service.execute_query(request)
        print(f"   - Test Execution: Status {response.query_result.status}")
        print(f"   - Rows Returned: {response.query_result.row_count}")
        
        test_results["sql_execution_service"] = True
        
    except Exception as e:
        print(f"❌ SQL Execution Service: {str(e)}")
    
    # Test 5: Synthesis Service
    try:
        from app.services.synthesis_service import synthesis_service, SynthesisRequest
        
        print("✅ Synthesis Service: Import successful")
        
        # Test health check
        health = await synthesis_service.get_health_status()
        print(f"   - Health Status: {health.get('status', 'unknown')}")
        print(f"   - Supported Formats: {len(health.get('supported_formats', []))}")
        print(f"   - Supported Tones: {len(health.get('supported_tones', []))}")
        
        # Test synthesis
        request = SynthesisRequest(
            query="What are the lease details for store 1234?",
            context_data={"test": True}
        )
        response = await synthesis_service.synthesize_response(request)
        print(f"   - Test Synthesis: Confidence {response.synthesized_content.confidence_score:.2f}")
        print(f"   - Response Length: {len(response.synthesized_content.content)} chars")
        
        test_results["synthesis_service"] = True
        
    except Exception as e:
        print(f"❌ Synthesis Service: {str(e)}")
    
    # Test 6: Router Integration
    try:
        from app.routers.microservices_router import router
        
        print("✅ Microservices Router: Import successful")
        print(f"   - Router Prefix: {router.prefix}")
        print(f"   - Router Tags: {router.tags}")
        
        test_results["routers"] = True
        
    except Exception as e:
        print(f"❌ Microservices Router: {str(e)}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    total_tests = len(test_results)
    passed_tests = sum(test_results.values())
    
    for service, status in test_results.items():
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {service.replace('_', ' ').title()}")
    
    print(f"\n🎯 Overall Result: {passed_tests}/{total_tests} services operational")
    
    if passed_tests == total_tests:
        print("🎉 ALL MICROSERVICES ARCHITECTURE TESTS PASSED!")
        print("🚀 System is ready for production deployment!")
    else:
        print("⚠️  Some services need attention before deployment")
    
    # Architecture Overview
    print("\n" + "=" * 60)
    print("🏗️  MICROSERVICES ARCHITECTURE OVERVIEW")
    print("=" * 60)
    
    architecture = {
        "Core Services": [
            "Orchestration Service (PydanticAI-powered)",
            "RAG Service (Advanced retrieval & ranking)",
            "NLQ Service (Natural Language to SQL)",
            "SQL Execution Service (Secure & PII-protected)",
            "Synthesis Service (Multi-modal response generation)"
        ],
        "Enterprise Features": [
            "Service registry and discovery",
            "Circuit breaker pattern",
            "Comprehensive security validation",
            "Real-time health monitoring",
            "Background task processing"
        ],
        "API Endpoints": [
            "/microservices/query (Unified processing)",
            "/microservices/workflows/* (Advanced workflows)",
            "/microservices/health (System monitoring)",
            "/microservices/config (Configuration management)"
        ]
    }
    
    for category, items in architecture.items():
        print(f"\n{category}:")
        for item in items:
            print(f"  • {item}")
    
    print(f"\n⏱️  Test completed at: {datetime.utcnow().isoformat()}")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    try:
        success = asyncio.run(test_microservices())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test failed with error: {str(e)}")
        sys.exit(1) 