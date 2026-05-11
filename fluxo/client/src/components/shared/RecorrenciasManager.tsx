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

interface RecorrenciasManagerProps {
  filterType?: 'conta' | 'cartao';
}

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

export default function RecorrenciasManager({ filterType }: RecorrenciasManagerProps) {
  const { recorrencias: allRecorrencias, loading, toggle, remove, create, update } = useRecorrencias();
  const { cartoes } = useCartoes();
  const { contas } = useContas();
  const { addToast } = useAlert();
  const { confirm } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const recorrencias = allRecorrencias.filter(r => {
    if (!filterType) return true;
    if (filterType === 'cartao') return r.tipo === 'credito_cartao';
    return r.tipo === 'debito' || r.tipo === 'entrada';
  });

  if (loading) return <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;

  const hoje = new Date();
  const mesRef = hoje.getMonth() + 1;
  const anoRef = hoje.getFullYear();
  const recorrenciasDoMes = recorrencias.filter(r => recorrenciaValeNoMes(r, mesRef, anoRef));
  const entradasRecorrentes = recorrenciasDoMes.filter(r => r.tipo === 'entrada').reduce((acc, r) => acc + r.valor, 0);
  const totalMensal = recorrenciasDoMes.filter(r => r.tipo === 'debito' || r.tipo === 'credito_cartao').reduce((acc, r) => acc + r.valor, 0);
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

  const entradas = recorrencias.filter(r => r.tipo === 'entrada');
  const saidas = recorrencias.filter(r => r.tipo === 'debito' || r.tipo === 'credito_cartao');

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-2">
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova Recorrência
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Saídas Mensais" value={formatCurrency(totalMensal)} color="amber" />
        <MetricCard label="Entradas Mensais" value={formatCurrency(entradasRecorrentes)} color="green" />
        <MetricCard label="Ativas" value={`${ativas} de ${recorrencias.length}`} color="purple" />
      </div>

      {recorrencias.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted text-sm">Nenhuma recorrência cadastrada.</p>
          <button onClick={openNew} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> Adicionar primeira
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {entradas.length > 0 && (
            <RecorrenciasTable
              title="Entradas Fixas"
              rows={entradas}
              cartoes={cartoes}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
              accent="green"
            />
          )}
          {saidas.length > 0 && (
            <RecorrenciasTable
              title="Saídas Fixas"
              rows={saidas}
              cartoes={cartoes}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
              accent="red"
            />
          )}
        </div>
      )}

      <ModalRecorrencia
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        cartoes={cartoes}
        contas={contas}
        initialData={editingData}
        isCartaoOnly={filterType === 'cartao'}
      />
    </div>
  );
}

interface TableProps {
  title: string;
  rows: any[];
  cartoes: any[];
  onEdit: (rec: any) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  accent: 'green' | 'red';
}

function RecorrenciasTable({ title, rows, cartoes, onEdit, onToggle, onDelete, accent }: TableProps) {
  const accentClass = accent === 'green' ? 'text-fluxo-green' : 'text-fluxo-red';
  const signPrefix = accent === 'green' ? '+' : '-';

  return (
    <div className="card overflow-hidden p-0">
      <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
        <p className="label-mono">{title}</p>
        <span className={`text-xs font-mono font-semibold ${accentClass}`}>
          {signPrefix}{formatCurrency(rows.filter(r => r.ativa).reduce((a, r) => a + r.valor, 0))}/mês
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="text-left px-4 py-2.5 text-[10px] font-mono text-muted uppercase tracking-wider w-8"></th>
              <th className="text-left px-4 py-2.5 text-[10px] font-mono text-muted uppercase tracking-wider">Descrição</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-mono text-muted uppercase tracking-wider">Categoria</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-mono text-muted uppercase tracking-wider">Valor</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-mono text-muted uppercase tracking-wider">Dia</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-mono text-muted uppercase tracking-wider">Início</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-mono text-muted uppercase tracking-wider">Meses</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-mono text-muted uppercase tracking-wider w-24"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((rec, idx) => {
              const cartao = cartoes.find(c => c.id === rec.cartaoId);
              return (
                <tr
                  key={rec.id}
                  className={`border-b border-white/[0.03] last:border-0 transition-colors hover:bg-white/[0.02] ${!rec.ativa ? 'opacity-40' : ''} ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                >
                  {/* Status dot */}
                  <td className="px-4 py-3">
                    <div className={`w-2 h-2 rounded-full mx-auto ${rec.ativa ? (accent === 'green' ? 'bg-fluxo-green' : 'bg-fluxo-red') : 'bg-white/20'}`} />
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[160px]">{rec.descricao}</p>
                    {cartao && (
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: cartao.cor }}>
                        {cartao.nome} •••• {cartao.ultimos4}
                      </p>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span
                      className="badge text-[10px] whitespace-nowrap"
                      style={{
                        background: getCategoriaColor(rec.categoria) + '15',
                        color: getCategoriaColor(rec.categoria),
                      }}
                    >
                      {getCategoriaLabel(rec.categoria)}
                    </span>
                  </td>

                  {/* Value */}
                  <td className={`px-4 py-3 text-right font-mono font-semibold tabular-nums ${accentClass}`}>
                    {signPrefix}{formatCurrency(rec.valor)}
                  </td>

                  {/* Day */}
                  <td className="px-4 py-3 text-center font-mono text-sm text-muted tabular-nums">
                    {rec.diaCobranca}
                  </td>

                  {/* Start */}
                  <td className="px-4 py-3 font-mono text-xs text-muted tabular-nums whitespace-nowrap">
                    {rec.inicioEm ? rec.inicioEm.slice(0, 10) : '—'}
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-3 text-center font-mono text-xs text-muted tabular-nums">
                    {rec.quantidadeMeses ?? 12}m
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(rec)}
                        className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all"
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => onToggle(rec.id)}
                        className={`p-1.5 rounded-lg transition-all ${rec.ativa ? 'text-fluxo-green hover:bg-fluxo-green/10' : 'text-muted hover:bg-white/5'}`}
                        title={rec.ativa ? 'Desativar' : 'Ativar'}
                      >
                        <Power size={13} />
                      </button>
                      <button
                        onClick={() => onDelete(rec.id)}
                        className="p-1.5 rounded-lg text-muted hover:text-fluxo-red hover:bg-fluxo-red/10 transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="sm:hidden divide-y divide-white/[0.04]">
        {rows.map(rec => {
          const cartao = cartoes.find(c => c.id === rec.cartaoId);
          return (
            <div key={rec.id} className={`flex items-center gap-3 px-4 py-3 ${!rec.ativa ? 'opacity-40' : ''}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${rec.ativa ? (accent === 'green' ? 'bg-fluxo-green' : 'bg-fluxo-red') : 'bg-white/20'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{rec.descricao}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span
                    className="badge text-[10px]"
                    style={{ background: getCategoriaColor(rec.categoria) + '15', color: getCategoriaColor(rec.categoria) }}
                  >
                    {getCategoriaLabel(rec.categoria)}
                  </span>
                  <span className="text-[10px] text-muted font-mono">dia {rec.diaCobranca}</span>
                  {rec.quantidadeMeses && <span className="text-[10px] text-muted font-mono">{rec.quantidadeMeses}m</span>}
                  {cartao && <span className="text-[10px] font-mono" style={{ color: cartao.cor }}>{cartao.nome}</span>}
                </div>
              </div>
              <span className={`font-mono text-sm font-semibold tabular-nums shrink-0 ${accentClass}`}>
                {signPrefix}{formatCurrency(rec.valor)}
              </span>
              <div className="flex gap-0.5 shrink-0">
                <button onClick={() => onEdit(rec)} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => onToggle(rec.id)} className={`p-1.5 rounded-lg transition-all ${rec.ativa ? 'text-fluxo-green hover:bg-fluxo-green/10' : 'text-muted hover:bg-white/5'}`}>
                  <Power size={13} />
                </button>
                <button onClick={() => onDelete(rec.id)} className="p-1.5 rounded-lg text-muted hover:text-fluxo-red hover:bg-fluxo-red/10 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
