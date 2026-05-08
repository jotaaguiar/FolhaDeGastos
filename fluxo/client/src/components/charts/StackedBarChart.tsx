import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface StackedBarChartProps {
  data: Array<{ label: string; entradas: number; saidas: number }>;
}

export default function StackedBarChart({ data }: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="label" stroke="#6b6890" fontSize={11} fontFamily="DM Mono" tickLine={false} />
        <YAxis stroke="#6b6890" fontSize={11} fontFamily="DM Mono" tickLine={false}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} />
        <Tooltip
          contentStyle={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'DM Mono', fontSize: 12 }}
          formatter={(value: number, name: string) => [formatCurrency(value), name === 'entradas' ? 'Entradas' : 'Saídas'] as any}
        />
        <Bar dataKey="entradas" fill="#34d399" radius={[4, 4, 0, 0]} />
        <Bar dataKey="saidas" fill="#fb7185" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
