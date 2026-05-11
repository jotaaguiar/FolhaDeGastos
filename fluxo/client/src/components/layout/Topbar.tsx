import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import MonthNav from '@/components/shared/MonthNav';

interface TopbarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Visão Geral',
  '/contas': 'Contas',
  '/cartoes': 'Cartões',
  '/cartoes/fatura': 'Fatura Atual',
  '/cartoes/mensal': 'Visão Mensal',
  '/cartoes/recorrentes': 'Recorrentes',
  '/fluxo': 'Fluxo de Caixa',
  '/orcamento': 'Orçamento',
  '/metas': 'Metas & Reservas',
  '/radar': 'Radar Financeiro',
  '/configuracoes': 'Configurações',
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Fluxo';

  return (
    <header className="h-14 md:h-16 border-b border-white/[0.07] bg-surface/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all shrink-0"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-base md:text-lg font-bold truncate">{title}</h2>
      </div>
      <MonthNav />
    </header>
  );
}
