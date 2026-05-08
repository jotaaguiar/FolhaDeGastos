import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Config } from '@/types';

interface AppContextType {
  mesAtual: number;
  anoAtual: number;
  setMesAno: (mes: number, ano: number) => void;
  config: Config | null;
  atualizarConfig: (c: Partial<Config>) => void;
  refreshKey: number;
  refresh: () => void;
}

const AppContext = createContext<AppContextType>({
  mesAtual: new Date().getMonth() + 1,
  anoAtual: new Date().getFullYear(),
  setMesAno: () => {},
  config: null,
  atualizarConfig: () => {},
  refreshKey: 0,
  refresh: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mesAtual, setMes] = useState(new Date().getMonth() + 1);
  const [anoAtual, setAno] = useState(new Date().getFullYear());
  const [config, setConfig] = useState<Config | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.getConfig().then(setConfig).catch(console.error);
  }, []);

  useEffect(() => {
    document.body.className = config?.tema === 'claro' ? 'theme-claro' : '';
  }, [config?.tema]);

  const setMesAno = useCallback((mes: number, ano: number) => {
    setMes(mes);
    setAno(ano);
  }, []);

  const atualizarConfig = useCallback(async (c: Partial<Config>) => {
    try {
      const updated = await api.updateConfig(c);
      setConfig(updated);
    } catch (err) {
      console.error('Erro ao atualizar config:', err);
    }
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <AppContext.Provider value={{ mesAtual, anoAtual, setMesAno, config, atualizarConfig, refreshKey, refresh }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
