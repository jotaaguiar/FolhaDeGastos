import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

export default function ScoreRing({ score, size = 48, showLabel = false }: ScoreRingProps) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? 'rgb(var(--green-rgb))' : score >= 70 ? 'rgb(var(--blue-rgb))' : score >= 50 ? 'rgb(var(--amber-rgb))' : 'rgb(var(--red-rgb))';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-700 ease-out" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold"
          style={{ color }}>{score}</span>
      </div>
      {showLabel && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">Score</span>
      )}
    </div>
  );
}
