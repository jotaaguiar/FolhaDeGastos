import { useState } from 'react';
import { Plus } from 'lucide-react';
import BotaoBaixarPDF from '@/components/shared/BotaoBaixarPDF';
import { useTransacoes } from '@/hooks/useTransacoes';
import { useContas } from '@/hooks/useContas';
import { useCartoes } from '@/hooks/useCartoes';
import { useRecorrencias } from '@/hooks/useRecorrencias';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useDashboard } from '@/hooks/useDashboard';
import MetricCard from '@/components/shared/MetricCard';
import StackedBarChart from '@/components/charts/StackedBarChart';
import HeatmapCalendar from '@/components/shared/HeatmapCalendar';
import SkeletonCard from '@/components/shared/SkeletonCard';
import ProgressBar from '@/components/shared/ProgressBar';
import ModalTransacao from '@/components/modals/ModalTransacao';
import ModalDetalhesDia from '@/components/modals/ModalDetalhesDia';
import { formatCurrency, getDiaSemana, getMesNome } from '@/lib/formatters';
import { useAlert } from '@/context/AlertContext';
import RecorrenciasManager from '@/components/shared/RecorrenciasManager';

function dataCobrancaRecorrencia(rec: any, mes: number, ano: number) {
  const dia = Math.min(rec.diaCobranca, new Date(ano, mes, 0).getDate());
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function recorrenciaValeNoMes(rec: any, mes: number, ano: number) {
  if (!rec.ativa) return false;
  const chaveMes = `${ano}-${String(mes).padStart(2, '0')}`;
  if (rec.pulosManual?.includes(chaveMes)) return false;
  const data = dataCobrancaRecorrencia(rec, mes, ano);
  if (rec.inicioEm && data < rec.inicioEm.slice(0, 10)) return false;
  if (rec.fimEm && data > rec.fimEm.slice(0, 10)) return false;
  return true;
}

export default function FluxoCaixa() {
  const { mesAtual, anoAtual, config, refresh } = useApp();
  const { addToast } = useAlert();
  const txHook = useTransacoes();
  const { transacoes, loading, remove: removeTx, update: updateTx, create: createTx } = txHook;
  const { contas } = useContas();
  const { cartoes } = useCartoes();
  const { recorrencias } = useRecorrencias();
  const { data: dashboard } = useDashboard();
  const [tab, setTab] = useState<'fluxo' | 'projecao' | 'recorrencias'>('fluxo');
  const [modalTx, setModalTx] = useState(false);
  const [modalDia, setModalDia] = useState<{ open: boolean; dia: number }>({ open: false, dia: 1 });
  const [editingTx, setEditingTx] = useState<any>(null);

  const handleSaveTx = async (data: any) => {
    try {
      if (data.id) {
        await updateTx(data.id, data);
        addToast('success', 'Transação atualizada');
      } else {
        await createTx(data);
        addToast('success', 'Transação criada');
      }
      refresh();
      setModalTx(false);
    } catch { 
      addToast('error', 'Erro ao salvar transação'); 
    }
  };

  if (loading) return <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>;

  // — Current month data (Real + Pending Recurrences) —
  const totalEntradasReal = transacoes.filter(t => t.tipo === 'entrada').reduce((a, t) => a + t.valor, 0);
  const totalSaidasReal = transacoes
    .filter(t => t.tipo === 'debito' || t.tipo === 'credito_cartao')
    .reduce((a, t) => a + t.valor, 0);

  const pendingRecs = recorrencias.filter(r => {
    if (!recorrenciaValeNoMes(r, mesAtual, anoAtual)) return false;
    const exists = transacoes.some(t => {
      if (!t.data) return false;
      return t.recorrenciaId === r.id;
    });
    return !exists;
  });

  const totalEntradasPendentes = pendingRecs.filter(r => r.tipo === 'entrada').reduce((a, r) => a + r.valor, 0);
  const totalSaidasPendentes = pendingRecs.filter(r => r.tipo === 'debito' || r.tipo === 'credito_cartao').reduce((a, r) => a + r.valor, 0);

  const totalEntradas = totalEntradasReal + totalEntradasPendentes;
  const totalSaidas = totalSaidasReal + totalSaidasPendentes;
  const saldoMes = totalEntradas - totalSaidas;
  const diasNoMes = new Date(anoAtual, mesAtual, 0).getDate();
  const hoje = new Date();
  const diaAtual = hoje.getMonth() + 1 === mesAtual && hoje.getFullYear() === anoAtual ? hoje.getDate() : diasNoMes;
  const mediaDiaria = diaAtual > 0 ? totalSaidas / diaAtual : 0;
  const limiteDiario = config?.limiteDiarioPadrao ?? 150;

  // — Weekly stacked bar (month-scoped) —
  const semanas: Array<{ label: string; entradas: number; saidas: number }> = [];
  for (let w = 0; w < Math.ceil(diasNoMes / 7); w++) {
    const inicio = w * 7 + 1;
    const fim = Math.min((w + 1) * 7, diasNoMes);
    let ent = 0, sai = 0;
    transacoes.forEach(t => {
      const parts = t.data.split('-');
      const d = Number(parts[2]);
      if (d >= inicio && d <= fim) {
        if (t.tipo === 'entrada') ent += t.valor;
        else if (t.tipo !== 'transferencia') sai += t.valor;
      }
    });
    semanas.push({ label: `S${w + 1}`, entradas: ent, saidas: sai });
  }

  // — Heatmap (month-scoped daily spending) —
  const heatmapData = Array.from({ length: diasNoMes }, (_, i) => {
    const dia = i + 1;
    const valor = transacoes
      .filter(t => {
        const parts = t.data.split('-');
        return Number(parts[2]) === dia;
      })
      .reduce((a, t) => a + t.valor, 0);
    return { dia, valor };
  });

  // — Daily timeline with spending per day (month-scoped) —
  const timeline = Array.from({ length: diasNoMes }, (_, i) => {
    const dia = i + 1;
    const dataStr = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const txDia = transacoes.filter(t => {
      if (!t.data) return false;
      // Normalizar comparativo de data para evitar erros de padding (ex: 2026-5-9 vs 2026-05-09)
      const tParts = t.data.split('-').map(Number);
      return tParts[0] === anoAtual && tParts[1] === mesAtual && tParts[2] === dia;
    });
    const gastoDia = txDia
      .filter(t => t.tipo === 'debito' || t.tipo === 'credito_cartao')
      .reduce((a, t) => a + t.valor, 0);
    const entradaDia = txDia.filter(t => t.tipo === 'entrada').reduce((a, t) => a + t.valor, 0);
    const isFuturo = dia > diaAtual;
    return { dia, dataStr, txDia, gastoDia, entradaDia, isFuturo };
  });

  // — Recurring totals for projection tab —
  const recsDoMes = recorrencias.filter(r => recorrenciaValeNoMes(r, mesAtual, anoAtual));
  const recEntradas = recsDoMes.filter(r => r.tipo === 'entrada').reduce((a, r) => a + r.valor, 0);
  const recSaidas = recsDoMes.filter(r => r.tipo === 'debito' || r.tipo === 'credito_cartao').reduce((a, r) => a + r.valor, 0);

  // — Monthly projection (6 months ahead) —
  const projecaoMeses = dashboard?.projecaoRadar || [];


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with tab bar and add button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-surface rounded-xl p-1 border border-white/[0.07] w-full sm:w-fit overflow-x-auto">
          <button onClick={() => setTab('fluxo')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'fluxo' ? 'bg-brand-primary/10 text-brand-primary' : 'text-muted hover:text-white'}`}>
            Fluxo do Mês
          </button>
          <button onClick={() => setTab('projecao')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'projecao' ? 'bg-brand-primary/10 text-brand-primary' : 'text-muted hover:text-white'}`}>
            Projeção Mensal
          </button>
          <button onClick={() => setTab('recorrencias')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'recorrencias' ? 'bg-brand-primary/10 text-brand-primary' : 'text-muted hover:text-white'}`}>
            Recorrências
          </button>
        </div>

        <div className="flex items-center gap-2">
          <BotaoBaixarPDF mes={mesAtual} ano={anoAtual} />
          <button
            onClick={() => { setEditingTx(null); setModalTx(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Nova Transação
          </button>
        </div>
      </div>

      {tab === 'fluxo' ? (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard label="Entradas" value={formatCurrency(totalEntradas)} color="green" sub={`${getMesNome(mesAtual)}`} />
            <MetricCard label="Saídas" value={formatCurrency(totalSaidas)} color="red" sub="Débitos + Cartão" />
            <MetricCard label="Saldo Mês" value={formatCurrency(saldoMes)} color={saldoMes >= 0 ? 'teal' : 'red'} sub={saldoMes >= 0 ? 'Positivo' : 'Negativo'} />
            <MetricCard label="Média/Dia" value={formatCurrency(mediaDiaria)} color={mediaDiaria > limiteDiario ? 'red' : 'amber'}
              sub={`Limite: ${formatCurrency(limiteDiario)}`} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card lg:col-span-2">
              <p className="label-mono mb-3">Entradas vs Saídas por Semana — {getMesNome(mesAtual)}</p>
              <StackedBarChart data={semanas} />
            </div>
            <div className="card">
              <p className="label-mono mb-3">Heatmap de Gastos — {getMesNome(mesAtual)}</p>
              <HeatmapCalendar
                data={heatmapData}
                mes={mesAtual}
                ano={anoAtual}
                onDayClick={(dia) => setModalDia({ open: true, dia })}
              />
            </div>
          </div>

          {/* Daily Timeline (month-scoped) */}
          <div className="card">
            <p className="label-mono mb-4">Gastos por Dia — {getMesNome(mesAtual)} {anoAtual}</p>
            <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
              {timeline.map(({ dia, dataStr, txDia, gastoDia, entradaDia, isFuturo }) => (
                <div
                  key={dia}
                  onClick={() => setModalDia({ open: true, dia })}
                  className={`flex items-center gap-3 py-2 px-2 rounded-lg transition-all cursor-pointer ${isFuturo ? 'opacity-40' : ''} ${dia === diaAtual ? 'bg-brand-primary/5 border border-brand-primary/20' : 'hover:bg-white/[0.05]'}`}
                >
                  <div className="w-10 text-center shrink-0">
                    <p className="text-sm font-mono font-bold">{dia}</p>
                    <p className="text-[9px] text-muted font-mono">{getDiaSemana(dataStr)}</p>
                  </div>

                  {/* Transaction pills */}
                  <div className="flex-1 flex gap-1 flex-wrap min-h-[24px]">
                    {txDia.length === 0 && !isFuturo && (
                      <span className="text-[10px] text-muted font-mono">—</span>
                    )}
                    {txDia.slice(0, 4).map(t => (
                      <span key={t.id} className="badge text-[9px]" style={{
                        background: t.tipo === 'entrada' ? '#34d39915' : t.tipo === 'credito_cartao' ? 'rgba(var(--brand-primary-rgb),0.08)' : '#fb718515',
                        color: t.tipo === 'entrada' ? '#34d399' : t.tipo === 'credito_cartao' ? 'var(--brand-primary)' : '#fb7185',
                      }}>
                        {t.descricao.length > 12 ? t.descricao.slice(0, 12) + '…' : t.descricao}
                      </span>
                    ))}
                    {txDia.length > 4 && (
                      <span className="badge text-[9px] bg-white/5 text-muted">+{txDia.length - 4}</span>
                    )}
                  </div>

                  {/* Entrada indicator */}
                  {entradaDia > 0 && (
                    <span className="text-[10px] font-mono text-fluxo-green shrink-0">+{formatCurrency(entradaDia)}</span>
                  )}

                  {/* Daily limit bar */}
                  <div className="w-16 shrink-0">
                    <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.05]">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${Math.min(100, (gastoDia / limiteDiario) * 100)}%`,
                        background: gastoDia > limiteDiario ? '#fb7185' : gastoDia > limiteDiario * 0.7 ? '#fbbf24' : '#34d399',
                      }} />
                    </div>
                  </div>

                  {/* Daily total */}
                  <span className={`font-mono text-xs w-20 text-right shrink-0 ${gastoDia > limiteDiario ? 'text-fluxo-red font-bold' : gastoDia > 0 ? 'text-muted' : 'text-muted/30'}`}>
                    {gastoDia > 0 ? formatCurrency(gastoDia) : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : tab === 'recorrencias' ? (
        <RecorrenciasManager filterType="conta" />
      ) : (
        /* === PROJEÇÃO MENSAL === */
        <>
          <div className="card">
            <p className="label-mono mb-4">Projeção de Saldo (Ledger)</p>
            <div className="space-y-4">
              {projecaoMeses.map((p, i) => {
                const isAtual = i === 0;
                const metaGasto = p.entradas * 0.8; // 50+30
                const metaPoupanca = p.entradas * 0.2; // 20
                const risco = p.saidas > metaGasto;

                return (
                  <div key={`${p.mes}-${p.ano}`} className={`p-4 rounded-xl border transition-all ${isAtual ? 'border-brand-primary/30 bg-brand-primary/5' : 'border-white/[0.05] bg-s2'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isAtual ? 'text-brand-primary' : ''}`}>
                          {getMesNome(p.mes)} {p.ano}
                        </span>
                        {isAtual && <span className="badge text-[10px] bg-brand-primary/10 text-brand-primary">Mês Atual</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted font-mono block">Saldo Final Acumulado</span>
                        <span className={`text-xl font-extrabold font-mono ${p.saldoProjetado >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                          {formatCurrency(p.saldoProjetado)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div>
                        <span className="text-[10px] text-muted font-mono block">Entradas Base</span>
                        <span className="text-sm font-mono text-fluxo-green">{formatCurrency(p.entradas)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted font-mono block">Saídas Totais</span>
                        <span className="text-sm font-mono text-fluxo-red">{formatCurrency(p.saidas)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted font-mono block">Parcelas</span>
                        <span className="text-sm font-mono text-white">{formatCurrency(p.breakdown.parcelas)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted font-mono block">Fixos/Rec.</span>
                        <span className="text-sm font-mono text-white">{formatCurrency(p.breakdown.recorrencias)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted font-mono block">Sobra no Mês</span>
                        <span className={`text-sm font-mono font-bold ${p.poupanca >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                          {p.poupanca >= 0 ? '+' : ''}{formatCurrency(p.poupanca)}
                        </span>
                      </div>
                    </div>

                    {/* Regra 50/30/20 Indicator */}
                    <div className="bg-surface rounded p-2.5 flex items-center justify-between mt-2 border border-white/[0.02]">
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] font-mono mb-1">
                          <span className="text-muted">Gasto: {formatCurrency(p.saidas)}</span>
                          <span className={risco ? 'text-fluxo-red' : 'text-fluxo-green'}>Teto 80%: {formatCurrency(metaGasto)}</span>
                        </div>
                        <ProgressBar value={p.saidas} max={metaGasto} height={4} color={risco ? '#fb7185' : '#34d399'} />
                      </div>
                      <div className="w-px h-6 bg-white/[0.05] mx-4" />
                      <div className="w-1/3">
                        <span className="text-[10px] text-muted font-mono block">Ideal Guardar (20%)</span>
                        <span className="text-xs font-mono font-bold text-fluxo-teal">{formatCurrency(metaPoupanca)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recurring costs summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <p className="label-mono mb-3">Receitas e Custos Fixos</p>
              <div className="space-y-2">
                {recsDoMes.filter(r => r.tipo === 'entrada').map(r => (
                  <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-sm">{r.descricao}</span>
                    <span className="font-mono text-xs text-fluxo-green">+{formatCurrency(r.valor)}</span>
                  </div>
                ))}
                {recsDoMes.filter(r => r.tipo === 'debito').map(r => (
                  <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-sm">{r.descricao}</span>
                    <span className="font-mono text-xs text-fluxo-red">-{formatCurrency(r.valor)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.07]">
                  <span className="text-sm font-bold">Total Fixo (Saídas)</span>
                  <span className="font-mono text-sm font-bold text-fluxo-red">
                    {formatCurrency(recSaidas)}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <p className="label-mono mb-3">Resumo Base</p>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Receita mensal base</span>
                  <span className="font-mono text-sm text-fluxo-green">{formatCurrency(totalEntradas > 0 ? totalEntradas : recEntradas)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Custos fixos</span>
                  <span className="font-mono text-sm text-fluxo-red">
                    -{formatCurrency(recSaidas)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/[0.07]">
                  <span className="text-sm font-bold">Disponível p/ gastos variáveis</span>
                  <span className={`font-mono text-sm font-bold ${
                    (totalEntradas > 0 ? totalEntradas : recEntradas) - recSaidas >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'
                  }`}>
                    {formatCurrency((totalEntradas > 0 ? totalEntradas : recEntradas) - recSaidas)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Fallback List for Debug/Visibility */}
          <div className="card mt-6">
            <p className="label-mono mb-4 text-brand-primary">Últimas Transações Registradas (Mês)</p>
            <div className="space-y-2">
              {transacoes.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center border border-dashed border-white/10 rounded-xl">
                  Nenhuma transação encontrada para este mês.
                </p>
              ) : (
                transacoes.slice(0, 10).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${t.tipo === 'entrada' ? 'bg-fluxo-green' : 'bg-fluxo-red'}`} />
                      <div>
                        <p className="text-sm font-medium">{t.descricao}</p>
                        <p className="text-[10px] text-muted font-mono">{t.data} • {t.categoria}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-bold ${t.tipo === 'entrada' ? 'text-fluxo-green' : 'text-white'}`}>
                        {t.tipo === 'entrada' ? '+' : '-'}{formatCurrency(t.valor)}
                      </p>
                      {t.cartaoId && <span className="text-[9px] text-brand-primary font-mono uppercase">Cartão</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <ModalTransacao open={modalTx} onClose={() => setModalTx(false)} onSubmit={handleSaveTx} contas={contas} cartoes={cartoes} initialData={editingTx} />

      <ModalDetalhesDia
        open={modalDia.open}
        onClose={() => setModalDia({ ...modalDia, open: false })}
        dia={modalDia.dia}
        mes={mesAtual}
        ano={anoAtual}
        transacoes={transacoes}
        contas={contas}
        cartoes={cartoes}
      />
    </div>
  );
}
