import { useState } from 'react';
import { useContas } from '@/hooks/useContas';
import { useTransacoes } from '@/hooks/useTransacoes';
import { useCartoes } from '@/hooks/useCartoes';
import { useApp } from '@/context/AppContext';
import { useAlert } from '@/context/AlertContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useDashboard } from '@/hooks/useDashboard';
import TransacaoRow from '@/components/shared/TransacaoRow';
import ModalConta from '@/components/modals/ModalConta';
import ModalTransferencia from '@/components/modals/ModalTransferencia';
import ModalTransacao from '@/components/modals/ModalTransacao';
import SkeletonCard from '@/components/shared/SkeletonCard';
import { formatCurrency, getCategoriaLabel } from '@/lib/formatters';
import { Plus, ArrowLeftRight, Trash2, Edit3, Check, X, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { api } from '@/lib/api';

export default function Contas() {
  const contasHook = useContas();
  const { contas, loading, create, remove, refetch } = contasHook;
  const { cartoes } = useCartoes();
  const { data: dashboard } = useDashboard();
  const txHook = useTransacoes();
  const { transacoes, refetch: refetchTx, remove: removeTx, update: updateTx, create: createTx } = txHook;
  const { addToast } = useAlert();
  const { confirm } = useConfirm();
  const { refresh } = useApp();

  const [modalConta, setModalConta] = useState(false);
  const [modalTransf, setModalTransf] = useState(false);
  const [modalTx, setModalTx] = useState(false);
  const [editingConta, setEditingConta] = useState<any>(null);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [selectedConta, setSelectedConta] = useState<string | null>(null);
  const [editingSaldo, setEditingSaldo] = useState<string | null>(null);
  const [novoSaldo, setNovoSaldo] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('todas');
  const [showAll, setShowAll] = useState(false);

  if (loading) return <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>;

  const saldoTotal = dashboard?.contasSaldo.reduce((acc, cs) => acc + cs.saldoAtual, 0) ?? 0;

  const contasComSaldo = contas.map(c => {
    const cs = dashboard?.contasSaldo.find(cs => cs.conta.id === c.id);
    return { ...c, saldoAtual: cs?.saldoAtual ?? c.saldoInicial };
  });

  const getContaStats = (contaId: string) => {
    const txs = transacoes.filter(t => t.contaId === contaId || t.contaDestinoId === contaId);
    const entradas = txs
      .filter(t => t.tipo === 'entrada' || (t.tipo === 'transferencia' && t.contaDestinoId === contaId))
      .reduce((acc, t) => acc + t.valor, 0);
    const saidas = txs
      .filter(t => t.tipo === 'debito' || (t.tipo === 'transferencia' && t.contaId === contaId))
      .reduce((acc, t) => acc + t.valor, 0);
    return { entradas, saidas };
  };

  const categoriasPresentes = [...new Set(transacoes.map(t => t.categoria))].sort();

  const txFiltradas = (selectedConta
    ? transacoes.filter(t => t.contaId === selectedConta || t.contaDestinoId === selectedConta)
    : transacoes
  )
    .filter(t => !search || t.descricao.toLowerCase().includes(search.toLowerCase()))
    .filter(t => catFilter === 'todas' || t.categoria === catFilter);

  const txDisplay = showAll ? txFiltradas : txFiltradas.slice(0, 30);

  const handleSaveConta = async (data: any) => {
    try {
      if (data.id) {
        await contasHook.update(data.id, data);
        addToast('success', 'Conta atualizada!');
      } else {
        await create(data as Parameters<typeof create>[0]);
        addToast('success', 'Conta criada!');
      }
      refresh();
    } catch { addToast('error', 'Erro ao salvar conta'); }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('Esta ação é irreversível. O saldo e histórico associados serão perdidos.', { title: 'Excluir conta?', danger: true, confirmLabel: 'Excluir' })) return;
    try {
      await remove(id);
      addToast('success', 'Conta excluída');
      refresh();
    } catch { addToast('error', 'Erro ao excluir'); }
  };

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
    } catch { addToast('error', 'Erro ao salvar transação'); }
  };

  const handleDeleteTx = async (id: string) => {
    if (!await confirm('Esta transação será removida permanentemente.', { title: 'Excluir transação?', danger: true, confirmLabel: 'Excluir' })) return;
    try {
      await removeTx(id);
      addToast('success', 'Transação excluída');
      refresh();
    } catch { addToast('error', 'Erro ao excluir'); }
  };

  const handleTransf = async (data: { contaId: string; contaDestinoId: string; valor: number; data: string }) => {
    try {
      await api.createTransacao({
        descricao: 'Transferência', valor: data.valor, tipo: 'transferencia',
        data: data.data, categoria: 'transferencia',
        contaId: data.contaId, contaDestinoId: data.contaDestinoId, recorrente: false,
      });
      addToast('success', 'Transferência realizada!');
      refetch(); refetchTx(); refresh();
    } catch { addToast('error', 'Erro na transferência'); }
  };

  const startEditSaldo = (contaId: string, saldoAtual: number) => {
    setEditingSaldo(contaId);
    setNovoSaldo(saldoAtual.toFixed(2));
  };

  const confirmEditSaldo = async () => {
    if (!editingSaldo || !novoSaldo) return;
    try {
      await api.updateSaldoConta(editingSaldo, parseFloat(novoSaldo));
      addToast('success', 'Saldo atualizado!');
      setEditingSaldo(null);
      setNovoSaldo('');
      refetch();
      refresh();
    } catch { addToast('error', 'Erro ao atualizar saldo'); }
  };

  const cancelEditSaldo = () => {
    setEditingSaldo(null);
    setNovoSaldo('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="label-mono">Saldo Consolidado</p>
          <p className={`text-3xl font-extrabold font-mono ${saldoTotal >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
            {formatCurrency(saldoTotal)}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalTransf(true)} className="btn-ghost flex items-center gap-2 border border-white/[0.07]">
            <ArrowLeftRight size={16} /> Transferir
          </button>
          <button onClick={() => { setEditingConta(null); setModalConta(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nova Conta
          </button>
        </div>
      </div>

      {/* Cards */}
      {contas.length === 0 ? (
        <div className="card p-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted">Nenhuma conta cadastrada</p>
          <button onClick={() => { setEditingConta(null); setModalConta(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={14} /> Criar primeira conta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contasComSaldo.map(conta => {
            const stats = getContaStats(conta.id);
            return (
              <div
                key={conta.id}
                className={`card p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] group ${
                  selectedConta === conta.id ? 'ring-2' : ''
                }`}
                style={{
                  borderColor: selectedConta === conta.id ? conta.cor : undefined,
                  boxShadow: `0 0 30px ${conta.cor}15`,
                }}
                onClick={() => setSelectedConta(selectedConta === conta.id ? null : conta.id)}
              >
                {/* Card header: icon+name on the left, action buttons on the right */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ background: conta.cor + '20', color: conta.cor }}
                    >
                      {conta.banco[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{conta.nome}</p>
                      <p className="text-[10px] text-muted font-mono uppercase">{conta.tipo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingConta(conta); setModalConta(true); }}
                      className="text-muted hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                      title="Editar conta"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(conta.id); }}
                      className="text-muted hover:text-fluxo-red transition-colors p-1.5 rounded-lg hover:bg-fluxo-red/10"
                      title="Excluir conta"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Balance: edit mode or display mode */}
                {editingSaldo === conta.id ? (
                  <div className="bg-s2/50 rounded-xl p-3 border border-white/[0.05]" onClick={e => e.stopPropagation()}>
                    <p className="text-[10px] text-muted font-mono uppercase mb-2">Ajustar Saldo Atual</p>
                    <div className="flex items-center gap-2">
                      <span className="text-muted text-sm font-mono">R$</span>
                      <input
                        className="bg-transparent border-b border-brand-primary flex-1 text-lg font-mono font-bold focus:outline-none"
                        type="number"
                        step="0.01"
                        value={novoSaldo}
                        onChange={e => setNovoSaldo(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmEditSaldo(); if (e.key === 'Escape') cancelEditSaldo(); }}
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <button onClick={confirmEditSaldo} className="p-1.5 rounded-lg bg-fluxo-green/10 text-fluxo-green hover:bg-fluxo-green/20">
                          <Check size={14} />
                        </button>
                        <button onClick={cancelEditSaldo} className="p-1.5 rounded-lg bg-white/5 text-muted hover:text-white">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <p className={`text-2xl font-extrabold font-mono tracking-tight ${conta.saldoAtual >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                        {formatCurrency(conta.saldoAtual)}
                      </p>
                      {conta.saldoAtual >= 0
                        ? <TrendingUp size={16} className="text-fluxo-green mb-1 opacity-60" />
                        : <TrendingDown size={16} className="text-fluxo-red mb-1 opacity-60" />
                      }
                    </div>

                    {/* Month income/expense breakdown */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-fluxo-green/5 rounded-lg px-2.5 py-1.5">
                        <p className="text-[9px] font-mono uppercase text-muted mb-0.5">Entradas</p>
                        <p className="text-xs font-bold font-mono text-fluxo-green">{formatCurrency(stats.entradas)}</p>
                      </div>
                      <div className="bg-fluxo-red/5 rounded-lg px-2.5 py-1.5">
                        <p className="text-[9px] font-mono uppercase text-muted mb-0.5">Saídas</p>
                        <p className="text-xs font-bold font-mono text-fluxo-red">{formatCurrency(stats.saidas)}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); startEditSaldo(conta.id, conta.saldoAtual); }}
                      className="w-full py-1.5 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-mono uppercase hover:bg-brand-primary/20 transition-all"
                    >
                      Ajustar Saldo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Extrato */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="label-mono">
            {selectedConta ? `Extrato — ${contas.find(c => c.id === selectedConta)?.nome}` : 'Todas as Transações do Mês'}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                className="bg-white/5 border border-white/[0.07] rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono placeholder:text-muted/50 focus:outline-none focus:border-brand-primary/50 w-44"
                placeholder="Buscar transação..."
                value={search}
                onChange={e => { setSearch(e.target.value); setShowAll(false); }}
              />
            </div>
            <select
              className="bg-white/5 border border-white/[0.07] rounded-lg px-2 py-1.5 text-xs font-mono text-muted focus:outline-none focus:border-brand-primary/50"
              value={catFilter}
              onChange={e => { setCatFilter(e.target.value); setShowAll(false); }}
            >
              <option value="todas">Todas</option>
              {categoriasPresentes.map(c => (
                <option key={c} value={c}>{getCategoriaLabel(c as any)}</option>
              ))}
            </select>
            <button
              onClick={() => { setEditingTx(null); setModalTx(true); }}
              className="btn-primary flex items-center gap-1.5 py-1.5 text-xs"
            >
              <Plus size={13} /> Nova
            </button>
            <p className="text-xs text-muted font-mono">{txFiltradas.length} tx</p>
          </div>
        </div>
        <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
          {txFiltradas.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">
              {search ? `Nenhuma transação para "${search}"` : 'Sem transações no período'}
            </p>
          ) : (
            <>
              {txDisplay.map(t => (
                <TransacaoRow
                  key={t.id}
                  transacao={t}
                  cartoes={cartoes}
                  contas={contas}
                  onDelete={handleDeleteTx}
                  onEdit={(tx) => { setEditingTx(tx); setModalTx(true); }}
                />
              ))}
              {!showAll && txFiltradas.length > 30 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full py-3 text-xs text-muted font-mono hover:text-white transition-colors text-center"
                >
                  Ver mais {txFiltradas.length - 30} transações ↓
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <ModalConta open={modalConta} onClose={() => setModalConta(false)} onSubmit={handleSaveConta} initial={editingConta} />
      <ModalTransferencia open={modalTransf} onClose={() => setModalTransf(false)} onSubmit={handleTransf} contas={contas} />
      <ModalTransacao open={modalTx} onClose={() => setModalTx(false)} onSubmit={handleSaveTx} contas={contas} cartoes={cartoes} initialData={editingTx} />
    </div>
  );
}
