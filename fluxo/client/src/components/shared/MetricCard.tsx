import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  invertDelta?: boolean;
  color?: 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'teal' | 'brand';
  loading?: boolean;
  onClick?: () => void;
  extra?: React.ReactNode;
}

const colorMap = {
  green: { text: 'text-fluxo-green', glow: 'card-glow-green' },
  red: { text: 'text-fluxo-red', glow: 'card-glow-red' },
  amber: { text: 'text-fluxo-amber', glow: 'card-glow-amber' },
  blue: { text: 'text-fluxo-blue', glow: 'card-glow-blue' },
  purple: { text: 'text-fluxo-purple', glow: 'card-glow-purple' },
  teal: { text: 'text-fluxo-teal', glow: 'card-glow-teal' },
  brand: { text: 'text-brand-primary', glow: 'card-glow-brand' },
};

export default function MetricCard({ label, value, sub, delta, invertDelta = false, color = 'brand', loading, onClick, extra }: MetricCardProps) {
  const c = colorMap[color];

  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-3 w-20 mb-3 rounded" />
        <div className="skeleton h-8 w-28 mb-2 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    );
  }

  return (
    <div
      className={`card p-5 ${c.glow} ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''} transition-all duration-200`}
      onClick={onClick}
    >
      <p className="label-mono mb-1">{label}</p>
      <p className={`value-lg ${c.text} font-mono`}>{value}</p>
      {extra && <div className="mt-2">{extra}</div>}
      {sub && <p className="text-xs text-muted mt-1 font-mono">{sub}</p>}
      {delta != null && (
        <p className={`text-[10px] font-mono mt-0.5 ${(invertDelta ? delta <= 0 : delta >= 0) ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}% vs anterior
        </p>
      )}
    </div>
  );
}
