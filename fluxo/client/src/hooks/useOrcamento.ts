import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { OrcamentoCategoria } from '@/types';

export function useOrcamento() {
  const { mesAtual, anoAtual, refreshKey } = useApp();
  const [orcamento, setOrcamento] = useState<(OrcamentoCategoria & { gasto: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getOrcamento(mesAtual, anoAtual);
      setOrcamento(data);
      setError(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
    finally { setLoading(false); }
  }, [mesAtual, anoAtual, refreshKey]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: Partial<OrcamentoCategoria>) => {
    const novo = await api.createOrcamento({ ...data, mes: mesAtual, ano: anoAtual });
    await fetch();
    return novo;
  };

  const update = async (id: string, data: Partial<OrcamentoCategoria>) => {
    await api.updateOrcamento(id, data);
    await fetch();
  };

  const remove = async (id: string) => {
    await api.deleteOrcamento(id);
    setOrcamento(prev => prev.filter(o => o.id !== id));
  };

  return { orcamento, loading, error, refetch: fetch, create, update, remove };
}
