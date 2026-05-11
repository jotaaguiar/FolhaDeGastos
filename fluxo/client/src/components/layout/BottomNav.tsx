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

export default function BottomNav({ onMenuClick, onAddClick }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden">
      <div className="bg-surface/95 backdrop-blur-md border-t border-white/[0.07] flex items-center justify-around px-2 pb-safe">
        {/* Left items */}
        {navItems.slice(0, 2).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-brand-primary'
                  : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium font-mono">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* FAB center */}
        <button
          onClick={onAddClick}
          className="relative -top-4 w-14 h-14 rounded-full bg-brand-primary shadow-lg shadow-brand-primary/30 flex items-center justify-center active:scale-95 transition-all duration-200 hover:brightness-110"
          aria-label="Adicionar transação"
        >
          <Plus size={26} className="text-white" strokeWidth={2.5} />
        </button>

        {/* Right items */}
        {navItems.slice(2).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-brand-primary'
                  : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium font-mono">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Menu */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center gap-0.5 px-4 py-3 rounded-xl text-muted transition-all duration-200"
        >
          <Menu size={22} strokeWidth={1.8} />
          <span className="text-[10px] font-medium font-mono">Menu</span>
        </button>
      </div>
    </nav>
  );
}
