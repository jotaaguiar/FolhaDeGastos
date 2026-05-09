import { useState, useEffect } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useContas } from '@/hooks/useContas';
import { useCartoes } from '@/hooks/useCartoes';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import type { DashboardData } from '@/types';
import MetricCard from '@/components/shared/MetricCard';
import AlertStrip from '@/components/shared/AlertStrip';
import QuickAdd from '@/components/shared/QuickAdd';
import ProgressBar from '@/components/shared/ProgressBar';
import FluxoLineChart from '@/components/charts/FluxoLineChart';
import DonutChart from '@/components/charts/DonutChart';
import TransacaoRow from '@/components/shared/TransacaoRow';
import SkeletonCard from '@/components/shared/SkeletonCard';
import PatrimonioChart from '@/components/charts/PatrimonioChart';
import BudgetRings from '@/components/shared/BudgetRings';
import { formatCurrency, formatPercent, formatDateShort } from '@/lib/formatters';
import { TrendingUp, TrendingDown, CreditCard, Shield } from 'lucide-react';

const calcDelta = (curr: number, prev: number) =>
  prev === 0 ? null : ((curr - prev) / Math.abs(prev)) * 100;

export default function Overview() {
  const { data, loading, refetch } = useDashboard();
  const { contas } = useContas();
  const { cartoes } = useCartoes();
  const { mesAtual, anoAtual, config, setMesAno } = useApp();
  const [prevData, setPrevData] = useState<DashboardData | null>(null);

  // Lock to current month when mounting Overview
  useEffect(() => {
    const today = new Date();
    const tM = today.getMonth() + 1;
    const tA = today.getFullYear();
    // Only update if different to avoid unnecessary refetches
    if (mesAtual !== tM || anoAtual !== tA) {
      setMesAno(tM, tA);
    }
  }, []);

  useEffect(() => {
    const pm = mesAtual === 1 ? 12 : mesAtual - 1;
    const pa = mesAtual === 1 ? anoAtual - 1 : anoAtual;
    api.dashboard(pm, pa).then(setPrevData).catch(() => setPrevData(null));
  }, [mesAtual, anoAtual]);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero + Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-6 col-span-1 card-glow-brand">
          <p className="label-mono mb-1">Saldo Total</p>
          <p className={`text-3xl font-extrabold font-mono tracking-tight ${data.saldoTotal >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
            {formatCurrency(data.saldoTotal)}
          </p>
          <p className="text-xs text-muted mt-1 font-mono">Consolidado</p>
          {prevData != null && (() => {
            const d = calcDelta(data.saldoTotal, prevData.saldoTotal);
            return d != null ? (
              <p className={`text-[10px] font-mono mt-0.5 ${d >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                {d >= 0 ? '↑' : '↓'} {Math.abs(d).toFixed(1)}% vs anterior
              </p>
            ) : null;
          })()}
        </div>
        <MetricCard label="Entradas" value={formatCurrency(data.totalEntradas)} color="green"
          sub={`${data.contasSaldo.length} contas`}
          delta={prevData ? calcDelta(data.totalEntradas, prevData.totalEntradas) : null} />
        <MetricCard label="Saídas" value={formatCurrency(data.totalSaidas)} color="red"
          sub="Débitos do mês" invertDelta
          delta={prevData ? calcDelta(data.totalSaidas, prevData.totalSaidas) : null} />
        <MetricCard 
          label={config?.limiteDinamico ? "Limite Diário (IA)" : "Limite Diário"} 
          value={formatCurrency(data.limiteDiarioDinamico)} 
          color={data.limiteDiarioDinamico < 50 ? 'red' : 'green'}
          sub={config?.limiteDinamico ? "Calculado via saldo livre" : "Fixo nas configs"} 
          extra={data.detalhesLimiteDiario ? (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-muted">Dias restantes:</span>
                <span className="text-white">{data.detalhesLimiteDiario.diasRestantes}d</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-muted">Saldo livre:</span>
                <span className="text-fluxo-green">{formatCurrency(data.detalhesLimiteDiario.saldoLivreRestante)}</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-brand-primary h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (data.detalhesLimiteDiario.valorPorDia / (config?.limiteDiarioPadrao || 1)) * 100)}%` }}
                />
              </div>
            </div>
          ) : null}
        />
      </div>

      {/* Alerts */}
      {data.alertas.length > 0 && (
        <div className="space-y-2">
          {data.alertas.map((a, i) => <AlertStrip key={i} {...a} />)}
        </div>
      )}

      {/* Quick Add */}
      <QuickAdd contas={contas} cartoes={cartoes} onAdded={refetch} />

      {/* Charts row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card col-span-2">
          <p className="label-mono mb-3">Patrimônio (6 meses)</p>
          <PatrimonioChart data={data.patrimonioHistorico} />
        </div>
        <div className="card col-span-2">
          <p className="label-mono mb-3">Orçamento 50/30/20 (Realizado)</p>
          <BudgetRings data={data.regra503020} />
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-primary" />
              <span className="text-[10px] text-muted uppercase font-mono">Necessidades</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[10px] text-muted uppercase font-mono">Desejos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-muted uppercase font-mono">Poupança</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card col-span-2">
          <p className="label-mono mb-3">Fluxo de Saldo (Real + 30 Dias Projetado)</p>
          <FluxoLineChart data={[
            ...(data.saldoDiario || []).map(d => {
              const dateStr = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(d.dia).padStart(2, '0')}`;
              const isFuture = new Date(dateStr) > new Date();
              return { ...d, data: dateStr, tipo: (isFuture ? 'projetado' : 'real') as any };
            }),
            ...(data.projecaoDiaria30Dias || []).filter(p => {
              // Avoid duplicating days already in saldoDiario
              const pDate = new Date(p.data);
              return pDate.getMonth() + 1 !== mesAtual || pDate.getFullYear() !== anoAtual;
            }).map(p => ({ ...p, tipo: 'projetado' as any }))
          ]} />
        </div>
        <div className="card">
          <p className="label-mono mb-3">Gastos por Categoria</p>
          <DonutChart data={data.gastosPorCategoria} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Contas */}
        <div className="card">
          <p className="label-mono mb-3">Contas</p>
          <div className="space-y-3">
            {data.contasSaldo.map(({ conta, saldoAtual }) => (
              <div key={conta.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: conta.cor + '20', color: conta.cor }}>
                  {conta.banco[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conta.nome}</p>
                  <ProgressBar value={Math.max(0, saldoAtual)} max={Math.max(...data.contasSaldo.map(c => c.saldoAtual), 1)}
                    color={conta.cor} height={3} />
                </div>
                <span className={`font-mono text-sm ${saldoAtual >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                  {formatCurrency(saldoAtual)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Próximas saídas */}
        <div className="card">
          <p className="label-mono mb-3">Próximas Saídas</p>
          <div className="space-y-1 max-h-[240px] overflow-y-auto">
            {data.proximasSaidas.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">Sem saídas próximas</p>
            ) : (
              data.proximasSaidas.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm truncate max-w-[160px]">{t.descricao}</p>
                    <p className="text-[10px] text-muted font-mono">{formatDateShort(t.data)}</p>
                  </div>
                  <span className="font-mono text-sm text-fluxo-red">-{formatCurrency(t.valor)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Faturas abertas */}
        <div className="card">
          <p className="label-mono mb-3">Faturas Abertas</p>
          <div className="space-y-3">
            {data.faturasAbertas.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">Sem faturas abertas</p>
            ) : (
              data.faturasAbertas.map(fa => (
                <div key={fa.fatura.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: fa.cartao.cor + '20' }}>
                    <CreditCard size={14} style={{ color: fa.cartao.cor }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{fa.cartao.nome}</p>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={fa.total} max={fa.cartao.limite} height={3} />
                      <span className={`text-[10px] font-mono whitespace-nowrap ${fa.diasParaVencer <= 3 ? 'text-fluxo-red' : 'text-muted'}`}>
                        {fa.diasParaVencer > 0 ? `${fa.diasParaVencer}d` : 'Vencida'}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-sm text-fluxo-amber">{formatCurrency(fa.total)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
