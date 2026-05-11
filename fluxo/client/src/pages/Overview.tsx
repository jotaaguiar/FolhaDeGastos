import { useState, useEffect } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useContas } from '@/hooks/useContas';
import { useCartoes } from '@/hooks/useCartoes';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import type { DashboardData } from '@/types';
import AlertStrip from '@/components/shared/AlertStrip';
import QuickAdd from '@/components/shared/QuickAdd';
import ProgressBar from '@/components/shared/ProgressBar';
import FluxoLineChart from '@/components/charts/FluxoLineChart';
import DonutChart from '@/components/charts/DonutChart';
import SkeletonCard from '@/components/shared/SkeletonCard';
import PatrimonioChart from '@/components/charts/PatrimonioChart';
import BudgetRings from '@/components/shared/BudgetRings';
import AnimatedCurrency from '@/components/shared/AnimatedCurrency';
import { formatCurrency, formatDateShort } from '@/lib/formatters';
import { TrendingUp, TrendingDown, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const calcDelta = (curr: number, prev: number) =>
  prev === 0 ? null : ((curr - prev) / Math.abs(prev)) * 100;

export default function Overview() {
  const { data, loading, refetch } = useDashboard();
  const { contas } = useContas();
  const { cartoes } = useCartoes();
  const { mesAtual, anoAtual, config, setMesAno } = useApp();
  const [prevData, setPrevData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const today = new Date();
    const tM = today.getMonth() + 1;
    const tA = today.getFullYear();
    if (mesAtual !== tM || anoAtual !== tA) setMesAno(tM, tA);
  }, []);

  useEffect(() => {
    const pm = mesAtual === 1 ? 12 : mesAtual - 1;
    const pa = mesAtual === 1 ? anoAtual - 1 : anoAtual;
    api.dashboard(pm, pa).then(setPrevData).catch(() => setPrevData(null));
  }, [mesAtual, anoAtual]);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  const deltaEntradas = prevData ? calcDelta(data.totalEntradas, prevData.totalEntradas) : null;
  const deltaSaidas = prevData ? calcDelta(data.totalSaidas, prevData.totalSaidas) : null;
  const deltaSaldo = prevData ? calcDelta(data.saldoTotal, prevData.saldoTotal) : null;

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── NÍVEL 1: SALDO HERO ─────────────────────────────────── */}
      <div className="space-y-4">
        {/* Saldo total — maior destaque */}
        <div className="card card-glow-brand p-6 md:p-8">
          <p className="label-mono mb-2">Saldo Consolidado</p>
          <div className="flex items-end justify-between gap-4">
            <AnimatedCurrency
              value={data.saldoTotal}
              duration={600}
              className={`text-4xl md:text-5xl font-extrabold font-mono tracking-tight leading-none ${data.saldoTotal >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}
            />
            {deltaSaldo != null && (
              <div className={`flex items-center gap-1 text-sm font-mono mb-1 ${deltaSaldo >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                {deltaSaldo >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {Math.abs(deltaSaldo).toFixed(1)}% vs anterior
              </div>
            )}
          </div>
        </div>

        {/* Métricas secundárias */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Entradas */}
          <div className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <p className="label-mono">Entradas</p>
              <div className="w-8 h-8 rounded-lg bg-fluxo-green/10 flex items-center justify-center shrink-0">
                <ArrowUpRight size={16} className="text-fluxo-green" />
              </div>
            </div>
            <AnimatedCurrency value={data.totalEntradas} className="text-xl md:text-2xl font-extrabold font-mono text-fluxo-green" />
            {deltaEntradas != null && (
              <p className={`text-[11px] font-mono mt-1 ${deltaEntradas >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                {deltaEntradas >= 0 ? '↑' : '↓'} {Math.abs(deltaEntradas).toFixed(1)}%
              </p>
            )}
          </div>

          {/* Saídas */}
          <div className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <p className="label-mono">Saídas</p>
              <div className="w-8 h-8 rounded-lg bg-fluxo-red/10 flex items-center justify-center shrink-0">
                <ArrowDownRight size={16} className="text-fluxo-red" />
              </div>
            </div>
            <AnimatedCurrency value={data.totalSaidas} className="text-xl md:text-2xl font-extrabold font-mono text-fluxo-red" />
            {deltaSaidas != null && (
              <p className={`text-[11px] font-mono mt-1 ${deltaSaidas <= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                {deltaSaidas <= 0 ? '↓' : '↑'} {Math.abs(deltaSaidas).toFixed(1)}%
              </p>
            )}
          </div>

          {/* Limite diário — col-span 2 em mobile, 1 em md */}
          <div className="card p-4 col-span-2 md:col-span-1">
            <div className="flex items-start justify-between mb-3">
              <p className="label-mono">{config?.limiteDinamico ? 'Limite Diário (IA)' : 'Limite Diário'}</p>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${data.limiteDiarioDinamico < 50 ? 'bg-fluxo-red/10 text-fluxo-red' : 'bg-fluxo-green/10 text-fluxo-green'}`}>
                {data.limiteDiarioDinamico < 50 ? 'Baixo' : 'OK'}
              </span>
            </div>
            <p className={`text-xl md:text-2xl font-extrabold font-mono ${data.limiteDiarioDinamico < 50 ? 'text-fluxo-red' : 'text-fluxo-green'}`}>
              {formatCurrency(data.limiteDiarioDinamico)}
            </p>
            {data.detalhesLimiteDiario && (
              <div className="mt-2 space-y-1">
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-primary h-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (data.detalhesLimiteDiario.valorPorDia / (config?.limiteDiarioPadrao || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted font-mono">{data.detalhesLimiteDiario.diasRestantes} dias restantes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alertas */}
      {data.alertas.length > 0 && (
        <div className="space-y-2">
          {data.alertas.map((a, i) => <AlertStrip key={i} {...a} />)}
        </div>
      )}

      {/* Quick Add — desktop only (mobile usa FAB) */}
      <div className="hidden md:block">
        <QuickAdd contas={contas} cartoes={cartoes} onAdded={refetch} />
      </div>

      {/* ── NÍVEL 2: ANÁLISE ────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="section-label label-mono text-xs">Análise do Período</h3>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="card lg:col-span-2">
            <p className="label-mono mb-4">Patrimônio — 6 meses</p>
            <PatrimonioChart data={data.patrimonioHistorico} />
          </div>
          <div className="card lg:col-span-2">
            <p className="label-mono mb-4">Distribuição 50/30/20</p>
            <BudgetRings data={data.regra503020} />
            <div className="mt-4 pt-3 border-t border-white/[0.05] flex justify-between">
              {[
                { label: 'Necessidades', color: 'bg-brand-primary' },
                { label: 'Desejos', color: 'bg-amber-400' },
                { label: 'Poupança', color: 'bg-emerald-400' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-[10px] text-muted uppercase font-mono">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-2">
            <p className="label-mono mb-4">Fluxo de Saldo — Real + 30 dias projetado</p>
            <FluxoLineChart data={[
              ...(data.saldoDiario || []).map(d => {
                const dateStr = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(d.dia).padStart(2, '0')}`;
                const isFuture = new Date(dateStr) > new Date();
                return { ...d, data: dateStr, tipo: (isFuture ? 'projetado' : 'real') as any };
              }),
              ...(data.projecaoDiaria30Dias || []).filter(p => {
                const pDate = new Date(p.data);
                return pDate.getMonth() + 1 !== mesAtual || pDate.getFullYear() !== anoAtual;
              }).map(p => ({ ...p, tipo: 'projetado' as any }))
            ]} />
          </div>
          <div className="card">
            <p className="label-mono mb-4">Gastos por Categoria</p>
            <DonutChart data={data.gastosPorCategoria} />
          </div>
        </div>
      </div>

      {/* ── NÍVEL 3: DETALHES ───────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="section-label label-mono text-xs">Detalhes</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Contas */}
          <div className="card">
            <p className="label-mono mb-4">Contas</p>
            <div className="space-y-3">
              {data.contasSaldo.map(({ conta, saldoAtual }) => (
                <div key={conta.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: conta.cor + '20', color: conta.cor }}>
                    {conta.banco[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conta.nome}</p>
                    <ProgressBar value={Math.max(0, saldoAtual)} max={Math.max(...data.contasSaldo.map(c => c.saldoAtual), 1)}
                      color={conta.cor} height={3} />
                  </div>
                  <span className={`font-mono text-sm shrink-0 ${saldoAtual >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                    {formatCurrency(saldoAtual)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Próximas saídas */}
          <div className="card">
            <p className="label-mono mb-4">Próximas Saídas</p>
            <div className="space-y-1 max-h-[220px] overflow-y-auto">
              {data.proximasSaidas.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">Sem saídas próximas</p>
              ) : (
                data.proximasSaidas.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                    <div className="min-w-0 mr-3">
                      <p className="text-sm truncate">{t.descricao}</p>
                      <p className="text-[10px] text-muted font-mono">{formatDateShort(t.data)}</p>
                    </div>
                    <span className="font-mono text-sm text-fluxo-red shrink-0">-{formatCurrency(t.valor)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Faturas abertas */}
          <div className="card">
            <p className="label-mono mb-4">Faturas Abertas</p>
            <div className="space-y-3">
              {data.faturasAbertas.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">Sem faturas abertas</p>
              ) : (
                data.faturasAbertas.map(fa => (
                  <div key={fa.fatura.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: fa.cartao.cor + '20' }}>
                      <CreditCard size={14} style={{ color: fa.cartao.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fa.cartao.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <ProgressBar value={fa.total} max={fa.cartao.limite} height={3} />
                        <span className={`text-[10px] font-mono whitespace-nowrap shrink-0 ${fa.diasParaVencer <= 3 ? 'text-fluxo-red' : 'text-muted'}`}>
                          {fa.diasParaVencer > 0 ? `${fa.diasParaVencer}d` : 'Vencida'}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-fluxo-amber shrink-0">{formatCurrency(fa.total)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
