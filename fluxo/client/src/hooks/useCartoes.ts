import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { Cartao } from '@/types';

export function useCartoes() {
  const { mesAtual, anoAtual, refreshKey } = useApp();
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setCartoes(await api.getCartoes(mesAtual, anoAtual)); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
    finally { setLoading(false); }
  }, [mesAtual, anoAtual]);

  useEffect(() => { fetch(); }, [fetch, refreshKey]);

  const create = async (data: Partial<Cartao>, initialConfig?: any) => {
    const novo = await api.createCartao({ ...data, initialConfig } as any);
    setCartoes(prev => [...prev, novo]);
    return novo;
  };

  const update = async (id: string, data: Partial<Cartao>) => {
    const updated = await api.updateCartao(id, data);
    setCartoes(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  };

  const remove = async (id: string) => {
    await api.deleteCartao(id);
    setCartoes(prev => prev.filter(c => c.id !== id));
  };

  return { cartoes, loading, error, refetch: fetch, create, update, remove };
}
