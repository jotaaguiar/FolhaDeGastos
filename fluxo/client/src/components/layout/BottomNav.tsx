import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, CreditCard, Menu, Plus } from 'lucide-react';

interface BottomNavProps {
  onMenuClick: () => void;
  onAddClick: () => void;
}

const navItems = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/contas', label: 'Contas', icon: Wallet, end: false },
  { to: '/cartoes', label: 'Cartões', icon: CreditCard, end: false },
];

function NavItem({ to, end, label, Icon }: { to: string; end: boolean; label: string; Icon: any }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[56px] active:scale-[0.92] ${
          isActive ? 'text-brand-primary' : 'text-muted'
        }`
      }
      style={{ transition: 'color 0.25s var(--ease-ios), transform 0.18s var(--ease-ios)' }}
    >
      {({ isActive }) => (
        <>
          {/* Indicator pill animado atrás do ícone */}
          <span
            aria-hidden
            className={`absolute top-1.5 w-10 h-7 rounded-full transition-all ${
              isActive ? 'bg-brand-primary/10 opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
            style={{ transitionDuration: '320ms', transitionTimingFunction: 'var(--ease-ios)' }}
          />
          <Icon
            size={21}
            strokeWidth={isActive ? 2.4 : 1.8}
            className="relative z-10"
            style={{ transition: 'stroke-width 0.2s var(--ease-ios)' }}
          />
          <span className="relative z-10 text-[10px] font-medium font-mono">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function BottomNav({ onMenuClick, onAddClick }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden">
      <div className="bg-surface/95 backdrop-blur-xl border-t border-white/[0.07] flex items-center justify-around px-2 pb-safe">
        {navItems.slice(0, 2).map(item => (
          <NavItem key={item.to} to={item.to} end={item.end} label={item.label} Icon={item.icon} />
        ))}

        {/* FAB centro */}
        <button
          onClick={onAddClick}
          className="relative -top-4 w-14 h-14 rounded-full bg-brand-primary flex items-center justify-center active:scale-90 hover:brightness-110"
          style={{
            boxShadow: '0 8px 24px var(--brand-glow), 0 2px 6px rgba(0,0,0,0.25)',
            transition: 'transform 0.18s var(--ease-ios), filter 0.2s var(--ease-ios), box-shadow 0.25s var(--ease-ios)',
          }}
          aria-label="Adicionar transação"
        >
          <Plus size={26} className="text-white" strokeWidth={2.5} />
        </button>

        {navItems.slice(2).map(item => (
          <NavItem key={item.to} to={item.to} end={item.end} label={item.label} Icon={item.icon} />
        ))}

        <button
          onClick={onMenuClick}
          className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[56px] text-muted active:scale-[0.92] active:text-text-base"
          style={{ transition: 'color 0.25s var(--ease-ios), transform 0.18s var(--ease-ios)' }}
        >
          <Menu size={21} strokeWidth={1.8} />
          <span className="text-[10px] font-medium font-mono">Menu</span>
        </button>
      </div>
    </nav>
  );
}
