#!/usr/bin/env python
"""Test script for new agent routing with fresh queries."""

import sys
import asyncio
import uuid
sys.path.append('.')

from app.api.v1.deps import get_router_chain
from app.domain.schemas import RequestContext, PromptIn

async def test_fresh_routing():
    """Test routing with completely fresh queries."""
    router = await get_router_chain()
    
    # Use completely different phrasing to avoid cache hits
    test_queries = [
        'Can you reset my company account password please?',
        'I need assistance filing business travel receipts', 
        'What is my remaining budget for monthly expenses?',
        'Help me process a refund request for conference fees',
        'My work computer has a blue screen error',
        'I want to request vacation days through the system'
    ]
    
    for query in test_queries:
        session_id = f'new-session-{uuid.uuid4()}'
        request_id = f'new-request-{uuid.uuid4()}'
        
        prompt = PromptIn(
            prompt=query, 
            session_id=session_id,
            max_tokens=2000,
            temperature=0.7,
            stream=False
        )
        context = RequestContext(
            request_id=request_id,
            prompt=prompt,
            user_id='test-user',
            metadata={}
        )
        
        result = await router.route(context)
        selected_agent = result.metadata.get('selected_agent', 'unknown')
        
        print(f'Query: "{query}"')
        print(f'  -> Agent: {selected_agent} (confidence: {result.confidence:.2f})')
        print(f'  -> Intent: {result.intent}')
        print(f'  -> Method: {result.routing_method.value}')
        print()

if __name__ == "__main__":
    asyncio.run(test_fresh_routing())
