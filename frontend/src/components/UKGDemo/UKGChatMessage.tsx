import React from 'react';
import { ChatMessage as ChatMessageType } from '../../features/chat/chatSlice';
import { HRAgentForm } from './HRAgentForm';
import { HRAgentTypingIndicator } from './HRAgentTypingIndicator';
import MarkdownRenderer from '../markdown/MarkdownRenderer';
import { preprocessMarkdown } from '../../utils/preprocessMarkdown';

interface UKGChatMessageProps {
  message: ChatMessageType;
}

export const UKGChatMessage: React.FC<UKGChatMessageProps> = ({ message }) => {
  // Handle system messages (status type)
  if (message.type === 'status') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {message.content}
        </div>
      </div>
    );
  }

  // Handle HR Agent messages
  if (message.agent === 'HR Agent') {
    return (
      <div className="flex items-start space-x-3 mb-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">HR</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-green-700">HR Agent</span>
            <span className="text-xs text-gray-500">{message.timestamp}</span>
          </div>
          
          {/* Check if this is a form message */}
          {message.content.includes('Please fill out the following information') ? (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <MarkdownRenderer markdown={preprocessMarkdown(message.content)} />
                <HRAgentForm />
              </div>
            </div>
          ) : message.content.includes('typing...') ? (
            <HRAgentTypingIndicator />
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <MarkdownRenderer markdown={preprocessMarkdown(message.content)} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // For all other messages, render normally
  return (
    <div className={`flex items-start space-x-3 mb-4 ${
      message.sender === 'user' ? 'justify-end' : ''
    }`}>
      {message.sender !== 'user' && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-bold text-sm">
              {message.agent ? message.agent.substring(0, 2) : 'AI'}
            </span>
          </div>
        </div>
      )}
      <div className={`flex-1 ${message.sender === 'user' ? 'max-w-xs' : ''}`}>
        {message.sender !== 'user' && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-gray-700">
              {message.agent || 'Assistant'}
            </span>
            <span className="text-xs text-gray-500">{message.timestamp}</span>
          </div>
        )}
        <div className={`rounded-lg p-3 ${
          message.sender === 'user'
            ? 'bg-blue-500 text-white ml-auto'
            : 'bg-gray-100 text-gray-700'
        }`}>
          <MarkdownRenderer markdown={preprocessMarkdown(message.content)} />
        </div>
      </div>
      {message.sender === 'user' && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">U</span>
          </div>
        </div>
      )}
    </div>
  );
};