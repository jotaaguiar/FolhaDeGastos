import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Conta } from '@/types';

interface ModalTransferenciaProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { contaId: string; contaDestinoId: string; valor: number; data: string }) => void;
  contas: Conta[];
}

export default function ModalTransferencia({ open, onClose, onSubmit, contas }: ModalTransferenciaProps) {
  const [form, setForm] = useState({
    contaId: contas[0]?.id || '', contaDestinoId: contas[1]?.id || '',
    valor: '', data: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (open) setForm(f => ({ ...f, valor: '', data: new Date().toISOString().split('T')[0] }));
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.valor || form.contaId === form.contaDestinoId) return;
    onSubmit({ ...form, valor: parseFloat(form.valor) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-surface border border-white/[0.07] rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold">TransferÃªncia</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted">Conta origem</label>
            <select className="input-dark w-full mt-1" value={form.contaId}
              onChange={e => setForm(f => ({ ...f, contaId: e.target.value }))}>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted">Conta destino</label>
            <select className="input-dark w-full mt-1" value={form.contaDestinoId}
              onChange={e => setForm(f => ({ ...f, contaDestinoId: e.target.value }))}>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <input className="input-dark flex-1" type="number" step="0.01" placeholder="Valor"
              value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
            <input className="input-dark flex-1" type="date" value={form.data}
              onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary">Transferir</button>
        </div>
      </div>
    </div>
  );
}
