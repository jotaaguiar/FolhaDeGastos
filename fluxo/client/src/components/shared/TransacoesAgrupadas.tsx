import { useMemo } from 'react';
import type { Transacao, Cartao, Conta } from '@/types';
import TransacaoRow from './TransacaoRow';
import { formatCurrency, getMesAbrev, getDiaSemana } from '@/lib/formatters';

interface TransacoesAgrupadasProps {
  transacoes: Transacao[];
  cartoes: Cartao[];
  contas: Conta[];
  onDelete?: (id: string) => void;
  onEdit?: (t: Transacao) => void;
  /** Mostra resumo (entrada/saída/líquido) no header de cada grupo */
  showDailySummary?: boolean;
}

/** Label relativa pra data: "Hoje", "Ontem", "Anteontem", "Sex, 8 mai" */
function dateLabel(isoDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(isoDate + 'T12:00:00');
  d.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays === -1) return 'Amanhã';
  if (diffDays === 2) return 'Anteontem';
  if (diffDays >= 3 && diffDays <= 6) return `${getDiaSemana(isoDate)}, ${d.getDate()} ${getMesAbrev(d.getMonth() + 1).toLowerCase()}`;
  if (diffDays >= -6 && diffDays <= -2) return `${getDiaSemana(isoDate)}, ${d.getDate()} ${getMesAbrev(d.getMonth() + 1).toLowerCase()}`;

  // Mais de uma semana — formato compacto
  const isCurrentYear = d.getFullYear() === today.getFullYear();
  return `${getDiaSemana(isoDate)}, ${d.getDate()} ${getMesAbrev(d.getMonth() + 1).toLowerCase()}${isCurrentYear ? '' : ' ' + d.getFullYear()}`;
}

export default function TransacoesAgrupadas({
  transacoes,
  cartoes,
  contas,
  onDelete,
  onEdit,
  showDailySummary = true,
}: TransacoesAgrupadasProps) {
  const grupos = useMemo(() => {
    const byDate = new Map<string, Transacao[]>();
    for (const t of transacoes) {
      if (!byDate.has(t.data)) byDate.set(t.data, []);
      byDate.get(t.data)!.push(t);
    }
    return Array.from(byDate.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([data, items]) => {
        const entradas = items.filter(i => i.tipo === 'entrada').reduce((s, i) => s + i.valor, 0);
        const saidas = items
          .filter(i => i.tipo === 'debito' || i.tipo === 'credito_cartao')
          .reduce((s, i) => s + i.valor, 0);
        return { data, items, entradas, saidas, liquido: entradas - saidas };
      });
  }, [transacoes]);

  if (grupos.length === 0) return null;

  return (
    <div className="space-y-5">
      {grupos.map(({ data, items, entradas, saidas, liquido }) => (
        <section key={data}>
          {/* Header do dia — sticky no scroll */}
          <div
            className="sticky top-14 md:top-16 z-10 flex items-center justify-between gap-3 py-2 px-1 -mx-1"
            style={{
              background: 'linear-gradient(to bottom, rgb(var(--surface-rgb)) 0%, rgb(var(--surface-rgb) / 0.95) 80%, rgb(var(--surface-rgb) / 0) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted">
              {dateLabel(data)}
            </h4>
            {showDailySummary && (entradas > 0 || saidas > 0) && (
              <div className="flex items-center gap-2 text-[10px] font-mono">
                {entradas > 0 && (
                  <span className="text-fluxo-green">+{formatCurrency(entradas)}</span>
                )}
                {saidas > 0 && (
                  <span className="text-fluxo-red">−{formatCurrency(saidas)}</span>
                )}
                {entradas > 0 && saidas > 0 && (
                  <span className={`px-1.5 py-0.5 rounded ${liquido >= 0 ? 'bg-fluxo-green/10 text-fluxo-green' : 'bg-fluxo-red/10 text-fluxo-red'}`}>
                    {liquido >= 0 ? '+' : ''}{formatCurrency(liquido)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Items do dia */}
          <div className="space-y-0.5">
            {items.map(t => (
              <TransacaoRow
                key={t.id}
                transacao={t}
                cartoes={cartoes}
                contas={contas}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
