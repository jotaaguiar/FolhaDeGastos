import React from 'react';
import { X, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Transacao, Cartao, Conta } from '@/types';
import { formatCurrency, formatDate, getDiaSemana, getCategoriaIcon, getCategoriaLabel, getCategoriaColor } from '@/lib/formatters';

interface ModalDetalhesDiaProps {
  open: boolean;
  onClose: () => void;
  dia: number;
  mes: number;
  ano: number;
  transacoes: Transacao[];
  contas: Conta[];
  cartoes: Cartao[];
}

export default function ModalDetalhesDia({ open, onClose, dia, mes, ano, transacoes, contas, cartoes }: ModalDetalhesDiaProps) {
  if (!open) return null;

  const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  const txs = transacoes.filter(t => t.data === dataStr);
  const totalEntradas = txs.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = txs.filter(t => t.tipo !== 'entrada' && t.tipo !== 'transferencia').reduce((acc, t) => acc + t.valor, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-white/[0.08] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Detalhes do Dia {dia}</h3>
              <p className="text-xs text-muted font-mono">{getDiaSemana(dataStr)}, {formatDate(dataStr)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-muted hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-fluxo-green/5 border border-fluxo-green/10 text-center">
              <p className="label-mono mb-1 text-[10px]">Entradas</p>
              <p className="text-sm font-mono font-bold text-fluxo-green">+{formatCurrency(totalEntradas)}</p>
            </div>
            <div className="p-3 rounded-xl bg-fluxo-red/5 border border-fluxo-red/10 text-center">
              <p className="label-mono mb-1 text-[10px]">SaÃ­das</p>
              <p className="text-sm font-mono font-bold text-fluxo-red">-{formatCurrency(totalSaidas)}</p>
            </div>
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            <p className="label-mono">TransaÃ§Ãµes ({txs.length})</p>
            {txs.length === 0 ? (
              <div className="py-8 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/5">
                <p className="text-sm text-muted">Nenhuma transaÃ§Ã£o neste dia</p>
              </div>
            ) : (
              <div className="space-y-2">
                {txs.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                      style={{ background: getCategoriaColor(t.categoria) + '20' }}>
                      {getCategoriaIcon(t.categoria)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.descricao}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-muted">{getCategoriaLabel(t.categoria)}</span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        
                        {/* Conta/CartÃ£o Indicator */}
                        {t.cartaoId ? (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: cartoes.find(c => c.id === t.cartaoId)?.cor || '#fff' }} />
                            <span className="text-[10px] text-muted font-mono uppercase">
                              {cartoes.find(c => c.id === t.cartaoId)?.nome || 'CartÃ£o'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: contas.find(c => c.id === t.contaId)?.cor || '#fff' }} />
                            <span className="text-[10px] text-muted font-mono uppercase">
                              {contas.find(c => c.id === t.contaId)?.nome || 'Conta'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-bold ${t.tipo === 'entrada' ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                        {t.tipo === 'entrada' ? '+' : '-'} {formatCurrency(t.valor)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-white/[0.02] border-t border-white/[0.05]">
          <button onClick={onClose} className="w-full btn-primary py-3">Fechar</button>
        </div>
      </div>
    </div>
  );
}
