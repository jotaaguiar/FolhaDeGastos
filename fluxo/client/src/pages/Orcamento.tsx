import { useState } from 'react';
import { useOrcamento } from '@/hooks/useOrcamento';
import { useTransacoes } from '@/hooks/useTransacoes';
import { useAlert } from '@/context/AlertContext';
import { useConfirm } from '@/context/ConfirmContext';
import MetricCard from '@/components/shared/MetricCard';
import ProgressBar from '@/components/shared/ProgressBar';
import ModalOrcamento from '@/components/modals/ModalOrcamento';
import SkeletonCard from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, getCategoriaLabel, getCategoriaColor, getCategoriaIcon } from '@/lib/formatters';
import { calcularRegra503020 } from '@/lib/calculators';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import type { Categoria, OrcamentoCategoria } from '@/types';

export default function Orcamento() {
  const { orcamento, loading, create, update, remove } = useOrcamento();
  const { transacoes } = useTransacoes();
  const { addToast } = useAlert();
  const { confirm } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<(OrcamentoCategoria & { gasto: number }) | null>(null);

  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;

  const totalOrcado = orcamento.reduce((a, o) => a + o.limite, 0);
  const totalGasto = orcamento.reduce((a, o) => a + o.gasto, 0);
  const economia = totalOrcado - totalGasto;

  const totalEntradas = transacoes.filter(t => t.tipo === 'entrada').reduce((a, t) => a + t.valor, 0);
  const regra = calcularRegra503020(transacoes, totalEntradas);

  const openNew = () => { setEditingItem(null); setModalOpen(true); };
  const openEdit = (item: OrcamentoCategoria & { gasto: number }) => { setEditingItem(item); setModalOpen(true); };

  const handleSave = async (data: { categoria: Categoria; limite: number; alertaPct: number }) => {
    try {
      if (editingItem) {
        await update(editingItem.id, data);
        addToast('success', 'Limite atualizado!');
      } else {
        await create(data);
        addToast('success', 'Limite criado!');
      }
    } catch { addToast('error', 'Erro ao salvar limite'); }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('O limite desta categoria será removido.', { title: 'Excluir limite?', danger: true, confirmLabel: 'Excluir' })) return;
    try { await remove(id); addToast('success', 'Limite removido'); }
    catch { addToast('error', 'Erro ao remover'); }
  };

  // Categories with spending but no budget
  const gastoPorCat: Record<string, number> = {};
  transacoes.filter(t => t.tipo !== 'entrada' && t.tipo !== 'transferencia')
    .forEach(t => { gastoPorCat[t.categoria] = (gastoPorCat[t.categoria] || 0) + t.valor; });
  const semLimite = Object.entries(gastoPorCat)
    .filter(([cat]) => !orcamento.find(o => o.categoria === cat))
    .map(([cat, gasto]) => ({ categoria: cat as Categoria, gasto }))
    .sort((a, b) => b.gasto - a.gasto);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Total Orçado" value={formatCurrency(totalOrcado)} color="blue" />
        <MetricCard label="Total Gasto" value={formatCurrency(totalGasto)} color="red" />
        <MetricCard label="Economia" value={formatCurrency(economia)} color={economia >= 0 ? 'green' : 'red'} />
      </div>

      {/* 50/30/20 Rule */}
      <div className="card">
        <p className="label-mono mb-4">Regra 50 / 30 / 20</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { label: 'Necessidades (50%)', data: regra.necessidades, color: '#60a5fa' },
            { label: 'Desejos (30%)', data: regra.desejos, color: '#f472b6' },
            { label: 'Poupança (20%)', data: regra.poupanca, color: '#34d399' },
          ].map(item => {
            const dentro = item.data.gasto <= item.data.ideal;
            return (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className={`badge text-[10px] ${dentro ? 'bg-fluxo-green/10 text-fluxo-green' : 'bg-fluxo-red/10 text-fluxo-red'}`}>
                    {dentro ? 'Dentro' : 'Acima'}
                  </span>
                </div>
                <ProgressBar value={item.data.gasto} max={item.data.ideal} color={item.color} height={8} />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted font-mono">{formatCurrency(item.data.gasto)}</span>
                  <span className="text-[10px] text-muted font-mono">Ideal: {formatCurrency(item.data.ideal)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget cards */}
      <div className="flex items-center justify-between">
        <p className="label-mono">Limites por Categoria</p>
        <button onClick={openNew} className="btn-primary flex items-center gap-1 text-sm">
          <Plus size={14} /> Novo Limite
        </button>
      </div>

      {orcamento.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="📊"
            message="Nenhum limite definido"
            description="Crie limites por categoria para controlar seus gastos e receber alertas quando estiver chegando no teto."
            action={{ label: '+ Criar primeiro limite', onClick: openNew }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orcamento.map(o => {
            const pct = o.limite > 0 ? (o.gasto / o.limite) * 100 : 0;
            const restante = o.limite - o.gasto;
            return (
              <div key={o.id} className="card hover:scale-[1.01] transition-all group">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{getCategoriaIcon(o.categoria)}</span>
                  <span className="text-sm font-semibold flex-1">{getCategoriaLabel(o.categoria)}</span>
                  {pct > o.alertaPct && (
                    <span className="badge text-[10px] bg-fluxo-red/10 text-fluxo-red">⚠ {pct.toFixed(0)}%</span>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(o)}
                      className="p-1 rounded text-muted hover:text-white hover:bg-white/10 transition-all">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(o.id)}
                      className="p-1 rounded text-muted hover:text-fluxo-red hover:bg-fluxo-red/10 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <ProgressBar value={o.gasto} max={o.limite} height={6} />
                <div className="flex justify-between mt-2">
                  <span className="text-xs font-mono text-muted">{formatCurrency(o.gasto)} / {formatCurrency(o.limite)}</span>
                  <span className={`text-xs font-mono ${restante >= 0 ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                    {restante >= 0 ? `Resta ${formatCurrency(restante)}` : `Excedeu ${formatCurrency(Math.abs(restante))}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Without limits */}
      {semLimite.length > 0 && (
        <div className="card">
          <p className="label-mono mb-3">Sem Limite Definido</p>
          <div className="space-y-2">
            {semLimite.map(item => (
              <div key={item.categoria} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-2">
                  <span>{getCategoriaIcon(item.categoria)}</span>
                  <span className="text-sm">{getCategoriaLabel(item.categoria)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-fluxo-amber">{formatCurrency(item.gasto)}</span>
                  <span className="text-[10px] text-muted font-mono">Sugestão: {formatCurrency(item.gasto * 1.1)}</span>
                  <button
                    onClick={() => { setEditingItem(null); setModalOpen(true); }}
                    className="text-[10px] text-brand-primary hover:underline font-mono"
                  >
                    + Definir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ModalOrcamento
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        onSubmit={handleSave}
        initial={editingItem ?? undefined}
      />
    </div>
  );
}
