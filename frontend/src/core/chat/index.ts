/**
 * Core Chat Module
 * Exports all chat-related components, hooks, and utilities
 */

// Components
export { default as ChatInterface } from './ChatInterface';
export { default as ChatMessage } from './ChatMessage';
export { default as ChatMessageList } from './ChatMessageList';
export { default as Sidebar } from './Sidebar';
export { default as OptimizedSidebar } from './OptimizedSidebar';

// API & State Management
export * from './chat/chatApi';
export * from './chat/sessionsApi';
// Note: chatSlice, websocketSlice, streamSlice replaced by consolidated store
