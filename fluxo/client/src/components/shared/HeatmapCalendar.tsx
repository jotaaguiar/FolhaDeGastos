export default function HeatmapCalendar({ data, mes, ano, onDayClick }: {
  data: Array<{ dia: number; valor: number }>;
  mes: number;
  ano: number;
  onDayClick?: (dia: number) => void;
}) {
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const maxValor = Math.max(...data.map(d => d.valor), 1);

  const cells = [];
  // Empty cells for offset
  for (let i = 0; i < primeiroDia; i++) {
    cells.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const item = data.find(d => d.dia === dia);
    const valor = item?.valor || 0;
    const intensity = valor / maxValor;
    const opacity = Math.max(0.1, Math.min(0.9, intensity));

    cells.push(
      <div
        key={dia}
        onClick={() => onDayClick?.(dia)}
        className="w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-mono transition-all duration-200 hover:scale-110 cursor-pointer border border-white/[0.03] hover:border-white/20"
        style={{
          background: valor > 0 ? `rgba(251, 113, 133, ${opacity})` : 'rgba(255,255,255,0.03)',
        }}
        title={`Dia ${dia}: R$ ${valor.toFixed(2)}`}
      >
        {dia}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="w-8 h-6 flex items-center justify-center text-[10px] text-muted font-mono">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}
