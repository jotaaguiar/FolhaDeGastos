import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Categoria } from '@/types';
import { getCategoriaLabel } from '@/lib/formatters';

const categorias: Categoria[] = ['moradia', 'alimentacao', 'transporte', 'saude', 'educacao', 'lazer', 'assinaturas', 'vestuario', 'viagem', 'investimento', 'outros'];

interface ModalOrcamentoProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { categoria: Categoria; limite: number; alertaPct: number }) => void;
  initial?: { categoria?: Categoria; limite?: number; alertaPct?: number };
}

export default function ModalOrcamento({ open, onClose, onSubmit, initial }: ModalOrcamentoProps) {
  const [form, setForm] = useState({
    categoria: 'outros' as Categoria,
    limite: '',
    alertaPct: '80',
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      categoria: initial?.categoria || 'outros' as Categoria,
      limite: initial?.limite?.toString() || '',
      alertaPct: initial?.alertaPct?.toString() || '80',
    });
  }, [initial, open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.limite) return;
    onSubmit({ categoria: form.categoria, limite: parseFloat(form.limite), alertaPct: parseInt(form.alertaPct) || 80 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-surface border border-white/[0.07] rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold">{initial ? 'Editar Limite' : 'Novo Limite'}</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <select className="input-dark w-full" value={form.categoria}
            onChange={e => setForm(f => ({ ...f, categoria: e.target.value as Categoria }))}>
            {categorias.map(c => <option key={c} value={c}>{getCategoriaLabel(c)}</option>)}
          </select>
          <input className="input-dark w-full" type="number" step="0.01" placeholder="Limite mensal (R$)"
            value={form.limite} onChange={e => setForm(f => ({ ...f, limite: e.target.value }))} />
          <input className="input-dark w-full" type="number" min="50" max="100" placeholder="Alerta em %"
            value={form.alertaPct} onChange={e => setForm(f => ({ ...f, alertaPct: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary">{initial ? 'Salvar' : 'Criar'}</button>
        </div>
      </div>
    </div>
  );
}
