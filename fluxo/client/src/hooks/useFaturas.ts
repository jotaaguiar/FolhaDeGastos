import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { Fatura, Transacao } from '@/types';

export function useFaturas(cartaoId?: string) {
  const { mesAtual, anoAtual, refreshKey } = useApp();
  const [faturas, setFaturas] = useState<(Fatura & { total: number; cartao?: import('@/types').Cartao; limiteUsadoTotal: number; limiteDisponivelReal: number; limiteDisponivelProjetado: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getFaturas({ cartaoId, mes: mesAtual, ano: anoAtual });
      setFaturas(data);
      setError(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
    finally { setLoading(false); }
  }, [cartaoId, mesAtual, anoAtual, refreshKey]);

  useEffect(() => { fetch(); }, [fetch]);

  const getFaturaTransacoes = async (faturaId: string): Promise<Transacao[]> => {
    return api.getFaturaTransacoes(faturaId);
  };

  const pagar = async (faturaId: string, contaPagamentoId: string) => {
    await api.pagarFatura(faturaId, { contaPagamentoId });
    await fetch();
  };

  return { faturas, loading, error, refetch: fetch, getFaturaTransacoes, pagar };
}
