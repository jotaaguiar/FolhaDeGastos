import { useState } from 'react';
import type { Transacao, Cartao, Conta } from '@/types';
import { formatCurrency, formatDate, formatDateShort, getCategoriaLabel, getCategoriaColor, getCategoriaIcon, getDiaSemana } from '@/lib/formatters';
import { Trash2, ChevronDown, ChevronUp, CreditCard, Wallet, Repeat, Calendar, Tag, FileText, Hash, Edit3 } from 'lucide-react';
import ParcelaDots from './ParcelaDots';
import SwipeableRow from './SwipeableRow';

interface TransacaoRowProps {
  transacao: Transacao;
  cartoes: Cartao[];
  contas: Conta[];
  onDelete?: (id: string) => void;
  onEdit?: (transacao: Transacao) => void;
}

export default function TransacaoRow({ transacao, cartoes, contas, onDelete, onEdit }: TransacaoRowProps) {
  const [expanded, setExpanded] = useState(false);
  const t = transacao;
  const isEntrada = t.tipo === 'entrada';
  const conta = contas.find(c => c.id === t.contaId);
  const contaDestino = contas.find(c => c.id === t.contaDestinoId);
  const cartao = cartoes.find(c => c.id === t.cartaoId);

  const tipoBadge = {
    debito: { label: 'Débito', cls: 'bg-fluxo-red/10 text-fluxo-red' },
    credito_cartao: { label: 'Crédito', cls: 'bg-brand-primary/10 text-brand-primary' },
    entrada: { label: 'Entrada', cls: 'bg-fluxo-green/10 text-fluxo-green' },
    transferencia: { label: 'Transf.', cls: 'bg-fluxo-blue/10 text-fluxo-blue' },
  }[t.tipo];

  return (
    <SwipeableRow
      onDelete={onDelete ? () => onDelete(t.id) : undefined}
      disabled={expanded}
    >
    <div
      className={`rounded-lg ${expanded ? 'bg-s2 border border-white/[0.07]' : 'hover:bg-white/[0.02]'}`}
      style={{ transition: 'background 0.2s var(--ease-ios), border-color 0.2s var(--ease-ios)' }}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-3 py-3 px-3 cursor-pointer group select-none active:scale-[0.995]"
        style={{ transition: 'transform 0.15s var(--ease-ios)' }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Category icon */}
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0"
          style={{ background: getCategoriaColor(t.categoria) + '15' }}>
          {getCategoriaIcon(t.categoria)}
        </div>

        {/* Date */}
        <div className="w-14 text-center shrink-0">
          <span className="text-xs text-muted font-mono">{formatDateShort(t.data)}</span>
        </div>

        {/* Description + badges */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{t.descricao}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="badge text-[10px]" style={{ background: getCategoriaColor(t.categoria) + '15', color: getCategoriaColor(t.categoria) }}>
              {getCategoriaLabel(t.categoria)}
            </span>
            <span className={`badge text-[10px] ${tipoBadge.cls}`}>{tipoBadge.label}</span>
            {t.parcelamento && (
              <span className="badge text-[10px] bg-fluxo-amber/10 text-fluxo-amber">
                {t.parcelamento.atual}/{t.parcelamento.total}×
              </span>
            )}
            {t.recorrente && (
              <span className="badge text-[10px] bg-fluxo-teal/10 text-fluxo-teal">
                <Repeat size={8} className="mr-0.5" /> Recorrente
              </span>
            )}
            {t.tags?.map(tag => (
              <span key={tag} className="badge text-[10px] bg-brand-primary/10 text-brand-primary">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Value */}
        <div className="text-right shrink-0">
          <span className={`font-mono text-sm font-semibold ${isEntrada ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
            {isEntrada ? '+' : '-'} {formatCurrency(t.valor)}
          </span>
        </div>

        {/* Expand arrow */}
        <div className="text-muted shrink-0">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.05] animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            {/* Left column - details */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-muted shrink-0" />
                <div>
                  <span className="text-[10px] text-muted font-mono block">Data</span>
                  <span className="text-xs">{formatDate(t.data)} ({getDiaSemana(t.data)})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tag size={13} className="text-muted shrink-0" />
                <div>
                  <span className="text-[10px] text-muted font-mono block">Categoria</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{getCategoriaIcon(t.categoria)}</span>
                    <span className="text-xs">{getCategoriaLabel(t.categoria)}</span>
                  </div>
                </div>
              </div>

              {conta && (
                <div className="flex items-center gap-2">
                  <Wallet size={13} className="text-muted shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted font-mono block">Conta</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: conta.cor }} />
                      <span className="text-xs">{conta.nome} ({conta.banco})</span>
                    </div>
                  </div>
                </div>
              )}

              {t.tipo === 'transferencia' && contaDestino && (
                <div className="flex items-center gap-2">
                  <Wallet size={13} className="text-fluxo-blue shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted font-mono block">Destino</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: contaDestino.cor }} />
                      <span className="text-xs">{contaDestino.nome} ({contaDestino.banco})</span>
                    </div>
                  </div>
                </div>
              )}

              {cartao && (
                <div className="flex items-center gap-2">
                  <CreditCard size={13} className="text-muted shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted font-mono block">Cartão</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: cartao.cor }} />
                      <span className="text-xs">{cartao.nome} (•••• {cartao.ultimos4})</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right column - value details + installment */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Hash size={13} className="text-muted shrink-0" />
                <div>
                  <span className="text-[10px] text-muted font-mono block">Valor</span>
                  <span className={`text-sm font-mono font-bold ${isEntrada ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                    {formatCurrency(t.valor)}
                  </span>
                </div>
              </div>

              {t.parcelamento && (
                <div className="bg-s3 rounded-lg p-2.5">
                  <span className="text-[10px] text-muted font-mono block mb-1.5">Parcelamento</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted">Parcela</span>
                      <span className="text-xs font-mono">{t.parcelamento.atual} de {t.parcelamento.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted">Valor parcela</span>
                      <span className="text-xs font-mono">{formatCurrency(t.valor)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted">Valor total</span>
                      <span className="text-xs font-mono font-bold">{formatCurrency(t.parcelamento.valorTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted">Restante</span>
                      <span className="text-xs font-mono text-fluxo-amber">
                        {formatCurrency((t.parcelamento.total - t.parcelamento.atual) * t.valor)}
                      </span>
                    </div>
                    <ParcelaDots total={t.parcelamento.total} atual={t.parcelamento.atual} />
                  </div>
                </div>
              )}

              {t.observacao && (
                <div className="flex items-start gap-2">
                  <FileText size={13} className="text-muted shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-muted font-mono block">Observação</span>
                    <span className="text-xs text-muted">{t.observacao}</span>
                  </div>
                </div>
              )}

              <div className="text-[10px] text-muted font-mono">
                Criado em: {t.criadoEm ? formatDate(t.criadoEm.split('T')[0]) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-white/[0.05]">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted hover:text-white hover:bg-white/5 transition-all"
              >
                <Edit3 size={13} /> Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-fluxo-red hover:bg-fluxo-red/10 transition-all"
              >
                <Trash2 size={13} /> Excluir
              </button>
            )}
          </div>
        </div>
      )}
    </div>
    </SwipeableRow>
  );
}
