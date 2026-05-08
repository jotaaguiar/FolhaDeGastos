import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useDashboard } from '@/hooks/useDashboard';
import { formatCurrency, getMesNome } from '@/lib/formatters';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Target, AlertCircle, Sparkles, RefreshCw, Plus, Trash2, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, ComposedChart, Line } from 'recharts';
import SkeletonCard from '@/components/shared/SkeletonCard';
import { useBrandColor } from '@/hooks/useBrandColor';

interface SimulacaoItem {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  recorrente: boolean;
}

export default function Radar() {
  const { config, atualizarConfig } = useApp();
  const { data, loading } = useDashboard();
  const brandColor = useBrandColor();
  
  const [simulacoes, setSimulacoes] = useState<SimulacaoItem[]>([]);
  const [novoItem, setNovoItem] = useState({ descricao: '', valor: '', tipo: 'saida' as 'entrada' | 'saida', recorrente: false });

  if (loading || !data) return <div className="p-8 space-y-6">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;

  // Process data with simulation
  const applySimulation = (baseData: typeof data.projecaoRadar) => {
    let saldoAcumulado = data.saldoTotal;
    return baseData.map((p, index) => {
      let modEntradas = p.entradas;
      let modSaidas = p.saidas;

      simulacoes.forEach(s => {
        if (s.recorrente || index === 0) {
          if (s.tipo === 'entrada') modEntradas += s.valor;
          else modSaidas += s.valor;
        }
      });

      saldoAcumulado += (modEntradas - modSaidas);
      return {
        ...p,
        entradas: modEntradas,
        saidas: modSaidas,
        saldoProjetado: Math.round(saldoAcumulado * 100) / 100,
        poupanca: Math.max(0, modEntradas - modSaidas)
      };
    });
  };

  const projectedData = applySimulation(data.projecaoRadar).map(p => ({
    ...p,
    name: `${getMesNome(p.mes)}/${p.ano.toString().slice(2)}`,
  }));

  // Combine Historical + Projected for the main chart
  const lastRealIndex = (data.patrimonioHistorico?.length || 0) - 1;
  const combinedChartData = [
    ...(data.patrimonioHistorico || []).map((p, i) => ({
      name: `${getMesNome(parseInt(p.data.split('-')[1]))}/${p.data.split('-')[0].slice(2)}`,
      saldoReal: p.saldo,
      saldoProj: i === lastRealIndex ? p.saldo : null, // Connect the lines
    })),
    ...projectedData.map(p => ({
      name: `${getMesNome(p.mes)}/${p.ano.toString().slice(2)}`,
      saldoReal: null,
      saldoProj: p.saldoProjetado,
    }))
  ];

  const handleAddSimulacao = () => {
    if (!novoItem.descricao || !novoItem.valor) return;
    const item: SimulacaoItem = {
      id: Math.random().toString(36).substr(2, 9),
      descricao: novoItem.descricao,
      valor: parseFloat(novoItem.valor),
      tipo: novoItem.tipo,
      recorrente: novoItem.recorrente
    };
    setSimulacoes([...simulacoes, item]);
    setNovoItem({ descricao: '', valor: '', tipo: 'saida', recorrente: false });
  };

  const removeSimulacao = (id: string) => {
    setSimulacoes(simulacoes.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header with Period Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <TrendingUp className="text-brand-primary" /> Radar de Projeção
          </h2>
          <p className="text-xs text-muted font-mono mt-1">Visão de {config?.radarPeriodo || 6} meses com simulação inteligente</p>
        </div>
        
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-white/[0.07]">
          {[3, 6, 12, 24].map(p => (
            <button
              key={p}
              onClick={() => atualizarConfig({ radarPeriodo: p })}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-all ${
                (config?.radarPeriodo || 6) === p ? 'bg-brand-primary text-white' : 'text-muted hover:text-white'
              }`}
            >
              {p}M
            </button>
          ))}
        </div>
      </div>

      {/* Main Unified Chart (Historical + Projected) */}
      <div className="card card-glow-brand p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="label-mono">Curva de Patrimônio (Real vs Projetado)</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-primary" />
              <span className="text-[10px] font-mono text-muted uppercase">Realizado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-dashed border-brand-primary rounded-full" />
              <span className="text-[10px] font-mono text-muted uppercase">Projetado</span>
            </div>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedChartData}>
              <defs>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={brandColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={brandColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="#6b6890" fontSize={11} fontFamily="DM Mono" tickLine={false} axisLine={false} />
              <YAxis stroke="#6b6890" fontSize={11} fontFamily="DM Mono" tickLine={false} axisLine={false} 
                tickFormatter={(v) => `R$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip
                contentStyle={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontFamily: 'DM Mono', fontSize: 12 }}
                formatter={(v: number) => [formatCurrency(v), 'Saldo'] as any}
              />
              <Area type="monotone" dataKey="saldoReal" stroke={brandColor} strokeWidth={3} fillOpacity={1} fill="url(#colorSaldo)" />
              <Area type="monotone" dataKey="saldoProj" stroke={brandColor} strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorSaldo)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Simulation & Scenario Simulator */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card border-brand-primary/20 bg-brand-primary/[0.02]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-brand-primary" size={18} />
              <h3 className="font-bold">Simulador de Cenário</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-muted uppercase block mb-1">Descrição</label>
                <input 
                  className="input-dark w-full text-sm" 
                  placeholder="Ex: Compra de Notebook"
                  value={novoItem.descricao}
                  onChange={e => setNovoItem({...novoItem, descricao: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-muted uppercase block mb-1">Valor (R$)</label>
                  <input 
                    className="input-dark w-full text-sm font-mono" 
                    type="number"
                    value={novoItem.valor}
                    onChange={e => setNovoItem({...novoItem, valor: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted uppercase block mb-1">Tipo</label>
                  <select 
                    className="input-dark w-full text-sm"
                    value={novoItem.tipo}
                    onChange={e => setNovoItem({...novoItem, tipo: e.target.value as any})}
                  >
                    <option value="saida">Saída</option>
                    <option value="entrada">Entrada</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="recorrente-sim" 
                  className="rounded border-white/10 bg-white/5" 
                  checked={novoItem.recorrente}
                  onChange={e => setNovoItem({...novoItem, recorrente: e.target.checked})}
                />
                <label htmlFor="recorrente-sim" className="text-xs text-muted">Gasto recorrente (todo mês)</label>
              </div>
              <button 
                onClick={handleAddSimulacao}
                className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Adicionar à Projeção
              </button>
            </div>

            {/* Simulated Items List */}
            {simulacoes.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
                <p className="label-mono text-[10px]">Cenários Ativos</p>
                {simulacoes.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 group">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{s.descricao}</p>
                      <p className="text-[9px] text-muted font-mono uppercase">{s.recorrente ? 'Mensal' : 'Único'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono font-bold ${s.tipo === 'entrada' ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                        {s.tipo === 'entrada' ? '+' : '-'}{formatCurrency(s.valor)}
                      </span>
                      <button onClick={() => removeSimulacao(s.id)} className="text-muted hover:text-fluxo-red opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setSimulacoes([])} className="text-[10px] text-muted hover:text-white font-mono flex items-center gap-1 mt-2">
                  <RefreshCw size={10} /> Limpar Simulação
                </button>
              </div>
            )}
          </div>

          {/* Analysis Info */}
          <div className="card bg-s2 border-white/5 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-brand-primary">
                <Target size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold">Fidelidade dos Dados</h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Esta projeção utiliza 4 camadas de dados:
                </p>
                <ul className="mt-2 space-y-1.5">
                  <li className="text-[10px] flex items-center gap-2 text-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-fluxo-green" /> 1. Parcelamentos (100% Certeza)
                  </li>
                  <li className="text-[10px] flex items-center gap-2 text-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-fluxo-blue" /> 2. Recorrências Ativas (Alta Confiança)
                  </li>
                  <li className="text-[10px] flex items-center gap-2 text-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-fluxo-amber" /> 3. Salários/Fixos (Alta Confiança)
                  </li>
                  <li className="text-[10px] flex items-center gap-2 text-muted">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" /> 4. Médias Históricas (Estimativa)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Breakdown & Monthly Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <p className="label-mono mb-4">Entradas vs Saídas Projetadas</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b6890" fontSize={10} fontFamily="DM Mono" tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      labelStyle={{ fontFamily: 'DM Mono' }}
                    />
                    <Bar dataKey="entradas" fill="#34d399" radius={[2,2,0,0]} name="Entradas" />
                    <Bar dataKey="saidas" fill="#fb7185" radius={[2,2,0,0]} name="Saídas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card flex flex-col justify-center text-center p-6 bg-fluxo-blue/5 border-fluxo-blue/20">
              <div className="w-12 h-12 rounded-2xl bg-fluxo-blue/10 flex items-center justify-center mx-auto mb-4 text-fluxo-blue">
                <Target size={24} />
              </div>
              <p className="label-mono text-xs mb-1">Média de Poupança Mensal</p>
              <h3 className="text-3xl font-extrabold font-mono text-fluxo-blue">
                {formatCurrency(projectedData.reduce((acc, p) => acc + p.poupanca, 0) / projectedData.length)}
              </h3>
              <p className="text-[10px] text-muted mt-2 px-4 leading-relaxed font-mono">
                Valor estimado que sobrará livre após todos os gastos recorrentes e parcelas.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="label-mono text-xs px-2">Detalhamento por Mês</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projectedData.map((p, i) => (
                <div key={i} className={`p-4 rounded-2xl border border-white/[0.05] bg-surface/50 backdrop-blur-sm flex flex-col gap-3 transition-all hover:border-white/20 ${p.saldoProjetado < 0 ? 'border-red-500/30 bg-red-500/5' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{getMesNome(p.mes)} {p.ano}</p>
                      <p className="text-[10px] text-muted font-mono uppercase">Mês {i + 1} da Projeção</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold font-mono ${p.saldoProjetado >= 0 ? 'text-white' : 'text-red-400'}`}>
                        {formatCurrency(p.saldoProjetado)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <div className="space-y-1">
                      <p className="text-[9px] text-muted font-mono uppercase">Composição Saídas</p>
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-muted">Parcelas:</span>
                        <span className="text-white">{formatCurrency(p.breakdown.parcelas)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-muted">Fixos/Rec:</span>
                        <span className="text-white">{formatCurrency(p.breakdown.recorrencias)}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                       <p className="text-[9px] text-muted font-mono uppercase">Entradas</p>
                       <p className="text-xs font-mono text-fluxo-green">{formatCurrency(p.entradas)}</p>
                       <p className="text-[9px] text-muted font-mono uppercase mt-1">Livre</p>
                       <p className="text-xs font-mono text-brand-primary">{formatCurrency(p.poupanca)}</p>
                    </div>
                  </div>
                  
                  {p.saldoProjetado < 0 && (
                    <div className="mt-1 flex items-center gap-1.5 text-[9px] text-red-400 font-mono uppercase font-bold animate-pulse">
                      <AlertCircle size={10} /> Saldo devedor projetado
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
