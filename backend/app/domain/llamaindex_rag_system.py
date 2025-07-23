"""
LlamaIndex RAG System Integration for AgentHive.

This module provides advanced RAG capabilities using LlamaIndex framework
while leveraging AgentHive's existing PostgreSQL + pgvector infrastructure.
"""

from typing import List, Dict, Any, Optional, Union, AsyncIterator
import asyncio
from pathlib import Path
from datetime import datetime
import json

from llama_index.core import VectorStoreIndex, ServiceContext, Document
from llama_index.core.node_parser import SimpleNodeParser
from llama_index.core.text_splitter import TokenTextSplitter
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.postprocessor import SimilarityPostprocessor
from llama_index.readers.file import SimpleDirectoryReader, PDFReader
from llama_index.core.schema import NodeWithScore, QueryBundle
from llama_index.core.callbacks import CallbackManager, LlamaDebugHandler

from ..core.observability import get_logger, with_tracing
from ..core.config import settings

logger = get_logger(__name__)


class EnterpriseRAGSystem:
    """
    Enterprise-grade RAG system using LlamaIndex with PostgreSQL backend.
    
    Features:
    - Advanced document processing and chunking
    - Hybrid retrieval strategies
    - Query decomposition and synthesis
    - Re-ranking and filtering
    - Integration with existing pgvector infrastructure
    """
    
    def __init__(self):
        self.vector_store: Optional[PGVectorStore] = None
        self.index: Optional[VectorStoreIndex] = None
        self.service_context: Optional[ServiceContext] = None
        self.query_engine: Optional[RetrieverQueryEngine] = None
        self.embedding_model: Optional[OpenAIEmbedding] = None
        self.llm: Optional[OpenAI] = None
        self.node_parser: Optional[SimpleNodeParser] = None
        
        # Configuration
        self.chunk_size = 512
        self.chunk_overlap = 50
        self.similarity_threshold = 0.7
        self.top_k_retrieval = 10
        self.max_tokens = 1500
        
        # Callback handler for debugging
        self.debug_handler = LlamaDebugHandler(print_trace_on_end=True)
        self.callback_manager = CallbackManager([self.debug_handler])
    
    async def initialize(self) -> None:
        """Initialize the RAG system with existing PostgreSQL infrastructure."""
        try:
            # Initialize embedding model
            self.embedding_model = OpenAIEmbedding(
                model="text-embedding-ada-002",
                embed_batch_size=100
            )
            
            # Initialize LLM
            self.llm = OpenAI(
                model="gpt-4",
                temperature=0.1,
                max_tokens=self.max_tokens
            )
            
            # Connect to existing PostgreSQL + pgvector
            self.vector_store = PGVectorStore.from_params(
                database=settings.DATABASE_NAME,
                host=settings.DATABASE_HOST,
                password=settings.DATABASE_PASSWORD,
                port=settings.DATABASE_PORT,
                user=settings.DATABASE_USER,
                table_name="document_embeddings",
                embed_dim=1536,  # OpenAI embedding dimension
                hnsw_kwargs={
                    "hnsw_m": 16,
                    "hnsw_ef_construction": 64,
                    "hnsw_ef_search": 40,
                }
            )
            
            # Initialize node parser with advanced chunking
            text_splitter = TokenTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap,
                separator=" "
            )
            
            self.node_parser = SimpleNodeParser(
                text_splitter=text_splitter,
                include_metadata=True,
                include_prev_next_rel=True
            )
            
            # Create service context
            self.service_context = ServiceContext.from_defaults(
                llm=self.llm,
                embed_model=self.embedding_model,
                node_parser=self.node_parser,
                callback_manager=self.callback_manager
            )
            
            # Create or load index
            await self._initialize_index()
            
            # Create query engine with advanced retrieval
            await self._setup_query_engine()
            
            logger.info("LlamaIndex RAG system initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG system: {e}")
            raise RuntimeError(f"RAG system initialization failed: {e}")
    
    async def _initialize_index(self) -> None:
        """Initialize or load the vector index."""
        try:
            # Try to load existing index
            self.index = VectorStoreIndex.from_vector_store(
                vector_store=self.vector_store,
                service_context=self.service_context
            )
            logger.info("Loaded existing vector index")
            
        except Exception as e:
            logger.warning(f"Could not load existing index: {e}")
            # Create new index if none exists
            self.index = VectorStoreIndex(
                nodes=[],
                vector_store=self.vector_store,
                service_context=self.service_context
            )
            logger.info("Created new vector index")
    
    async def _setup_query_engine(self) -> None:
        """Setup advanced query engine with retrieval and post-processing."""
        # Create retriever with configurable parameters
        retriever = VectorIndexRetriever(
            index=self.index,
            similarity_top_k=self.top_k_retrieval,
            vector_store_query_mode="default"
        )
        
        # Add post-processors for filtering and re-ranking
        postprocessors = [
            SimilarityPostprocessor(similarity_cutoff=self.similarity_threshold)
        ]
        
        # Create query engine
        self.query_engine = RetrieverQueryEngine(
            retriever=retriever,
            node_postprocessors=postprocessors,
            service_context=self.service_context
        )
    
    @with_tracing("rag_ingest_documents")
    async def ingest_documents(
        self, 
        documents: List[Union[str, Path, Document]], 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Ingest documents into the RAG system.
        
        Args:
            documents: List of file paths, Document objects, or text content
            metadata: Optional metadata to attach to documents
            
        Returns:
            Ingestion statistics and results
        """
        try:
            processed_docs = []
            stats = {
                "total_documents": len(documents),
                "processed_documents": 0,
                "total_nodes": 0,
                "errors": []
            }
            
            for doc in documents:
                try:
                    if isinstance(doc, (str, Path)):
                        # Load document from file path
                        if Path(doc).suffix.lower() == '.pdf':
                            reader = PDFReader()
                            loaded_docs = reader.load_data(file=Path(doc))
                        else:
                            reader = SimpleDirectoryReader(input_files=[str(doc)])
                            loaded_docs = reader.load_data()
                        
                        for loaded_doc in loaded_docs:
                            if metadata:
                                loaded_doc.metadata.update(metadata)
                            processed_docs.append(loaded_doc)
                    
                    elif isinstance(doc, Document):
                        if metadata:
                            doc.metadata.update(metadata)
                        processed_docs.append(doc)
                    
                    stats["processed_documents"] += 1
                    
                except Exception as e:
                    error_msg = f"Error processing document {doc}: {str(e)}"
                    logger.error(error_msg)
                    stats["errors"].append(error_msg)
            
            if processed_docs:
                # Parse documents into nodes
                nodes = self.node_parser.get_nodes_from_documents(processed_docs)
                stats["total_nodes"] = len(nodes)
                
                # Add nodes to index
                self.index.insert_nodes(nodes)
                
                logger.info(f"Successfully ingested {len(processed_docs)} documents, {len(nodes)} nodes")
            
            return stats
            
        except Exception as e:
            logger.error(f"Document ingestion failed: {e}")
            raise RuntimeError(f"Failed to ingest documents: {e}")
    
    @with_tracing("rag_query")
    async def query(
        self, 
        query_text: str, 
        filters: Optional[Dict[str, Any]] = None,
        top_k: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Query the RAG system with advanced retrieval.
        
        Args:
            query_text: The query string
            filters: Optional metadata filters
            top_k: Number of results to retrieve
            
        Returns:
            Query results with context and metadata
        """
        try:
            if not self.query_engine:
                raise RuntimeError("RAG system not initialized")
            
            # Override top_k if specified
            if top_k:
                self.query_engine.retriever._similarity_top_k = top_k
            
            # Execute query
            response = await asyncio.to_thread(
                self.query_engine.query,
                QueryBundle(query_str=query_text)
            )
            
            # Extract source nodes and metadata
            source_nodes = []
            for node in response.source_nodes:
                source_nodes.append({
                    "content": node.node.text,
                    "metadata": node.node.metadata,
                    "score": node.score,
                    "node_id": node.node.node_id
                })
            
            return {
                "response": str(response),
                "source_nodes": source_nodes,
                "query": query_text,
                "total_sources": len(source_nodes),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"RAG query failed: {e}")
            raise RuntimeError(f"Failed to execute RAG query: {e}")
    
    async def query_with_decomposition(
        self, 
        complex_query: str,
        max_sub_queries: int = 3
    ) -> Dict[str, Any]:
        """
        Handle complex queries by decomposing them into sub-queries.
        
        Args:
            complex_query: Complex multi-part query
            max_sub_queries: Maximum number of sub-queries to generate
            
        Returns:
            Comprehensive results from sub-query synthesis
        """
        try:
            # Use LLM to decompose query
            decomposition_prompt = f"""
            Break down this complex query into {max_sub_queries} simpler, focused sub-queries:
            
            Query: {complex_query}
            
            Return only the sub-queries, one per line, without numbering or explanation.
            """
            
            decomposition_response = await asyncio.to_thread(
                self.llm.complete,
                decomposition_prompt
            )
            
            sub_queries = [
                q.strip() 
                for q in str(decomposition_response).split('\n') 
                if q.strip()
            ][:max_sub_queries]
            
            # Execute sub-queries
            sub_results = []
            for sub_query in sub_queries:
                result = await self.query(sub_query, top_k=5)
                sub_results.append({
                    "sub_query": sub_query,
                    "result": result
                })
            
            # Synthesize results
            synthesis_prompt = f"""
            Based on the following sub-query results, provide a comprehensive answer to the original query:
            
            Original Query: {complex_query}
            
            Sub-query Results:
            {json.dumps(sub_results, indent=2)}
            
            Provide a clear, comprehensive answer that synthesizes information from all relevant sub-queries.
            """
            
            synthesis_response = await asyncio.to_thread(
                self.llm.complete,
                synthesis_prompt
            )
            
            return {
                "response": str(synthesis_response),
                "original_query": complex_query,
                "sub_queries": sub_queries,
                "sub_results": sub_results,
                "synthesis_method": "llm_decomposition",
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Query decomposition failed: {e}")
            # Fallback to regular query
            return await self.query(complex_query)
    
    async def get_similar_documents(
        self, 
        query_text: str, 
        top_k: int = 5,
        include_scores: bool = True
    ) -> List[Dict[str, Any]]:
        """Get similar documents without LLM synthesis."""
        try:
            retriever = VectorIndexRetriever(
                index=self.index,
                similarity_top_k=top_k
            )
            
            nodes = await asyncio.to_thread(
                retriever.retrieve,
                QueryBundle(query_str=query_text)
            )
            
            results = []
            for node in nodes:
                result = {
                    "content": node.node.text,
                    "metadata": node.node.metadata,
                    "node_id": node.node.node_id
                }
                if include_scores:
                    result["similarity_score"] = node.score
                
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Similar document retrieval failed: {e}")
            return []
    
    async def add_document_from_text(
        self, 
        text: str, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Add a document from raw text."""
        try:
            doc = Document(text=text, metadata=metadata or {})
            await self.ingest_documents([doc])
            
            return f"Document added successfully with {len(text)} characters"
            
        except Exception as e:
            logger.error(f"Failed to add text document: {e}")
            raise RuntimeError(f"Failed to add document: {e}")
    
    async def get_index_stats(self) -> Dict[str, Any]:
        """Get statistics about the RAG index."""
        try:
            # This would require custom implementation based on pgvector
            # For now, return basic stats
            return {
                "index_type": "VectorStoreIndex",
                "vector_store": "PostgreSQL + pgvector",
                "embedding_model": "text-embedding-ada-002",
                "chunk_size": self.chunk_size,
                "chunk_overlap": self.chunk_overlap,
                "similarity_threshold": self.similarity_threshold,
                "initialized": self.index is not None
            }
            
        except Exception as e:
            logger.error(f"Failed to get index stats: {e}")
            return {"error": str(e)}


# Global RAG system instance
_rag_system: Optional[EnterpriseRAGSystem] = None


async def get_rag_system() -> EnterpriseRAGSystem:
    """Get or create the global RAG system instance."""
    global _rag_system
    
    if _rag_system is None:
        _rag_system = EnterpriseRAGSystem()
        await _rag_system.initialize()
    
    return _rag_system


async def query_knowledge_base(
    query: str, 
    top_k: int = 5,
    use_decomposition: bool = False
) -> Dict[str, Any]:
    """Convenience function for querying the knowledge base."""
    rag_system = await get_rag_system()
    
    if use_decomposition:
        return await rag_system.query_with_decomposition(query)
    else:
        return await rag_system.query(query, top_k=top_k)
