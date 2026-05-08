import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Meta } from '@/types';

export function useMetas() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setMetas(await api.getMetas()); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: Partial<Meta>) => {
    const nova = await api.createMeta(data);
    setMetas(prev => [...prev, nova]);
    return nova;
  };

  const depositar = async (id: string, valor: number, observacao?: string) => {
    const updated = await api.depositarMeta(id, { valor, observacao });
    setMetas(prev => prev.map(m => m.id === id ? updated : m));
    return updated;
  };

  const update = async (id: string, data: Partial<Meta>) => {
    const updated = await api.updateMeta(id, data);
    setMetas(prev => prev.map(m => m.id === id ? updated : m));
    return updated;
  };

  const remove = async (id: string) => {
    await api.deleteMeta(id);
    setMetas(prev => prev.filter(m => m.id !== id));
  };

  return { metas, loading, error, refetch: fetch, create, update, depositar, remove };
}
