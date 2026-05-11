import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  '/comparativo': 'Comparativo',
  '/importacao': 'Importar',
  '/configuracoes': 'Configurações',
};

export default function Topbar({ onMenuClick: _onMenuClick }: TopbarProps) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Fluxo';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const onScroll = () => setScrolled(main.scrollTop > 4);
    main.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => main.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3 sticky top-0 z-20"
      style={{
        background: scrolled ? 'rgb(var(--surface-rgb) / 0.85)' : 'rgb(var(--surface-rgb) / 0.65)',
        backdropFilter: 'blur(14px) saturate(180%)',
        WebkitBackdropFilter: 'blur(14px) saturate(180%)',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 0 var(--border), 0 4px 12px rgba(0,0,0,0.04)' : 'none',
        transition: 'background 0.25s var(--ease-ios), border-color 0.25s var(--ease-ios), box-shadow 0.3s var(--ease-ios)',
      }}
    >
      <h2 className="text-base md:text-lg font-bold truncate tracking-tight">{title}</h2>
      <MonthNav />
    </header>
  );
}
