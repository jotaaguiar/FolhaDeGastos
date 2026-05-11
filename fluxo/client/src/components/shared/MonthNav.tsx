import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getMesNome } from '@/lib/formatters';
import { useLocation } from 'react-router-dom';

export default function MonthNav() {
  const { mesAtual, anoAtual, setMesAno } = useApp();
  const location = useLocation();
  const isOverview = location.pathname === '/';

  const today = new Date();
  const todayMes = today.getMonth() + 1;
  const todayAno = today.getFullYear();

  const isFuture = anoAtual > todayAno || (anoAtual === todayAno && mesAtual >= todayMes);

  const prev = () => {
    let m = mesAtual - 1, a = anoAtual;
    if (m < 1) { m = 12; a--; }
    setMesAno(m, a);
  };

  const next = () => {
    if (isOverview && isFuture) return;
    let m = mesAtual + 1, a = anoAtual;
    if (m > 12) { m = 1; a++; }
    setMesAno(m, a);
  };

  return (
    <div
      className="flex items-center gap-1 rounded-full px-1 py-1"
      style={{ background: 'var(--overlay-subtle)' }}
    >
      <button
        onClick={prev}
        aria-label="Mês anterior"
        className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-text-base hover:bg-white/[0.06] active:scale-[0.92]"
        style={{ transition: 'color 0.2s var(--ease-ios), background 0.2s var(--ease-ios), transform 0.15s var(--ease-ios)' }}
      >
        <ChevronLeft size={16} />
      </button>
      <span className="font-mono text-xs sm:text-sm min-w-[120px] sm:min-w-[140px] text-center tracking-tight">
        {getMesNome(mesAtual)} {anoAtual}
      </span>
      <button
        onClick={next}
        disabled={isOverview && isFuture}
        aria-label="Próximo mês"
        className={`w-8 h-8 flex items-center justify-center rounded-full active:scale-[0.92] ${
          isOverview && isFuture
            ? 'opacity-20 cursor-not-allowed text-muted'
            : 'text-muted hover:text-text-base hover:bg-white/[0.06]'
        }`}
        style={{ transition: 'color 0.2s var(--ease-ios), background 0.2s var(--ease-ios), transform 0.15s var(--ease-ios)' }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
