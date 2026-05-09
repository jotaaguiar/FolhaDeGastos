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
    <div className="flex items-center gap-2">
      <button onClick={prev} className="btn-ghost p-1.5 rounded-lg">
        <ChevronLeft size={16} />
      </button>
      <span className="font-mono text-sm min-w-[140px] text-center">
        {getMesNome(mesAtual)} {anoAtual}
      </span>
      <button 
        onClick={next} 
        disabled={isOverview && isFuture}
        className={`p-1.5 rounded-lg transition-all ${isOverview && isFuture ? 'opacity-20 cursor-not-allowed' : 'btn-ghost hover:bg-white/10'}`}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
