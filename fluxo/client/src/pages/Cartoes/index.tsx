import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCartoes } from '@/hooks/useCartoes';
import { useContas } from '@/hooks/useContas';
import { useApp } from '@/context/AppContext';
import { useAlert } from '@/context/AlertContext';
import { useConfirm } from '@/context/ConfirmContext';
import { api } from '@/lib/api';
import CartaoWidget from '@/components/shared/CartaoWidget';
import ModalCartao from '@/components/modals/ModalCartao';
import ModalParcela from '@/components/modals/ModalParcela';
import SkeletonCard from '@/components/shared/SkeletonCard';
import { Plus, CreditCard, FileText, Calendar, Repeat, ShoppingBag, ArrowLeft } from 'lucide-react';

const tabs = [
  { to: '/cartoes', label: 'Meus Cartões', icon: CreditCard, end: true },
  { to: '/cartoes/fatura', label: 'Fatura Atual', icon: FileText },
  { to: '/cartoes/mensal', label: 'Visão Mensal', icon: Calendar },
  { to: '/cartoes/recorrentes', label: 'Assinaturas', icon: Repeat },
];

export default function Cartoes() {
  const navigate = useNavigate();
  const { cartoes, loading, create, update, remove, refetch } = useCartoes();
  const { contas } = useContas();
  const { addToast } = useAlert();
  const { confirm } = useConfirm();
  const { refresh, config } = useApp();
  const [modalCartao, setModalCartao] = useState(false);
  const [modalParcela, setModalParcela] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const isIndex = location.pathname === '/cartoes' || location.pathname === '/cartoes/';

  const handleSave = async (data: any, initialConfig?: any) => {
    try {
      if (data.id) {
        await update(data.id, data);
        addToast('success', 'Cartão atualizado!');
      } else {
        await create(data, initialConfig);
        addToast('success', initialConfig?.mode !== 'none' ? 'Cartão criado com configurações iniciais!' : 'Cartão criado!');
      }
      refresh();
    } catch (err: any) { 
      addToast('error', err.message || 'Erro ao salvar cartão'); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('As transações vinculadas permanecerão no histórico.', { title: 'Excluir cartão?', danger: true, confirmLabel: 'Excluir' })) return;
    try {
      await remove(id);
      addToast('success', 'Cartão excluído!');
      refresh();
    } catch { addToast('error', 'Erro ao excluir cartão'); }
  };

  const handleParcela = async (data: { descricao: string; valorTotal: number; parcelas: number; cartaoId?: string; contaId?: string; categoria: string; mesInicio: number; anoInicio: number }) => {
    try {
      const result = await api.criarParcelamento(data as any);
      addToast('success', `Parcelamento criado! ${result.criadas} parcelas em ${data.parcelas}× de R$ ${(data.valorTotal / data.parcelas).toFixed(2)}`);
      refresh();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao criar parcelamento');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isIndex && (
            <button 
              onClick={() => navigate('/cartoes')}
              className="w-10 h-10 rounded-xl bg-surface border border-white/[0.07] flex items-center justify-center text-muted hover:text-white transition-all"
              title="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex gap-1 bg-surface rounded-xl p-1 border border-white/[0.07]">
            {tabs.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-muted hover:text-white'
                  }`
                }
              >
                <tab.icon size={14} />
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalParcela(true)} className="btn-ghost flex items-center gap-2 border border-white/[0.07]">
            <ShoppingBag size={16} /> Parcela
          </button>
          {isIndex && (
            <button onClick={() => { setEditingData(null); setModalCartao(true); }} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Novo Cartão
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isIndex ? (
        loading ? (
          <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {cartoes.map(cartao => (
              <CartaoWidget
                key={cartao.id}
                cartao={cartao}
                onDelete={handleDelete}
                onEdit={(c) => { setEditingData(c); setModalCartao(true); }}
              />
            ))}
          </div>
        )
      ) : (
        <Outlet />
      )}

      <ModalCartao 
        open={modalCartao} 
        onClose={() => setModalCartao(false)} 
        onSubmit={handleSave} 
        initialData={editingData} 
        taxaJurosGlobal={config?.taxaJurosCartoesGlobal}
      />
      <ModalParcela open={modalParcela} onClose={() => setModalParcela(false)} onSubmit={handleParcela} cartoes={cartoes} contas={contas} />
    </div>
  );
}
