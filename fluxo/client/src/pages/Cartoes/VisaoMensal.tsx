import { useState, useEffect } from 'react';
import { useCartoes } from '@/hooks/useCartoes';
import { useRecorrencias } from '@/hooks/useRecorrencias';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { formatCurrency, getMesAbrev } from '@/lib/formatters';
import SkeletonCard from '@/components/shared/SkeletonCard';
import type { Transacao, RecorrenciaConfig } from '@/types';

export default function VisaoMensal() {
  const { cartoes, loading } = useCartoes();
  const { recorrencias } = useRecorrencias();
  const { mesAtual, anoAtual, refreshKey } = useApp();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);

  useEffect(() => {
    api.getTransacoes({}).then(setTransacoes).catch(console.error);
  }, [refreshKey]);

  if (loading) return <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>;

  // Generate 8 months ahead
  const meses: Array<{ mes: number; ano: number }> = [];
  for (let i = 0; i < 8; i++) {
    let m = mesAtual + i;
    let a = anoAtual;
    while (m > 12) { m -= 12; a++; }
    meses.push({ mes: m, ano: a });
  }

  const projetar = (cartaoId: string, mes: number, ano: number): number => {
    let total = 0;
    // Installments
    const parceladas = transacoes.filter(t => t.cartaoId === cartaoId && t.tipo === 'credito_cartao' && t.parcelamento);
    const gruposVistos = new Set<string>();
    for (const t of parceladas) {
      if (!t.parcelamento) continue;
      const gid = t.parcelamento.grupoId;
      if (gruposVistos.has(gid)) continue;
      gruposVistos.add(gid);
      const dataBase = new Date(t.data);
      const mesBase = dataBase.getMonth() + 1;
      const anoBase = dataBase.getFullYear();
      const mesesDec = (ano - anoBase) * 12 + (mes - mesBase);
      const parcela = 1 + mesesDec;
      if (parcela >= 1 && parcela <= t.parcelamento.total) total += t.valor;
    }
    // Recurrents
    const recs = recorrencias.filter(r => r.cartaoId === cartaoId && r.ativa && r.tipo === 'credito_cartao');
    total += recs.reduce((acc, r) => acc + r.valor, 0);
    return total;
  };

  const totaisPorMes = meses.map(m => ({
    ...m,
    total: cartoes.reduce((acc, c) => acc + projetar(c.id, m.mes, m.ano), 0),
  }));

  return (
    <div className="space-y-6">
      {/* Projection table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.07]">
              <th className="text-left py-3 px-3 label-mono">Cartão</th>
              {meses.map(m => (
                <th key={`${m.mes}-${m.ano}`} className="text-center py-3 px-3 label-mono">
                  {getMesAbrev(m.mes)} {m.ano !== anoAtual ? m.ano : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cartoes.map(cartao => (
              <tr key={cartao.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: cartao.cor }} />
                    <span className="text-sm font-medium">{cartao.nome}</span>
                  </div>
                </td>
                {meses.map(m => {
                  const proj = projetar(cartao.id, m.mes, m.ano);
                  const pct = (proj / cartao.limite) * 100;
                  return (
                    <td key={`${m.mes}-${m.ano}`} className="text-center py-3 px-3">
                      <span className={`font-mono text-xs ${pct > 80 ? 'text-fluxo-red' : pct > 50 ? 'text-fluxo-amber' : 'text-muted'}`}>
                        {proj > 0 ? formatCurrency(proj) : '-'}
                      </span>
                      {proj > 0 && (
                        <div className="mx-auto mt-1 w-12 h-1 rounded-full overflow-hidden bg-white/[0.05]">
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(100, pct)}%`,
                            background: pct > 80 ? '#fb7185' : pct > 50 ? '#fbbf24' : '#34d399',
                          }} />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Totals row */}
            <tr className="bg-white/[0.02]">
              <td className="py-3 px-3 font-semibold text-sm">Total</td>
              {totaisPorMes.map(m => (
                <td key={`total-${m.mes}-${m.ano}`} className="text-center py-3 px-3">
                  <span className="font-mono text-xs font-semibold text-brand-primary">
                    {m.total > 0 ? formatCurrency(m.total) : '-'}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Active installments */}
      <div className="card">
        <p className="label-mono mb-4">Parcelamentos Ativos</p>
        <div className="space-y-3">
          {transacoes
            .filter(t => t.tipo === 'credito_cartao' && t.parcelamento)
            .reduce((acc, t) => {
              if (!t.parcelamento) return acc;
              const exists = acc.find(a => a.grupoId === t.parcelamento!.grupoId);
              if (!exists) acc.push({ grupoId: t.parcelamento.grupoId, descricao: t.descricao.replace(/ — \d+\/\d+/, ''),
                total: t.parcelamento.total, atual: t.parcelamento.atual, valor: t.valor,
                valorTotal: t.parcelamento.valorTotal, cartaoId: t.cartaoId || '' });
              return acc;
            }, [] as Array<{ grupoId: string; descricao: string; total: number; atual: number; valor: number; valorTotal: number; cartaoId: string }>)
            .map(p => {
              const cartao = cartoes.find(c => c.id === p.cartaoId);
              return (
                <div key={p.grupoId} className="flex items-center gap-4 py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.descricao}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {cartao && <span className="badge text-[10px]" style={{ background: cartao.cor + '15', color: cartao.cor }}>{cartao.nome}</span>}
                      <span className="text-[10px] text-muted font-mono">{formatCurrency(p.valor)}/mês</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: p.total }, (_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full"
                        style={{ background: i + 1 < p.atual ? '#34d399' : i + 1 === p.atual ? '#fbbf24' : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                  <span className="font-mono text-xs text-muted">{formatCurrency(p.valorTotal - (p.atual * p.valor))}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
