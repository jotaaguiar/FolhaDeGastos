import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import type { DashboardData } from '@/types';

export function useDashboard() {
  const { mesAtual, anoAtual, refreshKey } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.dashboard(mesAtual, anoAtual);
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  }, [mesAtual, anoAtual, refreshKey]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
