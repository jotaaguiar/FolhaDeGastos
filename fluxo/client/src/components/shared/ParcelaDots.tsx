export default function ParcelaDots({ total, atual }: { total: number; atual: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const color = n < atual ? '#34d399' : n === atual ? '#fbbf24' : 'rgba(255,255,255,0.1)';
        return (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all"
            style={{ background: color }}
            title={`Parcela ${n}/${total}`}
          />
        );
      })}
    </div>
  );
}
