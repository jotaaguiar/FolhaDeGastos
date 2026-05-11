import { Delete } from 'lucide-react';

interface AmountPadProps {
  /** Valor em CENTAVOS (inteiro). Ex: 1250 = R$ 12,50 */
  cents: number;
  onChange: (cents: number) => void;
  /** Quando true, mostra teclado compacto. False = teclado padrão. */
  compact?: boolean;
}

const KEYS: Array<{ label: string; value: string }> = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '00', value: '00' },
  { label: '0', value: '0' },
  { label: 'del', value: 'del' },
];

export default function AmountPad({ cents, onChange, compact = false }: AmountPadProps) {
  const press = (v: string) => {
    if (v === 'del') {
      onChange(Math.floor(cents / 10));
      return;
    }
    // Limita a 999.999.999,99 (~1 bilhão)
    if (cents >= 99999999999) return;
    if (v === '00') {
      onChange(cents * 100);
    } else {
      onChange(cents * 10 + parseInt(v, 10));
    }
  };

  return (
    <div
      className={`grid grid-cols-3 ${compact ? 'gap-1.5' : 'gap-2'} select-none`}
      role="group"
      aria-label="Teclado numérico"
    >
      {KEYS.map(k => (
        <button
          key={k.label}
          type="button"
          onClick={() => press(k.value)}
          aria-label={k.value === 'del' ? 'Apagar' : k.label}
          className={`relative ${compact ? 'h-11' : 'h-14'} rounded-xl flex items-center justify-center active:scale-[0.94]`}
          style={{
            background: 'var(--overlay-subtle)',
            border: '1px solid var(--border)',
            transition: 'background 0.15s var(--ease-ios), transform 0.12s var(--ease-ios)',
          }}
          onPointerDown={(e) => {
            // Feedback de hover/press extra
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--overlay-hover)';
          }}
          onPointerUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--overlay-subtle)';
          }}
          onPointerLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--overlay-subtle)';
          }}
        >
          {k.value === 'del' ? (
            <Delete size={compact ? 18 : 20} className="text-muted" />
          ) : (
            <span className={`${compact ? 'text-lg' : 'text-xl'} font-mono font-semibold tracking-tight`}>
              {k.label}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
