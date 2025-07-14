#!/usr/bin/env python
"""Test script for new agent routing."""

import sys
import asyncio
import uuid
sys.path.append('.')

from app.api.v1.deps import get_router_chain
from app.domain.schemas import RequestContext, PromptIn

async def test_routing():
    """Test routing with fresh queries."""
    router = await get_router_chain()
    
    test_queries = [
        'Could you assist me with a password recovery?',
        'I want to file my travel expenses from last week', 
        'How much money do I have left in my expense allocation?',
        'Please help with my reimbursement claim',
        'My laptop is not working properly',
        'I need help with UKG time-off submission'
    ]
    
    for query in test_queries:
        session_id = f'fresh-session-{uuid.uuid4()}'
        request_id = f'fresh-request-{uuid.uuid4()}'
        
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
    asyncio.run(test_routing())
