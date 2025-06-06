import { useState, useEffect, useCallback } from 'react';
import {
  fetchMpcServers,
  createMpcServer,
  updateMpcServer,
  deleteMpcServer,
  restartMpcServer
} from '../api/mpcServersApi';

export function useMpcServers() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const create = async (payload) => {
    const newServer = await createMpcServer(payload);
    setServers((prev) => [...prev, newServer]);
  };
  const update = async (id, payload) => {
    const updated = await updateMpcServer(id, payload);
    setServers((prev) => prev.map(s => s.id === id ? updated : s));
  };
  const remove = async (id) => {
    await deleteMpcServer(id);
    setServers((prev) => prev.filter(s => s.id !== id));
  };
  const restart = async (id) => {
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