import type { Cartao } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import ProgressBar from './ProgressBar';
import { Wifi, Trash2 } from 'lucide-react';

interface CartaoWidgetProps {
  cartao: Cartao;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (cartao: Cartao) => void;
  selected?: boolean;
}

export default function CartaoWidget({ cartao, onClick, onDelete, onEdit, selected }: CartaoWidgetProps) {
  const limiteUsado = cartao.limiteUsadoTotal ?? 0;
  const limiteProjetado = cartao.limiteDisponivelProjetado;
  return (
    <div
      onClick={onClick}
      className={`theme-preserve-text group relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
        selected ? 'ring-2 ring-brand-primary' : ''
      }`}
      style={{
        background: `linear-gradient(135deg, ${cartao.cor}dd, ${cartao.cor}88)`,
        minHeight: 180,
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20" style={{ background: 'white' }} />
      <div className="absolute -right-2 top-10 w-16 h-16 rounded-full opacity-10" style={{ background: 'white' }} />

      {/* Actions */}
      <div className="absolute top-3 right-3 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(cartao); }}
            className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
            title="Editar cartão"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(cartao.id); }}
            className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white/60 hover:text-white hover:bg-red-500/50 transition-all"
            title="Excluir cartão"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between" style={{ minHeight: 140 }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-xs font-mono uppercase tracking-wider">{cartao.banco}</p>
            <p className="text-white text-lg font-bold mt-1">{cartao.nome}</p>
          </div>
          <Wifi size={20} className="text-white/60 rotate-90" />
        </div>

        <div>
          <p className="text-white/90 font-mono text-lg tracking-[0.2em]">
            •••• •••• •••• {cartao.ultimos4}
          </p>
        </div>

        <div>
          <div className="flex justify-between text-xs text-white/70 font-mono mb-1">
            <span>Usado: {formatCurrency(limiteUsado)}</span>
            <span>Limite: {formatCurrency(cartao.limite)}</span>
          </div>
          <ProgressBar value={limiteUsado} max={cartao.limite} color="rgba(255,255,255,0.8)" height={4} />
          <div className="flex justify-between mt-1.5 text-[10px] text-white/50 font-mono">
            <span>Agora: {formatCurrency(cartao.limiteDisponivelReal ?? (cartao.limite - limiteUsado))}</span>
            {limiteProjetado !== undefined && (
              <span>Se pagar tudo: {formatCurrency(limiteProjetado)}</span>
            )}
          </div>
          <div className="flex justify-between mt-1 text-xs text-white/60 font-mono">
            <span>{cartao.bandeira}</span>
            <span>Venc. dia {cartao.diaVencimento}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
