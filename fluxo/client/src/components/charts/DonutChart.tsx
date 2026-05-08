import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, getCategoriaLabel, getCategoriaColor } from '@/lib/formatters';
import type { Categoria } from '@/types';

interface DonutChartProps {
  data: Array<{ categoria: Categoria; total: number }>;
}

export default function DonutChart({ data }: DonutChartProps) {
  if (!data.length) return <div className="text-muted text-sm text-center py-8">Sem dados</div>;

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="categoria" cx="50%" cy="50%"
            innerRadius={50} outerRadius={80} paddingAngle={2} strokeWidth={0}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getCategoriaColor(entry.categoria)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'DM Mono', fontSize: 12 }}
            formatter={(value: number) => [formatCurrency(value)]}
            labelFormatter={(label: string) => getCategoriaLabel(label)}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1.5 flex-1">
        {data.slice(0, 6).map(item => (
          <div key={item.categoria} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getCategoriaColor(item.categoria) }} />
            <span className="text-xs truncate flex-1">{getCategoriaLabel(item.categoria)}</span>
            <span className="text-xs font-mono text-muted">{formatCurrency(item.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
