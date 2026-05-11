import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, Eye, Sparkles } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { useCategorias } from '@/hooks/useCategorias';

type MesData = {
  mes: number;
  ano: number;
  label: string;
  entradas: number;
  saidas: number;
  saldo: number;
  porCategoria: Record<string, number>;
  projetado: boolean;
};

// Custom tooltip so we can show "Projetado" badge
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const isProj = payload[0]?.payload?.projetado;
  return (
    <div className="bg-[#1a1a2e] border border-white/[0.07] rounded-xl px-4 py-3 shadow-xl text-xs space-y-1.5 min-w-[160px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono font-bold text-white">{label}</span>
        {isProj && (
          <span className="text-[9px] bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded-full font-mono">projetado</span>
        )}
      </div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-bold" style={{ color: p.color }}>
            {typeof p.value === 'number' ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Comparativo() {
  const [passados, setPassados] = useState(6);
  const [futuros, setFuturos] = useState(3);
  const [dados, setDados] = useState<MesData[]>([]);
  const [loading, setLoading] = useState(true);
  const { getCategoriaInfo } = useCategorias();

  useEffect(() => {
    setLoading(true);
    api.getComparativo(passados, futuros)
      .then(setDados)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [passados, futuros]);

  // Split: last real month and first projected
  const ultimoReal   = [...dados].reverse().find(d => !d.projetado);
  const penultimoReal = [...dados].filter(d => !d.projetado).slice(-2, -1)[0];

  const variacaoSaidas = ultimoReal && penultimoReal
    ? ((ultimoReal.saidas - penultimoReal.saidas) / (penultimoReal.saidas || 1)) * 100 : null;
  const variacaoEntradas = ultimoReal && penultimoReal
    ? ((ultimoReal.entradas - penultimoReal.entradas) / (penultimoReal.entradas || 1)) * 100 : null;

  // Label do mês de transição real → projetado (para ReferenceLine)
  const primeiroProjetado = dados.find(d => d.projetado);

  // Top categories across real months only
  const dadosReais = dados.filter(d => !d.projetado);
  const todasCategorias = [...new Set(dadosReais.flatMap(d => Object.keys(d.porCategoria)))];
  const topCategorias = todasCategorias
    .map(cat => ({ cat, total: dadosReais.reduce((s, d) => s + (d.porCategoria[cat] || 0), 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(c => c.cat);

  const CAT_COLORS = ['#6366f1', '#f97316', '#22c55e', '#ec4899', '#14b8a6'];

  const chartData = dados.map(d => ({
    label: d.label,
    projetado: d.projetado,
    Entradas: Math.round(d.entradas * 100) / 100,
    Saídas:   Math.round(d.saidas  * 100) / 100,
    Saldo:    Math.round(d.saldo   * 100) / 100,
  }));

  const catChartData = dados.map(d => {
    const row: Record<string, unknown> = { label: d.label, projetado: d.projetado };
    for (const cat of topCategorias) {
      row[getCategoriaInfo(cat).label] = Math.round((d.porCategoria[cat] || 0) * 100) / 100;
    }
    return row;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 size={22} className="text-brand-primary" />
          <div>
            <h2 className="text-xl font-bold">Comparativo Mensal</h2>
            <p className="text-xs text-muted font-mono">Histórico real + projeção futura</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Eye size={13} className="text-muted" />
            <span className="text-xs text-muted">Passado</span>
            <select className="input-dark text-xs py-1" value={passados} onChange={e => setPassados(Number(e.target.value))}>
              <option value={3}>3m</option>
              <option value={6}>6m</option>
              <option value={12}>12m</option>
              <option value={24}>24m</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-brand-primary" />
            <span className="text-xs text-muted">Projeção</span>
            <select className="input-dark text-xs py-1" value={futuros} onChange={e => setFuturos(Number(e.target.value))}>
              <option value={0}>Off</option>
              <option value={1}>1m</option>
              <option value={3}>3m</option>
              <option value={6}>6m</option>
              <option value={12}>12m</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legend chip */}
      {futuros > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-fluxo-green/70" />
            <span>Entradas reais</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-fluxo-red/70" />
            <span>Saídas reais</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-fluxo-green/30 border border-dashed border-fluxo-green/50" />
            <span>Entradas projetadas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-fluxo-red/30 border border-dashed border-fluxo-red/50" />
            <span>Saídas projetadas</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-[10px]">Projeção baseada em recorrências + parcelas ativas</span>
        </div>
      )}

      {/* KPIs */}
      {ultimoReal && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card">
            <p className="label-mono mb-1">Entradas ({ultimoReal.label})</p>
            <p className="text-xl font-bold text-fluxo-green font-mono">{formatCurrency(ultimoReal.entradas)}</p>
            {variacaoEntradas !== null && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${variacaoEntradas >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                {variacaoEntradas > 0 ? <TrendingUp size={12} /> : variacaoEntradas < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                {variacaoEntradas > 0 ? '+' : ''}{variacaoEntradas.toFixed(1)}% vs anterior
              </div>
            )}
          </div>
          <div className="card">
            <p className="label-mono mb-1">Saídas ({ultimoReal.label})</p>
            <p className="text-xl font-bold text-fluxo-red font-mono">{formatCurrency(ultimoReal.saidas)}</p>
            {variacaoSaidas !== null && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${variacaoSaidas <= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                {variacaoSaidas < 0 ? <TrendingDown size={12} /> : variacaoSaidas > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
                {variacaoSaidas > 0 ? '+' : ''}{variacaoSaidas.toFixed(1)}% vs anterior
              </div>
            )}
          </div>
          <div className="card">
            <p className="label-mono mb-1">Saldo ({ultimoReal.label})</p>
            <p className={`text-xl font-bold font-mono ${ultimoReal.saldo >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
              {formatCurrency(ultimoReal.saldo)}
            </p>
          </div>
        </div>
      )}

      {/* Entradas vs Saídas — real bars solid, projected bars translucent */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-4">Entradas × Saídas por Mês</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
            {primeiroProjetado && (
              <ReferenceLine
                x={primeiroProjetado.label}
                stroke="rgba(99,102,241,0.4)"
                strokeDasharray="4 3"
                label={{ value: 'projeção →', position: 'insideTopLeft', fill: '#6366f1', fontSize: 10 }}
              />
            )}
            <Bar dataKey="Entradas" radius={[3, 3, 0, 0]} name="Entradas">
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.projetado ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.85)'} />
              ))}
            </Bar>
            <Bar dataKey="Saídas" radius={[3, 3, 0, 0]} name="Saídas">
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.projetado ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.85)'} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Saldo line — solid for real, dashed for projected */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-4">Evolução do Saldo</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
            {primeiroProjetado && (
              <ReferenceLine x={primeiroProjetado.label} stroke="rgba(99,102,241,0.4)" strokeDasharray="4 3" />
            )}
            {/* Real saldo line */}
            <Line
              dataKey="Saldo"
              name="Saldo real"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={(props: any) => {
                if (props.payload?.projetado) return <g key={props.key} />;
                return <circle key={props.key} cx={props.cx} cy={props.cy} r={4} fill="#6366f1" stroke="#6366f1" />;
              }}
              connectNulls
            />
            {/* Projected saldo — overlay as dashed */}
            <Line
              dataKey={(d: any) => d.projetado ? d.Saldo : null}
              name="Saldo projetado"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={(props: any) => {
                if (!props.payload?.projetado) return <g key={props.key} />;
                return <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill="transparent" stroke="#6366f1" strokeWidth={1.5} />;
              }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Top categories — real months only */}
      {topCategorias.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Gastos por Categoria — Top 5 (histórico real)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={catChartData.filter(d => !d.projetado)} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
              {topCategorias.map((cat, i) => (
                <Bar key={cat} dataKey={getCategoriaInfo(cat).label} fill={CAT_COLORS[i % CAT_COLORS.length]} stackId="a" radius={i === topCategorias.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <p className="label-mono mb-4">Resumo Mensal</p>

        {/* ── Mobile: card list ───────────────────────────────── */}
        <div className="sm:hidden divide-y divide-white/[0.04]">
          {dados.map((d, i) => {
            const prev = dados[i - 1];
            const varSaldo = prev ? ((d.saldo - prev.saldo) / Math.abs(prev.saldo || 1)) * 100 : null;
            const txPoup = d.entradas > 0 ? ((d.entradas - d.saidas) / d.entradas) * 100 : 0;
            const showDivider = d.projetado && (i === 0 || !dados[i - 1].projetado);
            return (
              <div key={`${d.mes}-${d.ano}`}>
                {showDivider && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-brand-primary/20" />
                    <span className="text-[10px] text-brand-primary font-mono flex items-center gap-1">
                      <Sparkles size={9} /> projeção futura
                    </span>
                    <div className="flex-1 h-px bg-brand-primary/20" />
                  </div>
                )}
                <div className={`py-3 ${d.projetado ? 'opacity-60' : ''}`}>
                  {/* Row 1: mês + saldo */}
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{d.label}</span>
                      {d.projetado && <span className="text-[9px] bg-brand-primary/15 text-brand-primary px-1.5 py-0.5 rounded-full font-mono">proj</span>}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`font-mono font-bold text-base ${d.saldo >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                        {formatCurrency(d.saldo)}
                      </span>
                      {varSaldo !== null && (
                        <span className={`text-[10px] font-mono ${varSaldo >= 0 ? 'text-fluxo-green/70' : 'text-fluxo-red/70'}`}>
                          {varSaldo > 0 ? '+' : ''}{varSaldo.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Row 2: entradas / saídas / poupança */}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] font-mono text-fluxo-green">↑ {formatCurrency(d.entradas)}</span>
                    <span className="text-[11px] font-mono text-fluxo-red">↓ {formatCurrency(d.saidas)}</span>
                    <span className={`text-[11px] font-mono ml-auto ${txPoup >= 20 ? 'text-fluxo-green' : txPoup >= 0 ? 'text-fluxo-amber' : 'text-fluxo-red'}`}>
                      {txPoup.toFixed(0)}% poupado
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Desktop: table ──────────────────────────────────── */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left py-2 text-muted font-mono text-xs">Mês</th>
                <th className="text-right py-2 text-muted font-mono text-xs">Entradas</th>
                <th className="text-right py-2 text-muted font-mono text-xs">Saídas</th>
                <th className="text-right py-2 text-muted font-mono text-xs">Saldo</th>
                <th className="text-right py-2 text-muted font-mono text-xs">Tx. Poupança</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((d, i) => {
                const prev = dados[i - 1];
                const varSaldo = prev ? ((d.saldo - prev.saldo) / Math.abs(prev.saldo || 1)) * 100 : null;
                const txPoup = d.entradas > 0 ? ((d.entradas - d.saidas) / d.entradas) * 100 : 0;
                const showDivider = d.projetado && (i === 0 || !dados[i - 1].projetado);
                return (
                  <>
                    {showDivider && (
                      <tr key={`div-${i}`}>
                        <td colSpan={5} className="py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-brand-primary/20" />
                            <span className="text-[10px] text-brand-primary font-mono flex items-center gap-1">
                              <Sparkles size={9} /> projeção futura
                            </span>
                            <div className="flex-1 h-px bg-brand-primary/20" />
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr
                      key={`${d.mes}-${d.ano}`}
                      className={`border-b border-white/[0.03] transition-colors ${d.projetado ? 'opacity-60 hover:opacity-80' : 'hover:bg-white/[0.02]'}`}
                    >
                      <td className="py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sm">{d.label}</span>
                          {d.projetado && <span className="text-[9px] bg-brand-primary/15 text-brand-primary px-1 py-0.5 rounded font-mono">proj</span>}
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-mono whitespace-nowrap text-fluxo-green">{formatCurrency(d.entradas)}</td>
                      <td className="py-2.5 text-right font-mono whitespace-nowrap text-fluxo-red">{formatCurrency(d.saidas)}</td>
                      <td className={`py-2.5 text-right font-mono font-bold whitespace-nowrap ${d.saldo >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                        {formatCurrency(d.saldo)}
                        {varSaldo !== null && (
                          <span className={`ml-1 text-[10px] font-normal ${varSaldo >= 0 ? 'text-fluxo-green/60' : 'text-fluxo-red/60'}`}>
                            {varSaldo > 0 ? '+' : ''}{varSaldo.toFixed(0)}%
                          </span>
                        )}
                      </td>
                      <td className={`py-2.5 text-right font-mono text-xs whitespace-nowrap ${txPoup >= 20 ? 'text-fluxo-green' : txPoup >= 0 ? 'text-fluxo-amber' : 'text-fluxo-red'}`}>
                        {txPoup.toFixed(1)}%
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
