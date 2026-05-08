import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Conta } from '@/types';

export function useContas() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setContas(await api.getContas()); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: Partial<Conta>) => {
    const nova = await api.createConta(data);
    setContas(prev => [...prev, nova]);
    return nova;
  };

  const update = async (id: string, data: Partial<Conta>) => {
    const updated = await api.updateConta(id, data);
    setContas(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  };

  const remove = async (id: string) => {
    await api.deleteConta(id);
    setContas(prev => prev.filter(c => c.id !== id));
  };

  return { contas, loading, error, refetch: fetch, create, update, remove };
}
