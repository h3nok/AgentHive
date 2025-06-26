import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppDispatch } from '@/store';
import { websocketError } from '@/features/chat/websocketSlice';

export interface TaskMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
}

export type TaskStatus = 'running' | 'paused' | 'completed' | 'error';

interface UseTaskStreamReturn {
  messages: TaskMessage[];
  status: TaskStatus;
  send: (text: string) => void;
}

/**
 * useTaskStream – lightweight hook encapsulating WebSocket task stream lifecycle.
 * Maintains local fallback state while pushing status to Redux for global sync.
 */
const useTaskStream = (taskId: string): UseTaskStreamReturn => {
  const dispatch = useAppDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [status, setStatus] = useState<TaskStatus>('running');

  useEffect(() => {
    if (!taskId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/v1/tasks/${taskId}/stream`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.debug('[TaskStream] connected', taskId);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'token': {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.id === data.messageId) {
                last.content += data.content;
                return [...prev.slice(0, -1), last];
              }
              return [
                ...prev,
                {
                  id: data.messageId,
                  role: data.role ?? 'agent',
                  content: data.content,
                  timestamp: new Date().toISOString(),
                },
              ];
            });
            break;
          }
          case 'status': {
            setStatus(data.status as TaskStatus);
            break;
          }
          case 'error': {
            setStatus('error');
            dispatch(websocketError(data.message));
            break;
          }
          default:
            console.warn('[TaskStream] unknown payload', data);
        }
      } catch (e) {
        console.error('[TaskStream] parse error', e);
      }
    };

    wsRef.current.onerror = (e) => {
      console.error('[TaskStream] error', e);
      setStatus('error');
    };

    wsRef.current.onclose = () => {
      console.debug('[TaskStream] closed');
    };

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [taskId, dispatch]);

  const send = useCallback(
    (text: string) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'user_input', content: text }));
      }
    },
    []
  );

  return { messages, status, send };
};

export default useTaskStream;
