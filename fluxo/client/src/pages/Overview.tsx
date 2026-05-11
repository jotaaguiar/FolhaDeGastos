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
import HeroCarousel from '@/components/shared/HeroCarousel';
import ScoreRing from '@/components/shared/ScoreRing';
import { formatCurrency, formatDateShort } from '@/lib/formatters';
import { TrendingUp, TrendingDown, CreditCard, ArrowUpRight, ArrowDownRight, Wallet, Award, PiggyBank } from 'lucide-react';

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

      {/* ── NÍVEL 1: HERO CAROUSEL ───────────────────────────── */}
      <div className="space-y-4">
        <HeroCarousel
          slides={[
            {
              key: 'saldo',
              content: (
                <div className="card card-glow-brand p-6 md:p-8">
                  <div className="flex items-center justify-between mb-2">
                    <p className="label-mono">Saldo Consolidado</p>
                    <Wallet size={14} className="text-muted" />
                  </div>
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
              ),
            },
            {
              key: 'taxa-poupanca',
              content: (
                <div className="card p-6 md:p-8" style={{ boxShadow: '0 0 40px rgba(52, 211, 153, 0.08)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="label-mono">Taxa de Poupança</p>
                    <PiggyBank size={14} className="text-muted" />
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <p className={`text-4xl md:text-5xl font-extrabold font-mono tracking-tight leading-none ${data.taxaPoupanca >= 20 ? 'text-fluxo-green' : data.taxaPoupanca >= 10 ? 'text-fluxo-amber' : 'text-fluxo-red'}`}>
                      {data.taxaPoupanca.toFixed(1)}<span className="text-2xl md:text-3xl text-muted">%</span>
                    </p>
                    <div className="text-right text-[11px] font-mono text-muted leading-tight">
                      <p>do que entrou,</p>
                      <p>sobrou em caixa</p>
                    </div>
                  </div>
                  <div className="mt-4 w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${data.taxaPoupanca >= 20 ? 'bg-fluxo-green' : data.taxaPoupanca >= 10 ? 'bg-fluxo-amber' : 'bg-fluxo-red'}`}
                      style={{
                        width: `${Math.min(100, Math.max(0, data.taxaPoupanca))}%`,
                        transition: 'width 0.7s var(--ease-ios)',
                      }}
                    />
                  </div>
                </div>
              ),
            },
            {
              key: 'score',
              content: (
                <div className="card card-glow-brand p-6 md:p-8">
                  <div className="flex items-center justify-between mb-2">
                    <p className="label-mono">Score Financeiro</p>
                    <Award size={14} className="text-muted" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className={`text-4xl md:text-5xl font-extrabold font-mono tracking-tight leading-none ${data.score >= 85 ? 'text-fluxo-green' : data.score >= 70 ? 'text-fluxo-blue' : data.score >= 50 ? 'text-fluxo-amber' : 'text-fluxo-red'}`}>
                        {data.score}
                      </p>
                      <p className="text-sm font-mono text-muted mt-1">{data.scoreLabel}</p>
                    </div>
                    <ScoreRing score={data.score} size={72} />
                  </div>
                </div>
              ),
            },
          ]}
        />

        {/* Trilho composto de métricas — uma única superfície com divisores hairline */}
        <div className="card p-0 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-3">
            {/* Entradas */}
            <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-white/[0.05]">
              <div className="flex items-center justify-between mb-2">
                <p className="label-mono">Entradas</p>
                <ArrowUpRight size={14} className="text-fluxo-green" />
              </div>
              <AnimatedCurrency value={data.totalEntradas} className="text-xl md:text-2xl font-extrabold font-mono text-fluxo-green block" />
              {deltaEntradas != null && (
                <p className={`text-[11px] font-mono mt-1 ${deltaEntradas >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                  {deltaEntradas >= 0 ? '↑' : '↓'} {Math.abs(deltaEntradas).toFixed(1)}% vs anterior
                </p>
              )}
            </div>

            {/* Saídas */}
            <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-white/[0.05]">
              <div className="flex items-center justify-between mb-2">
                <p className="label-mono">Saídas</p>
                <ArrowDownRight size={14} className="text-fluxo-red" />
              </div>
              <AnimatedCurrency value={data.totalSaidas} className="text-xl md:text-2xl font-extrabold font-mono text-fluxo-red block" />
              {deltaSaidas != null && (
                <p className={`text-[11px] font-mono mt-1 ${deltaSaidas <= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                  {deltaSaidas <= 0 ? '↓' : '↑'} {Math.abs(deltaSaidas).toFixed(1)}% vs anterior
                </p>
              )}
            </div>

            {/* Limite diário */}
            <div className="p-4 md:p-5 col-span-2 md:col-span-1">
              <div className="flex items-center justify-between mb-2">
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
                      className="bg-brand-primary h-full"
                      style={{
                        width: `${Math.min(100, (data.detalhesLimiteDiario.valorPorDia / (config?.limiteDiarioPadrao || 1)) * 100)}%`,
                        transition: 'width 0.7s var(--ease-ios)',
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted font-mono">{data.detalhesLimiteDiario.diasRestantes} dias restantes</p>
                </div>
              )}
            </div>
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
          {(config?.regra503020Ativa ?? true) && (
            <div className="card lg:col-span-2">
              <p className="label-mono mb-4">
                Distribuição {config?.regra503020Necessidades ?? 50}/{config?.regra503020Desejos ?? 30}/{config?.regra503020Poupanca ?? 20}
              </p>
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
          )}
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
