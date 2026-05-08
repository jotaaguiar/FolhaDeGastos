import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { Alerta } from '@/types';

export default function AlertStrip({ tipo, mensagem }: Alerta) {
  const config = {
    danger: { icon: AlertTriangle, bg: 'bg-fluxo-red/10', border: 'border-fluxo-red/20', text: 'text-fluxo-red' },
    warn: { icon: AlertCircle, bg: 'bg-fluxo-amber/10', border: 'border-fluxo-amber/20', text: 'text-fluxo-amber' },
    ok: { icon: CheckCircle, bg: 'bg-fluxo-green/10', border: 'border-fluxo-green/20', text: 'text-fluxo-green' },
    info: { icon: Info, bg: 'bg-fluxo-blue/10', border: 'border-fluxo-blue/20', text: 'text-fluxo-blue' },
  };

  const c = config[tipo];
  const Icon = c.icon;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${c.bg} ${c.border} transition-all duration-200`}>
      <Icon size={16} className={c.text} />
      <span className={`text-sm ${c.text}`}>{mensagem}</span>
    </div>
  );
}
