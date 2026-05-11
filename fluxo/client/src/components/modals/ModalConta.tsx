import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalContaProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initial?: { id?: string; nome?: string; banco?: string; tipo?: string; saldoInicial?: number; cor?: string; limiteChequeEspecial?: number; taxaJurosChequeEspecial?: number; diaCobrancaJuros?: number };
}

const cores = ['#a78bfa', '#f97316', '#60a5fa', '#34d399', '#fb7185', '#fbbf24', '#2dd4bf', '#f472b6'];

export default function ModalConta({ open, onClose, onSubmit, initial }: ModalContaProps) {
  const [form, setForm] = useState({
    nome: '', banco: '', tipo: 'corrente', saldoInicial: '0', cor: '#a78bfa',
    limiteChequeEspecial: '0', taxaJurosChequeEspecial: '0', diaCobrancaJuros: '1',
  });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        nome: initial.nome || '',
        banco: initial.banco || '',
        tipo: initial.tipo || 'corrente',
        saldoInicial: initial.saldoInicial?.toString() || '0',
        cor: initial.cor || '#a78bfa',
        limiteChequeEspecial: initial.limiteChequeEspecial?.toString() || '0',
        taxaJurosChequeEspecial: initial.taxaJurosChequeEspecial?.toString() || '0',
        diaCobrancaJuros: initial.diaCobrancaJuros?.toString() || '1',
      });
    } else {
      setForm({ nome: '', banco: '', tipo: 'corrente', saldoInicial: '0', cor: '#a78bfa', limiteChequeEspecial: '0', taxaJurosChequeEspecial: '0', diaCobrancaJuros: '1' });
    }
  }, [initial, open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.nome) return;
    onSubmit({
      id: initial?.id,
      nome: form.nome,
      banco: form.banco,
      tipo: form.tipo,
      saldoInicial: parseFloat(form.saldoInicial) || 0,
      cor: form.cor,
      limiteChequeEspecial: parseFloat(form.limiteChequeEspecial) || 0,
      taxaJurosChequeEspecial: parseFloat(form.taxaJurosChequeEspecial) || 0,
      diaCobrancaJuros: parseInt(form.diaCobrancaJuros) || 1,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-surface border border-white/[0.07] rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold">{initial ? 'Editar Conta' : 'Nova Conta'}</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <input className="input-dark w-full" placeholder="Nome da conta" value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} autoFocus />
          <input className="input-dark w-full" placeholder="Banco" value={form.banco}
            onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} />
          <select className="input-dark w-full" value={form.tipo}
            onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
            <option value="corrente">Corrente</option>
            <option value="poupanca">Poupança</option>
            <option value="investimento">Investimento</option>
            <option value="dinheiro">Dinheiro</option>
          </select>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1">
                {initial ? 'Saldo Inicial' : 'Saldo Inicial'}
              </label>
              <input className="input-dark w-full" type="number" step="0.01" placeholder="0.00"
                value={form.saldoInicial} onChange={e => setForm(f => ({ ...f, saldoInicial: e.target.value }))} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1">Cheque Especial</label>
              <input className="input-dark w-full" type="number" step="0.01" placeholder="0.00"
                value={form.limiteChequeEspecial} onChange={e => setForm(f => ({ ...f, limiteChequeEspecial: e.target.value }))} />
            </div>
          </div>

          {parseFloat(form.limiteChequeEspecial) > 0 && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Taxa Juros (% a.m.)</label>
                <input className="input-dark w-full" type="number" step="0.01" placeholder="0.00"
                  value={form.taxaJurosChequeEspecial} onChange={e => setForm(f => ({ ...f, taxaJurosChequeEspecial: e.target.value }))} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Dia da Cobrança</label>
                <input className="input-dark w-full" type="number" min="1" max="31"
                  value={form.diaCobrancaJuros} onChange={e => setForm(f => ({ ...f, diaCobrancaJuros: e.target.value }))} />
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-muted mb-2">Cor</p>
            <div className="flex gap-2">
              {cores.map(c => (
                <button key={c} className={`w-7 h-7 rounded-full transition-all ${form.cor === c ? 'ring-2 ring-white scale-110' : ''}`}
                  style={{ background: c }} onClick={() => setForm(f => ({ ...f, cor: c }))} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary">{initial ? 'Salvar' : 'Criar'}</button>
        </div>
      </div>
    </div>
  );
}
