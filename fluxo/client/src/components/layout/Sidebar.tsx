import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, CreditCard, TrendingUp,
  PiggyBank, Target, Settings, Radar as RadarIcon, LogOut,
  Upload, BarChart3, X
} from 'lucide-react';
import ScoreRing from '@/components/shared/ScoreRing';
import { useDashboard } from '@/hooks/useDashboard';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/', label: 'Visão Geral', icon: LayoutDashboard },
  { to: '/contas', label: 'Contas', icon: Wallet },
  { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  { to: '/fluxo', label: 'Fluxo de Caixa', icon: TrendingUp },
  { to: '/orcamento', label: 'Orçamento', icon: PiggyBank },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/radar', label: 'Radar Futuro', icon: RadarIcon },
  { to: '/comparativo', label: 'Comparativo', icon: BarChart3 },
  { to: '/importacao', label: 'Importar', icon: Upload },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { data } = useDashboard();
  const { config } = useApp();
  const { user, logout } = useAuth();

  return (
    <aside className={`
      fixed md:relative inset-y-0 left-0 z-50
      w-64 h-screen bg-surface border-r border-white/[0.07] flex flex-col shrink-0
      transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.07] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-brand-primary">Flu</span>xo
          </h1>
          <p className="text-xs text-muted font-mono mt-1">controle financeiro</p>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Score */}
      <div className="p-4 border-b border-white/[0.07] flex items-center gap-3">
        <ScoreRing score={data?.score ?? 0} size={48} />
        <div>
          <p className="text-sm font-semibold">{data?.scoreLabel ?? '...'}</p>
          <p className="text-xs text-muted font-mono">Score Financeiro</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                  : 'text-muted hover:text-white hover:bg-white/[0.03]'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-sm font-bold shrink-0">
            {(user?.username || config?.nomeUsuario || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username || config?.nomeUsuario || 'Usuário'}</p>
            <p className="text-[10px] text-muted font-mono">v1.0.0</p>
          </div>
          <button
            onClick={logout}
            title="Sair"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-fluxo-red hover:bg-fluxo-red/10 transition-all shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
