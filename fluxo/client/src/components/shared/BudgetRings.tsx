import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { useBrandColor } from '@/hooks/useBrandColor';

interface BudgetRingsProps {
  data: {
    necessidades: { gasto: number; ideal: number };
    desejos: { gasto: number; ideal: number };
    poupanca: { gasto: number; ideal: number };
  };
}

export default function BudgetRings({ data }: BudgetRingsProps) {
  const brandColor = useBrandColor();
  const categories = [
    { name: 'Essenciais (50%)', value: data.necessidades.gasto, ideal: data.necessidades.ideal, color: brandColor },
    { name: 'Desejos (30%)', value: data.desejos.gasto, ideal: data.desejos.ideal, color: '#fbbf24' },
    { name: 'Poupança (20%)', value: data.poupanca.gasto, ideal: data.poupanca.ideal, color: '#34d399' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {categories.map((cat) => {
        const pct = Math.min(100, (cat.value / cat.ideal) * 100);
        const chartData = [
          { value: cat.value },
          { value: Math.max(0, cat.ideal - cat.value) }
        ];

        return (
          <div key={cat.name} className="flex flex-col items-center">
            <div className="w-full h-24 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={35}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={cat.color} />
                    <Cell fill="rgba(255,255,255,0.05)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold font-mono">{Math.round(pct)}%</span>
              </div>
            </div>
            <p className="text-[10px] uppercase font-mono text-muted mt-1">{cat.name.split(' ')[0]}</p>
            <p className="text-[9px] font-mono text-white/60">{formatCurrency(cat.value)}</p>
          </div>
        );
      })}
    </div>
  );
}
