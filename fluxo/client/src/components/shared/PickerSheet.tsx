import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface PickerOption {
  id: string;
  label: string;
  sublabel?: string;
  color?: string;
  icon?: React.ReactNode;
}

interface PickerSheetProps {
  options: PickerOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  title?: string;
  /** Classe extra no botão trigger (parece input) */
  className?: string;
}

/**
 * Picker estilo iOS: o trigger parece um input. Tap abre bottom-sheet sobreposto
 * com a lista visual (cor + label + sublabel). Substitui <select> nativo quando
 * queremos exibir cor da conta/cartão.
 */
export default function PickerSheet({ options, value, onChange, placeholder = 'Selecionar...', title = 'Selecionar', className = '' }: PickerSheetProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`input-dark w-full flex items-center justify-between gap-2 active:scale-[0.99] ${className}`}
        style={{ transition: 'transform 0.15s var(--ease-ios), border-color 0.2s var(--ease-ios)' }}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {selected ? (
            <>
              {selected.color && (
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: selected.color }} />
              )}
              {selected.icon}
              <span className="truncate text-left">{selected.label}</span>
              {selected.sublabel && (
                <span className="text-[10px] text-muted font-mono truncate hidden sm:inline">{selected.sublabel}</span>
              )}
            </>
          ) : (
            <span className="text-muted">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={14} className="text-muted shrink-0" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center animate-fade-in"
          style={{ background: 'var(--modal-backdrop)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="modal-sheet p-0 w-full md:max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-3 sticky top-0" style={{ background: 'rgb(var(--surface-rgb))' }}>
              <h3 className="text-base font-bold tracking-tight">{title}</h3>
            </div>
            <div className="px-2 pb-3 max-h-[60vh] overflow-y-auto">
              {options.length === 0 ? (
                <p className="text-sm text-muted py-6 text-center">Nenhuma opção disponível</p>
              ) : (
                options.map(o => {
                  const isActive = o.id === value;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => { onChange(o.id); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg active:scale-[0.985] ${isActive ? 'bg-brand-primary/10' : 'hover:bg-white/[0.03]'}`}
                      style={{ transition: 'background 0.15s var(--ease-ios), transform 0.12s var(--ease-ios)' }}
                    >
                      {o.color && (
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: o.color + '22', color: o.color }}
                        >
                          {o.label[0]?.toUpperCase()}
                        </span>
                      )}
                      {o.icon && <span className="shrink-0">{o.icon}</span>}
                      <span className="flex-1 min-w-0 text-left">
                        <span className={`block text-sm font-medium truncate ${isActive ? 'text-brand-primary' : ''}`}>
                          {o.label}
                        </span>
                        {o.sublabel && (
                          <span className="block text-[11px] text-muted font-mono truncate">{o.sublabel}</span>
                        )}
                      </span>
                      {isActive && <Check size={16} className="text-brand-primary shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
