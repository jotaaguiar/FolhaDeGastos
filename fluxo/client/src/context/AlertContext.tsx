import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  tipo: 'success' | 'error' | 'info' | 'warn';
  mensagem: string;
}

interface AlertContextType {
  toasts: Toast[];
  addToast: (tipo: Toast['tipo'], mensagem: string) => void;
  removeToast: (id: string) => void;
}

const AlertContext = createContext<AlertContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((tipo: Toast['tipo'], mensagem: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, tipo, mensagem }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <AlertContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`animate-slide-up px-4 py-3 rounded-lg shadow-lg border border-white/10 font-mono text-sm flex items-center gap-2 cursor-pointer ${
              toast.tipo === 'success' ? 'bg-fluxo-green/20 text-fluxo-green' :
              toast.tipo === 'error' ? 'bg-fluxo-red/20 text-fluxo-red' :
              toast.tipo === 'warn' ? 'bg-fluxo-amber/20 text-fluxo-amber' :
              'bg-fluxo-blue/20 text-fluxo-blue'
            }`}
            onClick={() => removeToast(toast.id)}
          >
            <span>{toast.tipo === 'success' ? '✓' : toast.tipo === 'error' ? '✕' : toast.tipo === 'warn' ? '⚠' : 'ℹ'}</span>
            {toast.mensagem}
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);
