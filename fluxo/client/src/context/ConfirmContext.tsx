import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmContextType {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({ confirm: async () => false });

interface State {
  message: string;
  options: ConfirmOptions;
  resolve: (v: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);

  const confirm = useCallback((message: string, options: ConfirmOptions = {}) =>
    new Promise<boolean>(resolve => setState({ message, options, resolve })), []);

  const close = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => close(false)}
        >
          <div
            className="bg-surface border border-white/[0.07] rounded-2xl p-6 w-full max-w-sm animate-slide-up shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${state.options.danger ? 'bg-fluxo-red/10' : 'bg-white/5'}`}>
                <AlertTriangle size={18} className={state.options.danger ? 'text-fluxo-red' : 'text-muted'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1">{state.options.title ?? 'Confirmação'}</p>
                <p className="text-sm text-muted leading-relaxed">{state.message}</p>
              </div>
              <button onClick={() => close(false)} className="text-muted hover:text-white transition-colors shrink-0 mt-0.5">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => close(false)} className="btn-ghost text-sm px-4 py-2">
                {state.options.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                onClick={() => close(true)}
                className={`text-sm px-4 py-2 rounded-lg font-medium transition-all ${
                  state.options.danger
                    ? 'bg-fluxo-red/10 text-fluxo-red hover:bg-fluxo-red/20 border border-fluxo-red/20'
                    : 'btn-primary'
                }`}
              >
                {state.options.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
