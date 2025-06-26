import { useState, useEffect, useCallback } from 'react';
import {
  fetchMpcServers,
  createMpcServer,
  updateMpcServer,
  deleteMpcServer,
  restartMpcServer
} from '../api/mpcServersApi';

interface MpcServer {
  id: string | number;
  name: string;
  host: string;
  status: string;
  lastSeen: string;
}

export function useMpcServers() {
  const [servers, setServers] = useState<MpcServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const loadServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMpcServers();
      setServers(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const create = async (payload: any) => {
    const newServer = await createMpcServer(payload);
    setServers((prev) => [...prev, newServer]);
  };
  const update = async (id: string | number, payload: any) => {
    const updated = await updateMpcServer(id, payload);
    setServers((prev) => prev.map(s => s.id === id ? updated : s));
  };
  const remove = async (id: string | number) => {
    await deleteMpcServer(id);
    setServers((prev) => prev.filter(s => s.id !== id));
  };
  const restart = async (id: string | number) => {
    const restarted = await restartMpcServer(id);
    setServers((prev) => prev.map(s => s.id === id ? { ...s, ...restarted } : s));
  };

  return {
    servers,
    loading,
    error,
    reload: loadServers,
    create,
    update,
    remove,
    restart,
  };
} 