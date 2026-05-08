import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Defs, LinearGradient, Stop } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { useBrandColor } from '@/hooks/useBrandColor';

interface PatrimonioChartProps {
  data: Array<{ data: string; saldo: number }>;
}

export default function PatrimonioChart({ data }: PatrimonioChartProps) {
  const brandColor = useBrandColor();
  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={brandColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={brandColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="data" 
            stroke="#6b6890" 
            fontSize={10} 
            fontFamily="DM Mono" 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(v) => v.split('-')[1] + '/' + v.split('-')[0].slice(2)}
          />
          <YAxis 
            stroke="#6b6890" 
            fontSize={10} 
            fontFamily="DM Mono" 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(v) => `R$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
          />
          <Tooltip
            contentStyle={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'DM Mono', fontSize: 12 }}
            itemStyle={{ color: brandColor }}
            formatter={(value: number) => [formatCurrency(value), 'Patrimônio']}
            labelFormatter={(label) => `Mês: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="saldo"
            stroke={brandColor}
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorSaldo)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
