import { useLocation } from 'react-router-dom';
import MonthNav from '@/components/shared/MonthNav';

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

export default function Topbar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Fluxo';

  return (
    <header className="h-16 border-b border-white/[0.07] bg-surface/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <h2 className="text-lg font-bold">{title}</h2>
      <MonthNav />
    </header>
  );
}
