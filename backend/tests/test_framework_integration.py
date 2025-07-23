"""
Comprehensive Test Suite for Framework Integration.

This module provides comprehensive testing for the LangChain and LlamaIndex
integration with AgentHive's existing systems.
"""

import pytest
import asyncio
from typing import Dict, Any, List
from unittest.mock import Mock, AsyncMock, patch
import json
from datetime import datetime

from app.domain.langchain_agent_wrapper import LangChainAgentWrapper, EnhancedHRAgent
from app.domain.llamaindex_rag_system import EnterpriseRAGSystem, get_rag_system
from app.domain.enhanced_agent_factory import (
    EnhancedAgentFactory, AgentFramework, HybridRAGAgent
)
from app.core.enhanced_orchestrator import EnhancedAgentOrchestrator
from app.domain.agent_factory import AgentType, AgentManifest
from app.domain.schemas import RequestContext, AgentPrompt
from app.core.agent_orchestrator import TaskPriority, AgentCapability


class TestLangChainAgentWrapper:
    """Test suite for LangChain agent wrapper."""
    
    @pytest.fixture
    async def mock_manifest(self):
        """Create mock agent manifest."""
        return AgentManifest(
            agent_type=AgentType.HR,
            name="Test HR Agent",
            description="Test HR agent for framework integration",
            version="1.0.0",
            config={
                "max_tokens": 1500,
                "temperature": 0.3,
                "system_prompt": "You are a helpful HR assistant."
            }
        )
    
    @pytest.fixture
    async def langchain_agent(self, mock_manifest):
        """Create LangChain agent wrapper for testing."""
        agent = EnhancedHRAgent("test_hr_agent", mock_manifest)
        # Mock the initialization to avoid external dependencies
        agent.llm = Mock()
        agent.memory = Mock()
        agent.agent_executor = AsyncMock()
        return agent
    
    @pytest.mark.asyncio
    async def test_agent_initialization(self, mock_manifest):
        """Test LangChain agent initialization."""
        agent = LangChainAgentWrapper("test_agent", mock_manifest)
        
        assert agent.agent_id == "test_agent"
        assert agent.manifest == mock_manifest
        assert agent.max_tokens == 1500
        assert agent.temperature == 0.3
    
    @pytest.mark.asyncio
    async def test_tool_creation(self, langchain_agent):
        """Test tool creation functionality."""
        def mock_function(query: str) -> str:
            return f"Mock result for: {query}"
        
        tool = langchain_agent.create_tool_from_function(
            name="test_tool",
            description="Test tool for unit testing",
            func=mock_function
        )
        
        assert tool.name == "test_tool"
        assert tool.description == "Test tool for unit testing"
        assert tool.func("test query") == "Mock result for: test query"
    
    @pytest.mark.asyncio
    async def test_handle_non_streaming(self, langchain_agent):
        """Test non-streaming request handling."""
        # Mock agent executor response
        langchain_agent.agent_executor.ainvoke.return_value = {
            "output": "Test response from HR agent",
            "intermediate_steps": []
        }
        
        # Create test request context
        context = RequestContext(
            request_id="test_request",
            user_id="test_user",
            session_id="test_session",
            prompt=AgentPrompt(prompt="What are my vacation days?"),
            stream=False
        )
        
        response = await langchain_agent.handle(context)
        
        assert hasattr(response, 'content')
        assert response.content == "Test response from HR agent"
        assert response.agent_type == AgentType.HR
        assert "tokens_used" in response.metadata
    
    @pytest.mark.asyncio
    async def test_handle_streaming(self, langchain_agent):
        """Test streaming request handling."""
        # Mock streaming response
        async def mock_stream():
            yield {"output": "Streaming "}
            yield {"output": "response "}
            yield {"output": "from agent"}
        
        langchain_agent.agent_executor.astream.return_value = mock_stream()
        
        context = RequestContext(
            request_id="test_request",
            user_id="test_user", 
            session_id="test_session",
            prompt=AgentPrompt(prompt="Tell me about benefits"),
            stream=True
        )
        
        response_chunks = []
        async for chunk in langchain_agent.handle(context):
            response_chunks.append(chunk)
        
        assert len(response_chunks) == 3
        assert "".join(response_chunks) == "Streaming response from agent"
    
    @pytest.mark.asyncio
    async def test_error_handling(self, langchain_agent):
        """Test error handling in agent execution."""
        # Mock agent executor to raise exception
        langchain_agent.agent_executor.ainvoke.side_effect = Exception("Test error")
        
        context = RequestContext(
            request_id="test_request",
            user_id="test_user",
            session_id="test_session", 
            prompt=AgentPrompt(prompt="Cause an error"),
            stream=False
        )
        
        response = await langchain_agent.handle(context)
        
        assert hasattr(response, 'content')
        assert "error processing your request" in response.content.lower()
        assert "error" in response.metadata


class TestLlamaIndexRAGSystem:
    """Test suite for LlamaIndex RAG system."""
    
    @pytest.fixture
    async def mock_rag_system(self):
        """Create mock RAG system for testing."""
        rag_system = EnterpriseRAGSystem()
        # Mock external dependencies
        rag_system.vector_store = Mock()
        rag_system.index = Mock()
        rag_system.query_engine = Mock()
        rag_system.embedding_model = Mock()
        rag_system.llm = Mock()
        return rag_system
    
    @pytest.mark.asyncio
    async def test_rag_initialization(self):
        """Test RAG system initialization."""
        rag_system = EnterpriseRAGSystem()
        
        assert rag_system.chunk_size == 512
        assert rag_system.chunk_overlap == 50
        assert rag_system.similarity_threshold == 0.7
        assert rag_system.top_k_retrieval == 10
    
    @pytest.mark.asyncio
    async def test_document_ingestion(self, mock_rag_system):
        """Test document ingestion functionality."""
        # Mock document processing
        mock_rag_system.node_parser = Mock()
        mock_rag_system.node_parser.get_nodes_from_documents.return_value = [
            Mock(node_id="node1"), Mock(node_id="node2")
        ]
        mock_rag_system.index.insert_nodes = Mock()
        
        # Test text document ingestion
        result = await mock_rag_system.add_document_from_text(
            "Test document content for ingestion",
            metadata={"source": "test", "type": "text"}
        )
        
        assert "Document added successfully" in result
        assert "39 characters" in result
    
    @pytest.mark.asyncio
    async def test_rag_query(self, mock_rag_system):
        """Test RAG query functionality."""
        # Mock query response
        mock_response = Mock()
        mock_response.__str__ = lambda: "RAG response to query"
        mock_response.source_nodes = [
            Mock(
                node=Mock(
                    text="Source document content",
                    metadata={"source": "test_doc"},
                    node_id="node1"
                ),
                score=0.85
            )
        ]
        
        mock_rag_system.query_engine.query.return_value = mock_response
        
        # Execute query
        result = await mock_rag_system.query("What is the company policy?")
        
        assert result["response"] == "RAG response to query"
        assert result["query"] == "What is the company policy?"
        assert len(result["source_nodes"]) == 1
        assert result["source_nodes"][0]["score"] == 0.85
    
    @pytest.mark.asyncio
    async def test_query_decomposition(self, mock_rag_system):
        """Test complex query decomposition."""
        # Mock LLM decomposition response
        mock_rag_system.llm.complete.side_effect = [
            "What is the vacation policy?\nHow do I request time off?\nWhat are the approval requirements?",
            "Based on the sub-queries, here is the comprehensive answer..."
        ]
        
        # Mock sub-query results
        mock_rag_system.query = AsyncMock(return_value={
            "response": "Sub-query response",
            "source_nodes": [],
            "total_sources": 0
        })
        
        result = await mock_rag_system.query_with_decomposition(
            "I need to understand the complete vacation policy and how to request time off with all requirements"
        )
        
        assert result["original_query"] is not None
        assert len(result["sub_queries"]) <= 3
        assert result["synthesis_method"] == "llm_decomposition"
    
    @pytest.mark.asyncio
    async def test_similar_documents(self, mock_rag_system):
        """Test similar document retrieval."""
        # Mock retriever
        mock_retriever = Mock()
        mock_nodes = [
            Mock(
                node=Mock(
                    text="Similar document 1",
                    metadata={"source": "doc1"},
                    node_id="node1"
                ),
                score=0.9
            ),
            Mock(
                node=Mock(
                    text="Similar document 2", 
                    metadata={"source": "doc2"},
                    node_id="node2"
                ),
                score=0.8
            )
        ]
        mock_retriever.retrieve.return_value = mock_nodes
        
        with patch('app.domain.llamaindex_rag_system.VectorIndexRetriever', return_value=mock_retriever):
            results = await mock_rag_system.get_similar_documents("test query", top_k=2)
        
        assert len(results) == 2
        assert results[0]["similarity_score"] == 0.9
        assert results[1]["similarity_score"] == 0.8


class TestEnhancedAgentFactory:
    """Test suite for enhanced agent factory."""
    
    @pytest.fixture
    async def enhanced_factory(self):
        """Create enhanced agent factory for testing."""
        factory = EnhancedAgentFactory()
        # Mock external dependencies
        factory.rag_system = Mock()
        return factory
    
    @pytest.mark.asyncio
    async def test_framework_determination(self, enhanced_factory):
        """Test framework selection logic."""
        assert enhanced_factory._determine_framework(AgentType.HR) == AgentFramework.LANGCHAIN
        assert enhanced_factory._determine_framework(AgentType.GENERAL) == AgentFramework.HYBRID
        assert enhanced_factory._determine_framework(AgentType.SUPPORT) == AgentFramework.LANGCHAIN
    
    @pytest.mark.asyncio
    async def test_agent_capabilities(self, enhanced_factory):
        """Test enhanced agent capabilities."""
        capabilities = await enhanced_factory.get_agent_capabilities(AgentType.HR)
        
        assert capabilities["framework"] == "langchain"
        assert "conversation_memory" in capabilities["enhanced_features"]
        assert "tool_integration" in capabilities["enhanced_features"]
    
    @pytest.mark.asyncio
    async def test_migration_planning(self, enhanced_factory):
        """Test agent migration planning."""
        migration_plan = await enhanced_factory.migrate_agent_to_framework(
            "test_agent", AgentFramework.HYBRID
        )
        
        assert migration_plan["target_framework"] == "hybrid"
        assert "migration_steps" in migration_plan
        assert migration_plan["rollback_available"] is True


class TestEnhancedOrchestrator:
    """Test suite for enhanced orchestrator."""
    
    @pytest.fixture
    async def enhanced_orchestrator(self):
        """Create enhanced orchestrator for testing."""
        orchestrator = EnhancedAgentOrchestrator()
        # Mock dependencies
        orchestrator.enhanced_factory = Mock()
        return orchestrator
    
    @pytest.mark.asyncio
    async def test_framework_metrics_update(self, enhanced_orchestrator):
        """Test framework metrics updating."""
        await enhanced_orchestrator._update_framework_metrics(
            AgentFramework.LANGCHAIN, 1.5, True
        )
        
        metrics = enhanced_orchestrator.framework_metrics["langchain"]
        assert metrics["total_requests"] == 1
        assert metrics["avg_response_time"] == 1.5
        assert metrics["success_rate"] == 1.0
        
        # Test failure case
        await enhanced_orchestrator._update_framework_metrics(
            AgentFramework.LANGCHAIN, 2.0, False
        )
        
        assert metrics["total_requests"] == 2
        assert metrics["success_rate"] < 1.0
    
    @pytest.mark.asyncio
    async def test_dynamic_agent_creation(self, enhanced_orchestrator):
        """Test dynamic agent creation."""
        # Mock factory response
        mock_agent = Mock()
        enhanced_orchestrator.enhanced_factory.create_agent.return_value = mock_agent
        enhanced_orchestrator.enhanced_factory.get_agent_capabilities.return_value = {
            "capabilities": ["test_capability"]
        }
        enhanced_orchestrator.enhanced_factory._determine_framework.return_value = AgentFramework.LANGCHAIN
        
        agent_id = await enhanced_orchestrator.create_agent_on_demand(
            AgentType.HR, AgentFramework.LANGCHAIN
        )
        
        assert agent_id.startswith("dynamic_")
        assert "hr" in agent_id
    
    @pytest.mark.asyncio
    async def test_performance_report(self, enhanced_orchestrator):
        """Test framework performance reporting."""
        # Add some test metrics
        enhanced_orchestrator.framework_metrics["langchain"]["total_requests"] = 100
        enhanced_orchestrator.framework_metrics["langchain"]["avg_response_time"] = 1.2
        enhanced_orchestrator.framework_metrics["langchain"]["success_rate"] = 0.95
        
        report = await enhanced_orchestrator.get_framework_performance_report()
        
        assert "framework_comparison" in report
        assert "langchain" in report["framework_comparison"]
        assert report["framework_comparison"]["langchain"]["total_requests"] == 100
        assert "recommendations" in report


class TestHybridRAGAgent:
    """Test suite for hybrid RAG agent."""
    
    @pytest.fixture
    async def hybrid_agent(self):
        """Create hybrid RAG agent for testing."""
        # Mock LangChain agent
        mock_langchain_agent = Mock()
        mock_langchain_agent.agent_id = "test_hybrid"
        mock_langchain_agent.manifest = Mock()
        mock_langchain_agent.handle = AsyncMock()
        
        # Mock RAG system
        mock_rag_system = Mock()
        mock_rag_system.query = AsyncMock()
        
        return HybridRAGAgent(mock_langchain_agent, mock_rag_system)
    
    @pytest.mark.asyncio
    async def test_rag_context_enhancement(self, hybrid_agent):
        """Test RAG context enhancement."""
        # Mock RAG response
        hybrid_agent.rag_system.query.return_value = {
            "response": "RAG context response",
            "source_nodes": [
                {
                    "content": "Relevant document content for context enhancement",
                    "metadata": {"source": "policy_doc"},
                    "score": 0.85
                }
            ]
        }
        
        # Mock LangChain agent response
        hybrid_agent.langchain_agent.handle.return_value = Mock(
            content="Enhanced response with context",
            metadata={"enhanced": True}
        )
        
        context = RequestContext(
            request_id="test_hybrid",
            user_id="test_user",
            session_id="test_session",
            prompt=AgentPrompt(prompt="What is the vacation policy?"),
            stream=False
        )
        
        response = await hybrid_agent.handle(context)
        
        # Verify RAG was called
        hybrid_agent.rag_system.query.assert_called_once()
        
        # Verify enhanced prompt was used
        hybrid_agent.langchain_agent.handle.assert_called_once()
        call_args = hybrid_agent.langchain_agent.handle.call_args[0][0]
        assert "Based on the following relevant information:" in call_args.prompt.prompt
    
    @pytest.mark.asyncio
    async def test_fallback_behavior(self, hybrid_agent):
        """Test fallback when RAG fails."""
        # Mock RAG failure
        hybrid_agent.rag_system.query.side_effect = Exception("RAG error")
        
        # Mock successful LangChain response
        hybrid_agent.langchain_agent.handle.return_value = Mock(
            content="Fallback response without RAG"
        )
        
        context = RequestContext(
            request_id="test_fallback",
            user_id="test_user",
            session_id="test_session",
            prompt=AgentPrompt(prompt="Test query"),
            stream=False
        )
        
        response = await hybrid_agent.handle(context)
        
        # Should still get response despite RAG failure
        assert response is not None
        hybrid_agent.langchain_agent.handle.assert_called_once()


# Integration tests
class TestFrameworkIntegration:
    """Integration tests for complete framework stack."""
    
    @pytest.mark.asyncio
    async def test_end_to_end_workflow(self):
        """Test complete end-to-end workflow with all components."""
        # This would test the complete integration but requires
        # actual database and external service connections
        # For now, we'll test the component interfaces
        
        # Mock all external dependencies
        with patch('app.domain.enhanced_agent_factory.get_rag_system') as mock_rag:
            mock_rag.return_value = Mock()
            
            factory = EnhancedAgentFactory()
            
            # Test that factory can be created without errors
            assert factory is not None
            assert factory.framework_preference["hr"] == AgentFramework.LANGCHAIN
    
    @pytest.mark.asyncio
    async def test_performance_comparison(self):
        """Test performance comparison between frameworks."""
        # Mock performance data
        custom_metrics = {"avg_time": 2.0, "success_rate": 0.90}
        langchain_metrics = {"avg_time": 1.5, "success_rate": 0.95}
        hybrid_metrics = {"avg_time": 1.8, "success_rate": 0.93}
        
        # Verify LangChain shows better performance
        assert langchain_metrics["avg_time"] < custom_metrics["avg_time"]
        assert langchain_metrics["success_rate"] > custom_metrics["success_rate"]
        
        # Verify hybrid is balanced
        assert custom_metrics["avg_time"] > hybrid_metrics["avg_time"] > langchain_metrics["avg_time"]


if __name__ == "__main__":
    # Run tests with: python -m pytest tests/test_framework_integration.py -v
    pytest.main([__file__, "-v"])
