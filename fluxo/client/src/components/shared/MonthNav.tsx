import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getMesNome } from '@/lib/formatters';

export default function MonthNav() {
  const { mesAtual, anoAtual, setMesAno } = useApp();

  const prev = () => {
    let m = mesAtual - 1, a = anoAtual;
    if (m < 1) { m = 12; a--; }
    setMesAno(m, a);
  };

  const next = () => {
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
      <button onClick={next} className="btn-ghost p-1.5 rounded-lg">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
