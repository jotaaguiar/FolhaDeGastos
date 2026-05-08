import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export default function ProgressBar({ value, max, color, height = 6, showLabel }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const autoColor = pct > 85 ? '#fb7185' : pct > 60 ? '#fbbf24' : '#34d399';
  const finalColor = color || autoColor;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-muted font-mono">{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'var(--track-bg)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: finalColor }}
        />
      </div>
    </div>
  );
}
