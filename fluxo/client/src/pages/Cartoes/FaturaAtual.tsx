import { useState, useEffect } from 'react';
import { useCartoes } from '@/hooks/useCartoes';
import { useContas } from '@/hooks/useContas';
import { useApp } from '@/context/AppContext';
import { useAlert } from '@/context/AlertContext';
import { api } from '@/lib/api';
import TransacaoRow from '@/components/shared/TransacaoRow';
import ProgressBar from '@/components/shared/ProgressBar';
import SkeletonCard from '@/components/shared/SkeletonCard';
import ModalTransacao from '@/components/modals/ModalTransacao';
import ModalParcela from '@/components/modals/ModalParcela';
import ModalPagarFatura from '@/components/modals/ModalPagarFatura';
import { formatCurrency, getMesNome, getMesAbrev } from '@/lib/formatters';
import { ChevronDown, ChevronUp, CreditCard, Lock, CheckCircle, AlertCircle, Clock, RotateCcw, Plus, ShoppingBag, RefreshCw } from 'lucide-react';
import type { Transacao, Fatura, Cartao } from '@/types';

type FaturaComExtra = Fatura & {
  total: number;
  cartao?: Cartao;
  limiteUsadoTotal?: number;
  limiteDisponivelReal?: number;
  limiteDisponivelProjetado?: number;
};

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { icon: any; label: string; cls: string }> = {
    aberta:  { icon: Clock,         label: 'Aberta',  cls: 'bg-fluxo-blue/10 text-fluxo-blue border-fluxo-blue/20' },
    fechada: { icon: Lock,          label: 'Fechada', cls: 'bg-fluxo-amber/10 text-fluxo-amber border-fluxo-amber/20' },
    paga:    { icon: CheckCircle,   label: 'Paga',    cls: 'bg-fluxo-green/10 text-fluxo-green border-fluxo-green/20' },
    vencida: { icon: AlertCircle,   label: 'Vencida', cls: 'bg-fluxo-red/10 text-fluxo-red border-fluxo-red/20' },
    parcial: { icon: RotateCcw,     label: 'Parcial', cls: 'bg-fluxo-amber/10 text-fluxo-amber border-fluxo-amber/20' },
    futura:  { icon: Clock,         label: 'Fatura Futura', cls: 'bg-white/5 text-muted border-white/10' },
  };
  const c = cfg[status] || cfg.aberta;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${c.cls}`}>
      <Icon size={10} />
      {c.label}
    </span>
  );
}

function diasParaVencer(dataVencimento: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dataVencimento + 'T00:00:00');
  return Math.round((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function FaturaCard({
  fatura,
  onPagar,
  onVerDetalhe,
  isExpanded,
  contas,
  cartoes,
  onRefresh,
}: {
  fatura: FaturaComExtra;
  onPagar: (f: FaturaComExtra) => void;
  onVerDetalhe: (f: FaturaComExtra) => void;
  isExpanded: boolean;
  contas: any[];
  cartoes: any[];
  onRefresh: () => void;
}) {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [editAjuste, setEditAjuste] = useState(false);
  const [valorAjuste, setValorAjuste] = useState(fatura.valorAjuste?.toString() || '');
  const [editDates, setEditDates] = useState(false);
  const [vencimento, setVencimento] = useState(fatura.dataVencimento);
  const [fechamento, setFechamento] = useState(fatura.dataFechamento);
  const { addToast } = useAlert();

  useEffect(() => {
    setValorAjuste(fatura.valorAjuste?.toString() || '');
    setVencimento(fatura.dataVencimento);
    setFechamento(fatura.dataFechamento);
  }, [fatura.valorAjuste, fatura.dataVencimento, fatura.dataFechamento]);

  useEffect(() => {
    if (isExpanded && fatura.id) {
      setLoadingTx(true);
      api.getFaturaTransacoes(fatura.id)
        .then(setTransacoes)
        .catch(console.error)
        .finally(() => setLoadingTx(false));
    }
  }, [isExpanded, fatura.id]);

  const cartao = fatura.cartao;
  const total = fatura.total;
  // Card-wide limit metrics (across all unpaid invoices, not just this one)
  const limiteUsadoTotal = fatura.limiteUsadoTotal ?? total;
  const limiteDisponivelReal = fatura.limiteDisponivelReal ?? (cartao ? cartao.limite - total : 0);
  const pctUso = cartao ? Math.min(100, (limiteUsadoTotal / cartao.limite) * 100) : 0;
  const temPendenciasOutrasFaturas = cartao && (limiteUsadoTotal > total + 0.01);

  // "Disponível no mês": assuming all prior invoices are paid, how much is free for THIS month?
  // = limit - charges generated in this specific fatura (excluding rollover inherited from prior months)
  const chargesPropriosMes = Math.max(0, total - (fatura.saldoAnteriorRollover || 0));
  const disponivelNoMes = cartao ? Math.max(0, cartao.limite - chargesPropriosMes) : 0;
  const mesLabel = `${getMesAbrev(fatura.mes)}/${String(fatura.ano).slice(2)}`;
  const dias = diasParaVencer(fatura.dataVencimento);
  const isPaga = fatura.status === 'paga';
  const podesPagar = fatura.status !== 'paga';
  const corCard = cartao?.cor || '#a78bfa';

  // Figure out closing date context
  const hoje = new Date().getDate();
  const diaFech = cartao?.diaFechamento || 0;
  const diasParaFechar = diaFech - hoje;
  const jaFechou = fatura.status === 'fechada' || fatura.status === 'paga' || fatura.status === 'vencida';

  return (
    <div className="card overflow-hidden transition-all duration-300" style={{ borderColor: isExpanded ? corCard + '40' : undefined }}>
      {/* Card header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => onVerDetalhe(fatura)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: corCard + '20', color: corCard }}>
            <CreditCard size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{cartao?.nome || 'Cartão'}</p>
              <p className="text-[10px] font-mono text-muted">•••• {cartao?.ultimos4}</p>
              <StatusBadge status={fatura.status} />
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-[10px] text-muted font-mono">
                Fecha dia <span className={fatura.dataFechamento.split('-')[2] !== String(cartao?.diaFechamento).padStart(2, '0') ? 'text-brand-primary font-bold' : ''}>{fatura.dataFechamento.split('-')[2]}</span> • 
                Vence dia <span className={fatura.dataVencimento.split('-')[2] !== String(cartao?.diaVencimento).padStart(2, '0') ? 'text-brand-primary font-bold' : ''}>{fatura.dataVencimento.split('-')[2]}</span>
              </p>
              {!jaFechou && diasParaFechar > 0 && (
                <span className="text-[10px] text-fluxo-blue font-mono">({diasParaFechar}d para fechar)</span>
              )}
              {!isPaga && dias > 0 && (
                <span className={`text-[10px] font-mono ${dias <= 3 ? 'text-fluxo-red' : dias <= 7 ? 'text-fluxo-amber' : 'text-muted'}`}>
                  Vence em {dias}d
                </span>
              )}
              {isPaga && fatura.dataPagamento && (
                <span className="text-[10px] text-fluxo-green font-mono">Pago em {fatura.dataPagamento.split('-').reverse().join('/')}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-muted font-mono">Total</p>
            <p className={`font-mono font-bold text-lg ${total > 0 ? 'text-white' : 'text-muted'}`}>
              {formatCurrency(total)}
            </p>
            {fatura.saldoAnteriorRollover && fatura.saldoAnteriorRollover > 0 && (
              <p className="text-[9px] text-fluxo-amber font-mono">incl. rollover {formatCurrency(fatura.saldoAnteriorRollover)}</p>
            )}
            {fatura.valorAjuste && fatura.valorAjuste !== 0 && (
              <p className="text-[9px] text-brand-primary font-mono">incl. ajuste {formatCurrency(fatura.valorAjuste)}</p>
            )}
          </div>
          {podesPagar && total > 0 && (
            <button
              onClick={e => { e.stopPropagation(); onPagar(fatura); }}
              className="btn-primary text-xs px-3 py-2 shrink-0"
            >
              Pagar
            </button>
          )}
          <div className="text-muted">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Card-wide limit bar */}
      {cartao && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-muted">
            <span>
              Limite usado (cartão): <span className={pctUso > 80 ? 'text-fluxo-red font-bold' : pctUso > 50 ? 'text-fluxo-amber font-bold' : 'text-white'}>{formatCurrency(limiteUsadoTotal)}</span>
              {temPendenciasOutrasFaturas && (
                <span className="text-fluxo-amber ml-1">(incl. faturas anteriores)</span>
              )}
            </span>
            <span className={pctUso > 80 ? 'text-fluxo-red' : pctUso > 50 ? 'text-fluxo-amber' : 'text-muted'}>
              {pctUso.toFixed(0)}% de {formatCurrency(cartao.limite)}
            </span>
          </div>
          <ProgressBar
            value={limiteUsadoTotal}
            max={cartao.limite}
            height={5}
            color={pctUso > 80 ? '#fb7185' : pctUso > 50 ? '#fbbf24' : corCard}
          />
          <div className="grid grid-cols-2 gap-x-4 text-[10px] font-mono pt-0.5">
            <span className="text-muted">
              Disponível agora:{' '}
              <span className={limiteDisponivelReal < cartao.limite * 0.1 ? 'text-fluxo-red font-bold' : 'text-white'}>
                {formatCurrency(limiteDisponivelReal)}
              </span>
            </span>
            <span className="text-muted text-right">
              Disp. {mesLabel} (faturas pagas):{' '}
              <span className="text-fluxo-green font-bold">{formatCurrency(disponivelNoMes)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Rollover info */}
      {fatura.jurosAplicados && fatura.jurosAplicados > 0 && (
        <div className="mt-2 px-3 py-2 rounded-lg bg-fluxo-amber/5 border border-fluxo-amber/20 flex items-center justify-between">
          <span className="text-[10px] text-fluxo-amber font-mono">⚠️ Juros aplicados no pagamento anterior</span>
          <span className="text-[10px] font-mono font-bold text-fluxo-amber">+{formatCurrency(fatura.jurosAplicados)}</span>
        </div>
      )}

      {/* Expanded transactions */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/[0.07] animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <p className="label-mono">Lançamentos ({transacoes.length})</p>
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setEditDates(!editDates); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] font-mono text-muted hover:text-white transition-all"
              >
                <Clock size={10} /> Ajustar Datas
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setEditAjuste(!editAjuste); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] font-mono text-muted hover:text-white transition-all"
              >
                <Plus size={10} /> Ajuste Manual
              </button>
              {fatura.saldoAnteriorRollover && fatura.saldoAnteriorRollover > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-fluxo-amber/10 border border-fluxo-amber/20">
                  <RotateCcw size={10} className="text-fluxo-amber" />
                  <span className="text-[9px] text-fluxo-amber font-mono">Rollover: {formatCurrency(fatura.saldoAnteriorRollover)}</span>
                </div>
              )}
            </div>
          </div>

          {editDates && (
            <div className="mb-4 p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/20 animate-slide-down">
              <p className="text-[10px] font-mono text-brand-primary uppercase font-bold mb-3">Ajustar Datas da Fatura</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[9px] text-muted font-mono block mb-1">DATA DE FECHAMENTO</label>
                  <input
                    className="input-dark w-full text-xs font-mono"
                    type="date"
                    value={fechamento}
                    onChange={e => setFechamento(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] text-muted font-mono block mb-1">DATA DE VENCIMENTO</label>
                  <input
                    className="input-dark w-full text-xs font-mono"
                    type="date"
                    value={vencimento}
                    onChange={e => setVencimento(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await api.updateFatura(fatura.id, { dataVencimento: vencimento, dataFechamento: fechamento });
                      addToast('success', 'Datas atualizadas!');
                      setEditDates(false);
                      onRefresh();
                    } catch (e: any) {
                      addToast('error', e.message || 'Erro ao salvar datas');
                    }
                  }}
                  className="btn-primary text-[10px] px-3 py-1.5 flex-1"
                >
                  Salvar Datas
                </button>
                <button
                  onClick={() => { setEditDates(false); setVencimento(fatura.dataVencimento); setFechamento(fatura.dataFechamento); }}
                  className="btn-ghost text-[10px] px-3 py-1.5 border border-white/10"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {editAjuste && (
            <div className="mb-4 p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/20 animate-slide-down">
              <p className="text-[10px] font-mono text-brand-primary uppercase font-bold mb-2">Ajuste de Saldo / Saldo Inicial</p>
              <div className="flex gap-2">
                <input
                  className="input-dark flex-1 text-sm font-mono"
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00"
                  value={valorAjuste}
                  onChange={e => setValorAjuste(e.target.value)}
                />
                <button
                  onClick={async () => {
                    try {
                      await api.updateFatura(fatura.id, { valorAjuste: parseFloat(valorAjuste) || 0 });
                      addToast('success', 'Ajuste salvo!');
                      setEditAjuste(false);
                      onRefresh();
                    } catch (e: any) {
                      addToast('error', e.message || 'Erro ao salvar ajuste');
                    }
                  }}
                  className="btn-primary text-[10px] px-3 py-1.5"
                >
                  Salvar
                </button>
                <button
                  onClick={() => { setEditAjuste(false); setValorAjuste(fatura.valorAjuste?.toString() || ''); }}
                  className="btn-ghost text-[10px] px-3 py-1.5"
                >
                  Cancelar
                </button>
              </div>
              <p className="text-[9px] text-muted mt-2">Este valor será somado ao total da fatura sem criar uma transação.</p>
            </div>
          )}
          {loadingTx ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
          ) : transacoes.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">Nenhum lançamento nesta fatura</p>
          ) : (
            <div className="space-y-0.5 max-h-64 overflow-y-auto">
              {transacoes.map(t => (
                <TransacaoRow key={t.id} transacao={t} cartoes={cartoes} contas={contas} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FaturaAtual() {
  const { cartoes, loading: loadingCartoes } = useCartoes();
  const { contas } = useContas();
  const { mesAtual, anoAtual, config, refresh } = useApp();
  const { addToast } = useAlert();

  const [faturas, setFaturas] = useState<FaturaComExtra[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalPagar, setModalPagar] = useState<FaturaComExtra | null>(null);
  const [modalTx, setModalTx] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [modalParcela, setModalParcela] = useState(false);
  const [selectedCartaoForTx, setSelectedCartaoForTx] = useState('');

  const fetchFaturas = async () => {
    setLoading(true);
    try {
      const data = await api.getFaturas({ mes: mesAtual, ano: anoAtual });
      setFaturas(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaturas(); }, [mesAtual, anoAtual]);

  const handlePagar = async (data: { contaPagamentoId: string; valorPago: number; dataPagamento: string; taxaJuros?: number }) => {
    if (!modalPagar) return;
    try {
      await api.pagarFatura(modalPagar.id, data);
      addToast('success', data.valorPago < modalPagar.total - 0.01
        ? `Pagamento parcial registrado! Rollover gerado para próxima fatura.`
        : 'Fatura paga com sucesso!'
      );
      fetchFaturas();
      refresh();
    } catch (e: any) {
      addToast('error', e.message || 'Erro ao pagar fatura');
      throw e;
    }
  };

  const handleSaveTx = async (data: Record<string, unknown>) => {
    try {
      if (data.id) {
        await api.updateTransacao(data.id as string, data as any);
        addToast('success', 'Transação atualizada!');
      } else {
        await api.createTransacao({ ...data, tipo: 'credito_cartao', cartaoId: selectedCartaoForTx } as any);
        addToast('success', 'Lançamento adicionado!');
      }
      fetchFaturas();
      refresh();
    } catch { addToast('error', 'Erro ao salvar transação'); }
  };

  const handleParcela = async (data: any) => {
    try {
      const result = await api.criarParcelamento(data);
      addToast('success', `Parcelamento criado! ${result.criadas} parcelas`);
      fetchFaturas();
      refresh();
    } catch { addToast('error', 'Erro ao criar parcelamento'); }
  };

  const handleGerarFaturas = async () => {
    try {
      const result = await api.gerarFaturas(3);
      addToast('success', `${result.criadas} faturas geradas!`);
      fetchFaturas();
    } catch { addToast('error', 'Erro ao gerar faturas'); }
  };

  // Totals across all cards for this month
  const totalGeral = faturas.reduce((acc, f) => acc + f.total, 0);
  const totalPago = faturas.filter(f => f.status === 'paga' || f.status === 'parcial').reduce((acc, f) => acc + (f.valorPago || 0), 0);
  const totalPendente = faturas.filter(f => f.status !== 'paga').reduce((acc, f) => acc + f.total, 0);

  const taxaJurosGlobal = config?.taxaJurosCartoesGlobal ?? 15;

  if (loadingCartoes) return <div className="space-y-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="text-brand-primary" size={24} />
          <div>
            <h2 className="text-xl font-bold">Faturas de Cartão</h2>
            <p className="text-[10px] text-muted font-mono uppercase tracking-wider">Gestão mensal de gastos e limites</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleGerarFaturas} className="btn-ghost flex items-center gap-1.5 border border-white/[0.07] text-xs">
            <RefreshCw size={12} /> Gerar Faturas
          </button>
          <button onClick={() => { setSelectedCartaoForTx(cartoes[0]?.id || ''); setEditingTx(null); setModalTx(true); }}
            className="btn-ghost flex items-center gap-1.5 border border-white/[0.07] text-xs">
            <Plus size={12} /> Lançamento
          </button>
          <button onClick={() => setModalParcela(true)} className="btn-ghost flex items-center gap-1.5 border border-white/[0.07] text-xs">
            <ShoppingBag size={12} /> Parcela
          </button>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="label-mono mb-1">Total em Faturas</p>
          <p className="text-2xl font-extrabold font-mono text-fluxo-amber">{formatCurrency(totalGeral)}</p>
          <p className="text-[10px] text-muted mt-1">{faturas.length} fatura{faturas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="label-mono mb-1">Já Pago</p>
          <p className="text-2xl font-extrabold font-mono text-fluxo-green">{formatCurrency(totalPago)}</p>
          <p className="text-[10px] text-muted mt-1">{faturas.filter(f => f.status === 'paga').length} paga{faturas.filter(f => f.status === 'paga').length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="label-mono mb-1">Pendente</p>
          <p className={`text-2xl font-extrabold font-mono ${totalPendente > 0 ? 'text-fluxo-red' : 'text-fluxo-green'}`}>{formatCurrency(totalPendente)}</p>
          <p className="text-[10px] text-muted mt-1">{faturas.filter(f => f.status !== 'paga').length} pendente{faturas.filter(f => f.status !== 'paga').length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Faturas list */}
      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
      ) : faturas.length === 0 ? (
        <div className="card p-12 text-center">
          <CreditCard size={40} className="text-muted mx-auto mb-3 opacity-30" />
          <p className="text-muted">Nenhuma fatura para {getMesNome(mesAtual)} {anoAtual}</p>
          <button onClick={handleGerarFaturas} className="btn-primary mt-4 text-sm">
            Gerar Faturas Automáticas
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {faturas.map(f => (
            <FaturaCard
              key={f.id}
              fatura={f}
              onPagar={setModalPagar}
              onVerDetalhe={(fat) => setExpandedId(expandedId === fat.id ? null : fat.id)}
              isExpanded={expandedId === f.id}
              contas={contas}
              cartoes={cartoes}
              onRefresh={fetchFaturas}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ModalPagarFatura
        open={!!modalPagar}
        onClose={() => setModalPagar(null)}
        onSubmit={handlePagar}
        fatura={modalPagar}
        contas={contas}
        taxaJurosGlobal={taxaJurosGlobal}
      />
      <ModalTransacao
        open={modalTx}
        onClose={() => setModalTx(false)}
        onSubmit={handleSaveTx}
        contas={contas}
        cartoes={cartoes}
        initialData={editingTx}
      />
      <ModalParcela
        open={modalParcela}
        onClose={() => setModalParcela(false)}
        onSubmit={handleParcela}
        cartoes={cartoes}
        contas={contas}
      />
    </div>
  );
}
