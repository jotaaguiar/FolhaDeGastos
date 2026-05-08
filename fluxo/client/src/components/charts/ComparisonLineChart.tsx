import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { useBrandColor } from '@/hooks/useBrandColor';

interface ComparisonLineChartProps {
  data: Array<{ dia: number; mesAtual: number; mesAnterior: number }>;
}

export default function ComparisonLineChart({ data }: ComparisonLineChartProps) {
  const brandColor = useBrandColor();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="dia" stroke="#6b6890" fontSize={11} fontFamily="DM Mono" tickLine={false} />
        <YAxis stroke="#6b6890" fontSize={11} fontFamily="DM Mono" tickLine={false}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} />
        <Tooltip
          contentStyle={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'DM Mono', fontSize: 12 }}
          formatter={(value: number) => [formatCurrency(value)] as any}
        />
        <Legend wrapperStyle={{ fontFamily: 'DM Mono', fontSize: 11 }} />
        <Line type="monotone" dataKey="mesAtual" name="Mês Atual" stroke={brandColor} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="mesAnterior" name="Mês Anterior" stroke="#6b6890" strokeWidth={2} strokeDasharray="5 5" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
