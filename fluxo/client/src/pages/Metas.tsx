import { useState } from 'react';
import { useMetas } from '@/hooks/useMetas';
import { useAlert } from '@/context/AlertContext';
import { useConfirm } from '@/context/ConfirmContext';
import ProgressBar from '@/components/shared/ProgressBar';
import ModalMeta from '@/components/modals/ModalMeta';
import SkeletonCard from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function Metas() {
  const { metas, loading, create, update, depositar, remove } = useMetas();
  const { addToast } = useAlert();
  const { confirm } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<any>(null);
  const [depositoMeta, setDepositoMeta] = useState<string | null>(null);
  const [depositoValor, setDepositoValor] = useState('');
  const [detalheMeta, setDetalheMeta] = useState<string | null>(null);

  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;

  const openNew = () => { setEditingMeta(null); setModalOpen(true); };
  const openEdit = (meta: any) => { setEditingMeta(meta); setModalOpen(true); };

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      if (data.id) {
        await update(data.id as string, data as any);
        addToast('success', 'Meta atualizada!');
      } else {
        await create(data as Parameters<typeof create>[0]);
        addToast('success', 'Meta criada!');
      }
    } catch { addToast('error', 'Erro ao salvar meta'); }
  };

  const handleDeposito = async (metaId: string) => {
    const valor = parseFloat(depositoValor);
    if (!valor || valor <= 0) return;
    try {
      await depositar(metaId, valor, 'Depósito manual');
      addToast('success', `Depósito de ${formatCurrency(valor)} realizado!`);
      setDepositoMeta(null);
      setDepositoValor('');
    } catch { addToast('error', 'Erro ao depositar'); }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('Todo o histórico de depósitos será perdido.', { title: 'Excluir meta?', danger: true, confirmLabel: 'Excluir' })) return;
    try { await remove(id); addToast('success', 'Meta excluída'); } catch { addToast('error', 'Erro'); }
  };

  // Emergency fund special
  const reserva = metas.find(m => m.nome.toLowerCase().includes('reserva') || m.nome.toLowerCase().includes('emergência'));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Emergency fund highlight */}
      {reserva && (
        <div className="card p-6 border-fluxo-green/20 card-glow-green">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{reserva.icone}</span>
              <div>
                <h3 className="text-lg font-bold">{reserva.nome}</h3>
                <p className="text-xs text-muted font-mono">Meta recomendada: 6× gastos médios mensais</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); openEdit(reserva); }}
                className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all">
                <Edit2 size={14} />
              </button>
            </div>
          </div>
          <div className="flex items-end gap-6">
            <div className="flex-1">
              <ProgressBar value={reserva.valorAtual} max={reserva.valorAlvo} color="#34d399" height={10} />
              <div className="flex justify-between mt-2">
                <span className="font-mono text-sm text-fluxo-green">{formatCurrency(reserva.valorAtual)}</span>
                <span className="font-mono text-sm text-muted">{formatCurrency(reserva.valorAlvo)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold font-mono text-fluxo-green">
                {((reserva.valorAtual / reserva.valorAlvo) * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted font-mono">cobertura</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="label-mono">Metas Financeiras</p>
        <button onClick={openNew} className="btn-primary flex items-center gap-1">
          <Plus size={16} /> Nova Meta
        </button>
      </div>

      {/* Grid */}
      {metas.filter(m => m.id !== reserva?.id).length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🎯"
            message="Nenhuma meta criada"
            description="Defina um objetivo financeiro — viagem, reserva de emergência, item especial — e acompanhe seu progresso."
            action={{ label: '+ Criar primeira meta', onClick: openNew }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metas.filter(m => m.id !== reserva?.id).map(meta => {
            const pct = meta.valorAlvo > 0 ? (meta.valorAtual / meta.valorAlvo) * 100 : 0;
            const diasRestantes = meta.prazo ? Math.ceil((new Date(meta.prazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <div key={meta.id} className="card hover:scale-[1.01] transition-all cursor-pointer"
                onClick={() => setDetalheMeta(detalheMeta === meta.id ? null : meta.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{meta.icone}</span>
                    <div>
                      <p className="text-sm font-semibold">{meta.nome}</p>
                      {meta.prazo && (
                        <p className={`text-[10px] font-mono ${diasRestantes !== null && diasRestantes < 30 ? 'text-fluxo-red' : 'text-muted'}`}>
                          {diasRestantes !== null && diasRestantes > 0 ? `${diasRestantes} dias` : 'Vencida'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <span className={`badge text-[10px] ${meta.status === 'ativa' ? 'bg-fluxo-green/10 text-fluxo-green' : meta.status === 'concluida' ? 'bg-fluxo-blue/10 text-fluxo-blue' : 'bg-muted2/50 text-muted'}`}>
                      {meta.status}
                    </span>
                  </div>
                </div>
                <ProgressBar value={meta.valorAtual} max={meta.valorAlvo} color={meta.cor} height={6} />
                <div className="flex justify-between mt-2">
                  <span className="font-mono text-xs" style={{ color: meta.cor }}>{formatCurrency(meta.valorAtual)}</span>
                  <span className="font-mono text-xs text-muted">{formatCurrency(meta.valorAlvo)}</span>
                </div>

                {/* Deposit inline */}
                {depositoMeta === meta.id && (
                  <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                    <input className="input-dark flex-1" type="number" step="0.01" placeholder="Valor"
                      value={depositoValor} onChange={e => setDepositoValor(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleDeposito(meta.id)}
                      autoFocus />
                    <button onClick={() => handleDeposito(meta.id)} className="btn-primary text-sm px-3">Depositar</button>
                  </div>
                )}

                {/* Detail panel */}
                {detalheMeta === meta.id && (
                  <div className="mt-4 pt-3 border-t border-white/[0.07] space-y-3" onClick={e => e.stopPropagation()}>
                    {/* Deposit history */}
                    <p className="text-xs text-muted font-mono">Histórico de Depósitos</p>
                    {meta.depositos.length === 0 ? (
                      <p className="text-xs text-muted">Nenhum depósito</p>
                    ) : (
                      <div className="space-y-1 max-h-[120px] overflow-y-auto">
                        {meta.depositos.map((d, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-muted font-mono">{formatDate(d.data)}</span>
                            <span className="font-mono text-fluxo-green">+{formatCurrency(d.valor)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => setDepositoMeta(depositoMeta === meta.id ? null : meta.id)}
                        className="btn-primary text-xs flex-1">
                        💰 Depositar
                      </button>
                      <button onClick={() => openEdit(meta)}
                        className="btn-ghost text-xs px-3">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(meta.id)}
                        className="btn-ghost text-xs text-fluxo-red">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ModalMeta
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        initialData={editingMeta}
      />
    </div>
  );
}
