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
          formatter={(value: any, name: any) => [formatCurrency(Number(value)), name === 'entradas' ? 'Entradas' : 'Saídas']}
        />
        <Bar dataKey="entradas" fill="rgb(var(--green-rgb))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="saidas" fill="rgb(var(--red-rgb))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
