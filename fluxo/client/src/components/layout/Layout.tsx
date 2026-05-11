import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import ModalTransacao from '@/components/modals/ModalTransacao';
import { useContas } from '@/hooks/useContas';
import { useCartoes } from '@/hooks/useCartoes';
import { useApp } from '@/context/AppContext';
import { useAlert } from '@/context/AlertContext';
import { api } from '@/lib/api';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fabModalOpen, setFabModalOpen] = useState(false);
  const { contas } = useContas();
  const { cartoes } = useCartoes();
  const { refresh } = useApp();
  const { addToast } = useAlert();

  const handleFabSave = async (data: any) => {
    try {
      await api.createTransacao(data);
      addToast('success', 'Transação adicionada!');
      refresh();
    } catch {
      addToast('error', 'Erro ao adicionar transação');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom navigation (mobile only) */}
      <BottomNav
        onMenuClick={() => setSidebarOpen(true)}
        onAddClick={() => setFabModalOpen(true)}
      />

      {/* Global FAB modal */}
      <ModalTransacao
        open={fabModalOpen}
        onClose={() => setFabModalOpen(false)}
        onSubmit={handleFabSave}
        contas={contas}
        cartoes={cartoes}
      />
    </div>
  );
}
