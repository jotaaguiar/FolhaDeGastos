import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { useBrandColor } from '@/hooks/useBrandColor';

interface FluxoLineChartProps {
  data: Array<{ dia?: number; data?: string; saldo: number; tipo?: 'real' | 'projetado' }>;
}

export default function FluxoLineChart({ data }: FluxoLineChartProps) {
  const brandColor = useBrandColor();
  
  // Separation for real vs projected
  const realData = data.filter(d => d.tipo !== 'projetado');
  const projData = data.filter(d => d.tipo === 'projetado');
  
  // To make the lines connect, we add the last real data point as the first projected point
  const combinedProjData = realData.length > 0 ? [realData[realData.length - 1], ...projData] : projData;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis 
          dataKey={data[0]?.data ? 'data' : 'dia'} 
          stroke="#6b6890" 
          fontSize={11} 
          fontFamily="DM Mono" 
          tickLine={false} 
          tickFormatter={(v) => typeof v === 'string' ? v.split('-')[2] : v}
        />
        <YAxis stroke="#6b6890" fontSize={11} fontFamily="DM Mono" tickLine={false}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} />
        <Tooltip
          contentStyle={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'DM Mono', fontSize: 12 }}
          labelStyle={{ color: '#6b6890' }}
          formatter={(value: any) => [formatCurrency(Number(value)), 'Saldo'] as any}
          labelFormatter={(label) => `Data: ${label}` as any}
        />
        <Line 
          data={realData}
          type="monotone" 
          dataKey="saldo" 
          stroke={brandColor} 
          strokeWidth={2}
          dot={false} 
          activeDot={{ r: 4, fill: brandColor }} 
        />
        <Line 
          data={combinedProjData}
          type="monotone" 
          dataKey="saldo" 
          stroke={brandColor} 
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false} 
          activeDot={{ r: 4, fill: brandColor }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
