import { useState, useEffect } from 'react';
import { X, CreditCard, Info } from 'lucide-react';

interface ModalCartaoProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: any;
  taxaJurosGlobal?: number;
}

const cores = ['#a78bfa', '#f97316', '#374151', '#60a5fa', '#34d399', '#fb7185', '#fbbf24', '#f472b6'];

export default function ModalCartao({ open, onClose, onSubmit, initialData, taxaJurosGlobal = 15 }: ModalCartaoProps) {
  const [form, setForm] = useState({
    nome: '', banco: '', bandeira: 'Mastercard', ultimos4: '',
    limite: '', diaVencimento: '10', diaFechamento: '3', cor: '#a78bfa',
    usarTaxaGlobal: true,
    taxaJurosRotativo: '',
    taxaJurosParcela: '0',
  });

  useEffect(() => {
    if (initialData) {
      const hasCustomRate = initialData.taxaJurosRotativo !== undefined && initialData.taxaJurosRotativo !== null;
      setForm({
        nome: initialData.nome || '',
        banco: initialData.banco || '',
        bandeira: initialData.bandeira || 'Mastercard',
        ultimos4: initialData.ultimos4 || '',
        limite: initialData.limite ? String(initialData.limite) : '',
        diaVencimento: initialData.diaVencimento ? String(initialData.diaVencimento) : '10',
        diaFechamento: initialData.diaFechamento ? String(initialData.diaFechamento) : '3',
        cor: initialData.cor || '#a78bfa',
        usarTaxaGlobal: !hasCustomRate,
        taxaJurosRotativo: hasCustomRate ? String(initialData.taxaJurosRotativo) : '',
        taxaJurosParcela: initialData.taxaJurosParcela !== undefined ? String(initialData.taxaJurosParcela) : '0',
      });
    } else {
      setForm({
        nome: '', banco: '', bandeira: 'Mastercard', ultimos4: '',
        limite: '', diaVencimento: '10', diaFechamento: '3', cor: '#a78bfa',
        usarTaxaGlobal: true, taxaJurosRotativo: '', taxaJurosParcela: '0',
      });
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.nome || !form.ultimos4) return;
    const taxaRot = form.usarTaxaGlobal ? undefined : (parseFloat(form.taxaJurosRotativo) || undefined);
    onSubmit({
      id: initialData?.id,
      nome: form.nome, banco: form.banco, bandeira: form.bandeira,
      ultimos4: form.ultimos4, limite: parseFloat(form.limite) || 0,
      diaVencimento: parseInt(form.diaVencimento), diaFechamento: parseInt(form.diaFechamento),
      cor: form.cor,
      taxaJurosRotativo: taxaRot,
      taxaJurosParcela: parseFloat(form.taxaJurosParcela) || 0,
    });
    onClose();
  };

  // Simulate what the closing date means
  const diaFech = parseInt(form.diaFechamento) || 3;
  const diaVenc = parseInt(form.diaVencimento) || 10;
  const hoje = new Date();
  const exemploCompra1 = diaFech > 1 ? diaFech - 1 : 1;
  const exemploCompra2 = diaFech + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-surface border border-white/[0.07] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <CreditCard size={20} className="text-brand-primary" />
            <h3 className="text-lg font-bold">{initialData ? 'Editar Cartão' : 'Novo Cartão'}</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white p-1"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Basic info */}
          <div className="space-y-3">
            <p className="label-mono">Dados do Cartão</p>
            <input className="input-dark w-full" placeholder="Nome (ex: Nubank, Inter)" value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            <input className="input-dark w-full" placeholder="Banco" value={form.banco}
              onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} />
            <div className="flex gap-3">
              <select className="input-dark flex-1" value={form.bandeira}
                onChange={e => setForm(f => ({ ...f, bandeira: e.target.value }))}>
                {['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard'].map(b => <option key={b}>{b}</option>)}
              </select>
              <input className="input-dark w-28" placeholder="Últimos 4" maxLength={4}
                value={form.ultimos4} onChange={e => setForm(f => ({ ...f, ultimos4: e.target.value }))} />
            </div>
            <input className="input-dark w-full" type="number" placeholder="Limite (R$)"
              value={form.limite} onChange={e => setForm(f => ({ ...f, limite: e.target.value }))} />
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <p className="label-mono">Ciclo de Faturamento</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted block mb-1">Dia de Fechamento</label>
                <input className="input-dark w-full" type="number" min="1" max="31"
                  value={form.diaFechamento} onChange={e => setForm(f => ({ ...f, diaFechamento: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Dia de Vencimento</label>
                <input className="input-dark w-full" type="number" min="1" max="31"
                  value={form.diaVencimento} onChange={e => setForm(f => ({ ...f, diaVencimento: e.target.value }))} />
              </div>
            </div>
            {/* Explanation box */}
            <div className="p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/10 space-y-1">
              <div className="flex items-center gap-1.5 mb-2">
                <Info size={12} className="text-brand-primary" />
                <p className="text-[10px] text-brand-primary font-mono uppercase">Como funciona o ciclo</p>
              </div>
              <p className="text-[11px] text-muted">
                ✅ Compra no dia <strong className="text-white">{exemploCompra1}</strong> → fatura do mês atual (fecha dia {diaFech})
              </p>
              <p className="text-[11px] text-muted">
                ➡️ Compra no dia <strong className="text-white">{exemploCompra2}</strong> → próxima fatura (após fechamento)
              </p>
              <p className="text-[11px] text-muted">
                📅 Vencimento da fatura: dia <strong className="text-white">{diaVenc}</strong>
              </p>
            </div>
          </div>

          {/* Interest rates */}
          <div className="space-y-3">
            <p className="label-mono">Juros</p>
            <div className="flex items-center justify-between p-3 rounded-lg bg-s2 border border-white/[0.05]">
              <div>
                <p className="text-sm">Usar taxa global ({taxaJurosGlobal}% a.m.)</p>
                <p className="text-[10px] text-muted">Configurada em Configurações → Cartões</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, usarTaxaGlobal: !f.usarTaxaGlobal }))}
                className={`w-11 h-6 rounded-full transition-all relative ${form.usarTaxaGlobal ? 'bg-brand-primary' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.usarTaxaGlobal ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            {!form.usarTaxaGlobal && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <div>
                  <label className="text-xs text-muted block mb-1">Juros Rotativo (% a.m.)</label>
                  <input className="input-dark w-full" type="number" step="0.1"
                    placeholder={`Ex: ${taxaJurosGlobal}`}
                    value={form.taxaJurosRotativo}
                    onChange={e => setForm(f => ({ ...f, taxaJurosRotativo: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Juros Parcela (% a.m.)</label>
                  <input className="input-dark w-full" type="number" step="0.1"
                    placeholder="Ex: 3"
                    value={form.taxaJurosParcela}
                    onChange={e => setForm(f => ({ ...f, taxaJurosParcela: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          {/* Color */}
          <div>
            <p className="text-xs text-muted mb-2">Cor do Cartão</p>
            <div className="flex gap-2 flex-wrap">
              {cores.map(c => (
                <button key={c} className={`w-8 h-8 rounded-full transition-all ${form.cor === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                  style={{ background: c }} onClick={() => setForm(f => ({ ...f, cor: c }))} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary">{initialData ? 'Salvar' : 'Criar Cartão'}</button>
        </div>
      </div>
    </div>
  );
}
