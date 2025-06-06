import type { ReactNode } from 'react';

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  color: string;
  avatarBg: string;
  emoji: string;
  capabilities: string[];
}

export interface Prompt {
  text: string;
  icon: ReactNode;
  category: string;
  agent: string;
} 