import { useState, useEffect } from 'react';
import { X, DollarSign, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { Fatura, Conta, Cartao } from '@/types';
import { formatCurrency } from '@/lib/formatters';

interface ModalPagarFaturaProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { contaPagamentoId: string; valorPago: number; dataPagamento: string; taxaJuros?: number }) => Promise<void>;
  fatura: (Fatura & { total: number; cartao?: Cartao }) | null;
  contas: Conta[];
  taxaJurosGlobal?: number;
}

export default function ModalPagarFatura({ open, onClose, onSubmit, fatura, contas, taxaJurosGlobal = 15 }: ModalPagarFaturaProps) {
  const [contaId, setContaId] = useState('');
  const [pagarTotal, setPagarTotal] = useState(true);
  const [valorPago, setValorPago] = useState('');
  const [dataPag, setDataPag] = useState(new Date().toISOString().split('T')[0]);
  const [taxaJuros, setTaxaJuros] = useState('');
  const [loading, setLoading] = useState(false);

  // Quanto já foi pago antes (pagamentos parciais anteriores)
  const jaFoiPago = fatura?.valorPago ?? 0;
  // Valor restante a pagar
  const totalRestante = fatura ? Math.max(0, fatura.total - jaFoiPago) : 0;

  useEffect(() => {
    if (open && fatura) {
      setValorPago(totalRestante.toFixed(2));
      setPagarTotal(true);
      if (contas.length > 0) setContaId(contas[0].id);
      setDataPag(new Date().toISOString().split('T')[0]);
      const taxa = fatura.cartao?.taxaJurosRotativo ?? taxaJurosGlobal;
      setTaxaJuros(String(taxa));
    }
  }, [open, fatura, contas, taxaJurosGlobal]);

  if (!open || !fatura) return null;

  const valorPagoNum = parseFloat(valorPago) || 0;
  const isParcial = !pagarTotal && valorPagoNum < totalRestante - 0.01;
  const restante = Math.max(0, totalRestante - valorPagoNum);
  const taxa = parseFloat(taxaJuros) || 0;
  const juros = isParcial ? Math.round(restante * (taxa / 100) * 100) / 100 : 0;
  const rollover = isParcial ? Math.round((restante + juros) * 100) / 100 : 0;

  const handlePagarTotal = (val: boolean) => {
    setPagarTotal(val);
    if (val) setValorPago(totalRestante.toFixed(2));
  };

  const handleSubmit = async () => {
    if (!contaId) return;
    setLoading(true);
    try {
      await onSubmit({
        contaPagamentoId: contaId,
        valorPago: pagarTotal ? totalRestante : valorPagoNum,
        dataPagamento: dataPag,
        taxaJuros: isParcial ? taxa : undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="p-5 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02] sticky top-0 z-10 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: (fatura.cartao?.cor || '#a78bfa') + '20', color: fatura.cartao?.cor || '#a78bfa' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Pagar Fatura</h3>
                <p className="text-xs text-muted font-mono">
                  {fatura.cartao?.nome} •••• {fatura.cartao?.ultimos4} – {String(fatura.mes).padStart(2, '0')}/{fatura.ano}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-muted hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Total summary */}
            <div className="p-4 rounded-xl bg-fluxo-amber/5 border border-fluxo-amber/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="label-mono text-[10px]">Total Original</p>
                  <p className="text-xl font-extrabold font-mono text-fluxo-amber">{formatCurrency(fatura.total)}</p>
                </div>
                {jaFoiPago > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] text-muted font-mono">Já pago</p>
                    <p className="text-sm font-mono text-fluxo-green font-bold">-{formatCurrency(jaFoiPago)}</p>
                  </div>
                )}
              </div>

              {jaFoiPago > 0 && (
                <div className="mt-2 pt-2 border-t border-white/[0.05] flex justify-between items-center">
                  <span className="text-xs text-muted">Restante a pagar:</span>
                  <span className="text-lg font-extrabold font-mono text-white">{formatCurrency(totalRestante)}</span>
                </div>
              )}

              {fatura.saldoAnteriorRollover && fatura.saldoAnteriorRollover > 0 && (
                <div className="mt-2 pt-2 border-t border-white/[0.05] grid grid-cols-2 gap-1 text-xs">
                  <span className="text-muted">Gastos próprios:</span>
                  <span className="font-mono text-right">{formatCurrency(fatura.total - fatura.saldoAnteriorRollover)}</span>
                  <span className="text-fluxo-red">+ Rollover anterior:</span>
                  <span className="font-mono text-fluxo-red text-right">{formatCurrency(fatura.saldoAnteriorRollover)}</span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.05]">
                <Info size={12} className="text-muted" />
                <p className="text-[10px] text-muted">Vence em {fatura.dataVencimento}</p>
              </div>
            </div>

            {/* Payment type toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => handlePagarTotal(true)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${pagarTotal ? 'border-fluxo-green/40 bg-fluxo-green/10 text-fluxo-green' : 'border-white/[0.07] text-muted hover:text-white'}`}
              >
                <CheckCircle size={14} className="inline mr-1.5" />
                {jaFoiPago > 0 ? 'Quitar Saldo' : 'Pagar Total'}
              </button>
              <button
                onClick={() => handlePagarTotal(false)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${!pagarTotal ? 'border-fluxo-amber/40 bg-fluxo-amber/10 text-fluxo-amber' : 'border-white/[0.07] text-muted hover:text-white'}`}
              >
                <AlertTriangle size={14} className="inline mr-1.5" />
                Valor Parcial
              </button>
            </div>

            {/* Payment amount (only for partial) */}
            {!pagarTotal && (
              <div className="animate-fade-in">
                <label className="text-xs text-muted block mb-1">
                  Valor a Pagar (R$) – máx. {formatCurrency(totalRestante)}
                </label>
                <input
                  className="input-dark w-full text-lg font-mono font-bold"
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalRestante}
                  value={valorPago}
                  onChange={e => setValorPago(e.target.value)}
                  autoFocus
                />
                <p className="text-[10px] text-muted mt-1">
                  Mínimo recomendado: {formatCurrency(totalRestante * 0.1)} (10% do restante)
                </p>
              </div>
            )}

            {/* Account selector */}
            <div>
              <label className="text-xs text-muted block mb-1">Conta de Pagamento</label>
              <select className="input-dark w-full" value={contaId} onChange={e => setContaId(e.target.value)}>
                {contas.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.banco})</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-muted block mb-1">Data do Pagamento</label>
              <input
                className="input-dark w-full"
                type="date"
                value={dataPag}
                onChange={e => setDataPag(e.target.value)}
              />
            </div>

            {/* Interest rate (only for partial) */}
            {!pagarTotal && valorPagoNum < totalRestante - 0.01 && (
              <div className="animate-fade-in">
                <label className="text-xs text-muted block mb-1">Taxa de Juros Rotativa (% a.m.)</label>
                <input
                  className="input-dark w-full"
                  type="number"
                  step="0.1"
                  value={taxaJuros}
                  onChange={e => setTaxaJuros(e.target.value)}
                />
                <p className="text-[10px] text-muted mt-1">
                  Taxa do cartão: {fatura.cartao?.taxaJurosRotativo ?? taxaJurosGlobal}% a.m.
                </p>
              </div>
            )}

            {/* Rollover preview */}
            {isParcial && (
              <div className="p-4 rounded-xl bg-fluxo-amber/5 border border-fluxo-amber/20 space-y-2 animate-fade-in">
                <p className="label-mono text-[10px] text-fluxo-amber">⚠️ Rollover para Próxima Fatura</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Restante não pago:</span>
                    <span className="font-mono text-white">{formatCurrency(restante)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Juros ({taxa}% a.m.):</span>
                    <span className="font-mono text-fluxo-red">+{formatCurrency(juros)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/[0.05]">
                    <span className="font-medium">Total rolado:</span>
                    <span className="font-mono font-bold text-fluxo-amber">{formatCurrency(rollover)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation summary */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <p className="text-[10px] text-muted font-mono uppercase mb-2">Resumo do Pagamento</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Débito na conta:</span>
                <span className="font-mono font-bold text-fluxo-green">
                  -{formatCurrency(pagarTotal ? totalRestante : valorPagoNum)}
                </span>
              </div>
              {rollover > 0 && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted">Rollover próxima fatura:</span>
                  <span className="font-mono font-bold text-fluxo-amber">+{formatCurrency(rollover)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white/[0.02] border-t border-white/[0.05] flex gap-2 rounded-b-2xl">
            <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
            <button
              onClick={handleSubmit}
              disabled={loading || !contaId || (!pagarTotal && valorPagoNum <= 0) || totalRestante <= 0}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : pagarTotal
                ? `Pagar ${formatCurrency(totalRestante)}`
                : `Pagar ${formatCurrency(valorPagoNum)}`}
            </button>
          </div>
        </div>
      </div>
  );
}
