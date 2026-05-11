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

  // Diferença relativa em meses (positivo = futuro, negativo = passado)
  const monthDiff = (anoAtual - todayAno) * 12 + (mesAtual - todayMes);
  const labelRelativo = (() => {
    if (monthDiff === 0) return 'Este mês';
    if (monthDiff === -1) return 'Mês passado';
    if (monthDiff === 1) return 'Próximo mês';
    if (monthDiff < -1 && monthDiff >= -11 && anoAtual === todayAno) return `${getMesNome(mesAtual)}`;
    if (monthDiff > 1 && monthDiff <= 11 && anoAtual === todayAno) return `${getMesNome(mesAtual)}`;
    return `${getMesNome(mesAtual).slice(0, 3)} ${anoAtual}`;
  })();

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
      <div className="min-w-[120px] sm:min-w-[140px] text-center leading-tight">
        <span className="block text-xs sm:text-sm font-semibold tracking-tight capitalize">
          {labelRelativo}
        </span>
        {monthDiff !== 0 && (
          <span className="block text-[10px] text-muted font-mono mt-0.5">
            {anoAtual !== todayAno ? `${getMesNome(mesAtual).slice(0,3).toLowerCase()} • ${anoAtual}` : getMesNome(mesAtual).toLowerCase()}
          </span>
        )}
      </div>
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
