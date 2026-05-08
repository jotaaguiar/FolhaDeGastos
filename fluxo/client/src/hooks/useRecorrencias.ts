import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { RecorrenciaConfig } from '@/types';

export function useRecorrencias() {
  const [recorrencias, setRecorrencias] = useState<RecorrenciaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setRecorrencias(await api.getRecorrencias()); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: Partial<RecorrenciaConfig>) => {
    const nova = await api.createRecorrencia(data);
    setRecorrencias(prev => [...prev, nova]);
    return nova;
  };

  const toggle = async (id: string) => {
    const updated = await api.toggleRecorrencia(id);
    setRecorrencias(prev => prev.map(r => r.id === id ? updated : r));
  };

  const update = async (id: string, data: Partial<RecorrenciaConfig>) => {
    const updated = await api.updateRecorrencia(id, data);
    setRecorrencias(prev => prev.map(r => r.id === id ? updated : r));
    return updated;
  };

  const remove = async (id: string) => {
    await api.deleteRecorrencia(id);
    setRecorrencias(prev => prev.filter(r => r.id !== id));
  };

  return { recorrencias, loading, error, refetch: fetch, create, update, toggle, remove };
}
