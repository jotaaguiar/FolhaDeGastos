import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { Transacao } from '@/types';

export function useTransacoes(params?: { contaId?: string; cartaoId?: string; categoria?: string; tipo?: string }) {
  const { mesAtual, anoAtual, refreshKey } = useApp();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTransacoes({ mes: mesAtual, ano: anoAtual, ...params });
      setTransacoes(data);
      setError(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
    finally { setLoading(false); }
  }, [mesAtual, anoAtual, refreshKey, params?.contaId, params?.cartaoId, params?.categoria, params?.tipo]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: Partial<Transacao>) => {
    const nova = await api.createTransacao(data);
    setTransacoes(prev => [nova, ...prev]);
    return nova;
  };

  const update = async (id: string, data: Partial<Transacao>) => {
    const updated = await api.updateTransacao(id, data);
    setTransacoes(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const remove = async (id: string) => {
    await api.deleteTransacao(id);
    setTransacoes(prev => prev.filter(t => t.id !== id));
  };

  return { transacoes, loading, error, refetch: fetch, create, update, remove };
}
