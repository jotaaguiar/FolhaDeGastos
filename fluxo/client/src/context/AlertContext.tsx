import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  tipo: 'success' | 'error' | 'info' | 'warn';
  mensagem: string;
  exiting?: boolean;
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

const TIPO_CONFIG = {
  success: { Icon: Check,       color: 'rgb(var(--green-rgb))',  bg: 'rgb(var(--green-rgb) / 0.15)' },
  error:   { Icon: X,           color: 'rgb(var(--red-rgb))',    bg: 'rgb(var(--red-rgb) / 0.15)' },
  warn:    { Icon: AlertCircle, color: 'rgb(var(--amber-rgb))',  bg: 'rgb(var(--amber-rgb) / 0.15)' },
  info:    { Icon: Info,        color: 'rgb(var(--blue-rgb))',   bg: 'rgb(var(--blue-rgb) / 0.15)' },
};

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    // Marca como saindo pra animar exit, depois remove
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 220);
  }, []);

  const addToast = useCallback((tipo: Toast['tipo'], mensagem: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, tipo, mensagem }]);
    setTimeout(() => removeToast(id), 3800);
  }, [removeToast]);

  return (
    <AlertContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={removeToast} />
    </AlertContext.Provider>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  // Os mais novos ficam à frente (último no array = topo da pilha visível)
  const visible = toasts.slice(-3); // até 3 toasts simultâneos
  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] flex flex-col items-center pt-3 pointer-events-none md:items-end md:right-4 md:top-4 md:inset-x-auto md:pt-0"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-2 md:items-end">
        {visible.map((toast, idx) => {
          const depth = visible.length - 1 - idx; // 0 = mais à frente
          return (
            <ToastItem
              key={toast.id}
              toast={toast}
              depth={depth}
              onDismiss={() => onDismiss(toast.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ToastItem({ toast, depth, onDismiss }: { toast: Toast; depth: number; onDismiss: () => void }) {
  const [mounted, setMounted] = useState(false);
  const { Icon, color, bg } = TIPO_CONFIG[toast.tipo];

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const baseTranslate = depth * -6; // empilha com leve offset Y
  const baseScale = 1 - depth * 0.04;

  return (
    <div
      onClick={onDismiss}
      className="pointer-events-auto cursor-pointer"
      style={{
        transform: !mounted
          ? `translateY(-24px) scale(0.92)`
          : toast.exiting
            ? `translateY(-16px) scale(0.96)`
            : `translateY(${baseTranslate}px) scale(${baseScale})`,
        opacity: !mounted || toast.exiting ? 0 : 1,
        transition: 'transform 0.32s var(--ease-ios), opacity 0.22s var(--ease-ios)',
        willChange: 'transform, opacity',
      }}
    >
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-full font-medium text-sm min-w-[200px] max-w-[90vw]"
        style={{
          background: 'rgb(var(--surface-rgb) / 0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid var(--border)',
          boxShadow: '0 10px 32px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.04) inset',
        }}
      >
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{ background: bg, color }}
        >
          <Icon size={13} strokeWidth={2.5} />
        </span>
        <span className="truncate">{toast.mensagem}</span>
      </div>
    </div>
  );
}

export const useAlert = () => useContext(AlertContext);
