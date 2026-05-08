import { useRecorrencias } from '@/hooks/useRecorrencias';
import { useCartoes } from '@/hooks/useCartoes';
import { useContas } from '@/hooks/useContas';
import { useAlert } from '@/context/AlertContext';
import { useConfirm } from '@/context/ConfirmContext';
import { formatCurrency, getCategoriaLabel, getCategoriaColor } from '@/lib/formatters';
import MetricCard from '@/components/shared/MetricCard';
import SkeletonCard from '@/components/shared/SkeletonCard';
import ModalRecorrencia from '@/components/modals/ModalRecorrencia';
import { Power, Trash2, Plus, Edit2 } from 'lucide-react';
import { useState } from 'react';

export default function Recorrentes() {
  const { recorrencias, loading, toggle, remove, create, update } = useRecorrencias();
  const { cartoes } = useCartoes();
  const { contas } = useContas();
  const { addToast } = useAlert();
  const { confirm } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  if (loading) return <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;

  const entradasRecorrentes = recorrencias.filter(r => r.ativa && r.tipo === 'entrada').reduce((acc, r) => acc + r.valor, 0);
  const totalMensal = recorrencias.filter(r => r.ativa && r.tipo === 'debito').reduce((acc, r) => acc + r.valor, 0);
  const totalAnual = totalMensal * 12;
  const ativas = recorrencias.filter(r => r.ativa).length;

  const handleToggle = async (id: string) => {
    try { await toggle(id); addToast('info', 'Status atualizado'); } catch { addToast('error', 'Erro'); }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('Esta recorrência será removida permanentemente.', { title: 'Excluir recorrência?', danger: true, confirmLabel: 'Excluir' })) return;
    try { await remove(id); addToast('success', 'Recorrência excluída'); } catch { addToast('error', 'Erro'); }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (data.id) await update(data.id, data);
      else await create(data);
      addToast('success', 'Salvo com sucesso!');
    } catch {
      addToast('error', 'Erro ao salvar');
    }
  };

  const openNew = () => { setEditingData(null); setModalOpen(true); };
  const openEdit = (rec: any) => { setEditingData(rec); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-2">
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova Recorrência
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Custo Mensal (Saídas)" value={formatCurrency(totalMensal)} color="amber" />
        <MetricCard label="Receita Mensal (Entradas)" value={formatCurrency(entradasRecorrentes)} color="green" />
        <MetricCard label="Ativas" value={`${ativas} de ${recorrencias.length}`} color="purple" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {recorrencias.map(rec => {
          const cartao = cartoes.find(c => c.id === rec.cartaoId);
          return (
            <div key={rec.id} className={`card flex items-center gap-4 ${!rec.ativa ? 'opacity-50' : ''}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: getCategoriaColor(rec.categoria) + '15' }}>
                {rec.descricao.includes('Netflix') ? '🎬' :
                 rec.descricao.includes('Spotify') ? '🎵' :
                 rec.descricao.includes('Smart Fit') ? '🏋️' :
                 rec.descricao.includes('Amazon') ? '📦' :
                 rec.descricao.includes('iCloud') ? '☁️' :
                 rec.descricao.includes('ChatGPT') ? '🤖' : '📱'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{rec.descricao}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="badge text-[10px]" style={{ background: getCategoriaColor(rec.categoria) + '15', color: getCategoriaColor(rec.categoria) }}>
                    {getCategoriaLabel(rec.categoria)}
                  </span>
                  {cartao && (
                    <span className="badge text-[10px]" style={{ background: cartao.cor + '15', color: cartao.cor }}>
                      {cartao.nome}
                    </span>
                  )}
                  <span className="text-[10px] text-muted font-mono">Dia {rec.diaCobranca}</span>
                </div>
              </div>
              <span className={`font-mono text-sm font-semibold ${rec.tipo === 'entrada' ? 'text-fluxo-green' : 'text-fluxo-amber'}`}>
                {rec.tipo === 'entrada' ? '+' : '-'}{formatCurrency(rec.valor)}
              </span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(rec)}
                  className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleToggle(rec.id)}
                  className={`p-1.5 rounded-lg transition-all ${rec.ativa ? 'text-fluxo-green hover:bg-fluxo-green/10' : 'text-muted hover:bg-white/5'}`}>
                  <Power size={14} />
                </button>
                <button onClick={() => handleDelete(rec.id)}
                  className="p-1.5 rounded-lg text-muted hover:text-fluxo-red hover:bg-fluxo-red/10 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ModalRecorrencia
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        cartoes={cartoes}
        contas={contas}
        initialData={editingData}
      />
    </div>
  );
}
