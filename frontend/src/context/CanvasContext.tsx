import React, { createContext, useCallback, useContext, useState } from 'react';

export interface CanvasMessage {
  id?: string;
  text: string;
  sender: string;
  timestamp: string;
}

interface CanvasContextValue {
  isOpen: boolean;
  activeMessage: CanvasMessage | null;
  width: number;
  toggle: () => void;
  openWithMessage: (msg: CanvasMessage) => void;
  close: () => void;
  setWidth: (w: number) => void;
}

const CanvasContext = createContext<CanvasContextValue | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMessage, setActiveMessage] = useState<CanvasMessage | null>(null);
  const [width, setWidthState] = useState<number>(() => {
    const saved = localStorage.getItem('canvas-width');
    if (saved) return parseInt(saved, 10);
    if (typeof window !== 'undefined') {
      return Math.round(window.innerWidth * 0.6);
    }
    return 420;
  });

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const openWithMessage = useCallback((msg: CanvasMessage) => {
    setActiveMessage(msg);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const setWidth = useCallback((w: number) => {
    setWidthState(w);
    localStorage.setItem('canvas-width', w.toString());
  }, []);

  return (
    <CanvasContext.Provider
      value={{ isOpen, activeMessage, width, toggle, openWithMessage, close, setWidth }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = (): CanvasContextValue => {
  const ctx = useContext(CanvasContext);
  if (!ctx) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return ctx;
}; 