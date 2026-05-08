import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Conta, Cartao, Categoria } from '@/types';

const categorias: { value: Categoria; label: string }[] = [
  { value: 'moradia', label: 'Moradia' }, { value: 'alimentacao', label: 'Alimentação' },
  { value: 'transporte', label: 'Transporte' }, { value: 'saude', label: 'Saúde' },
  { value: 'educacao', label: 'Educação' }, { value: 'lazer', label: 'Lazer' },
  { value: 'assinaturas', label: 'Assinaturas' }, { value: 'vestuario', label: 'Vestuário' },
  { value: 'viagem', label: 'Viagem' }, { value: 'investimento', label: 'Investimento' },
  { value: 'outros', label: 'Outros' }, { value: 'entrada_salario', label: 'Salário' },
  { value: 'entrada_freelance', label: 'Freelance' }, { value: 'entrada_outros', label: 'Outras Entradas' },
];

interface ModalTransacaoProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  contas: Conta[];
  cartoes: Cartao[];
  initialData?: any;
}

export default function ModalTransacao({ open, onClose, onSubmit, contas, cartoes, initialData }: ModalTransacaoProps) {
  const [form, setForm] = useState({
    descricao: '', valor: '', tipo: 'debito' as string,
    data: new Date().toISOString().split('T')[0],
    categoria: 'outros' as Categoria,
    contaId: contas[0]?.id || '',
    cartaoId: cartoes[0]?.id || '',
    observacao: '',
  });

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        descricao: initialData.descricao || '',
        valor: initialData.valor ? String(initialData.valor) : '',
        tipo: initialData.tipo || 'debito',
        data: initialData.data || new Date().toISOString().split('T')[0],
        categoria: initialData.categoria || 'outros',
        contaId: initialData.contaId || contas[0]?.id || '',
        cartaoId: initialData.cartaoId || cartoes[0]?.id || '',
        observacao: initialData.observacao || '',
      });
    } else {
      setForm({
        descricao: '', valor: '', tipo: 'debito',
        data: new Date().toISOString().split('T')[0],
        categoria: 'outros',
        contaId: contas[0]?.id || '',
        cartaoId: cartoes[0]?.id || '',
        observacao: '',
      });
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.descricao || !form.valor) return;
    onSubmit({
      id: initialData?.id,
      descricao: form.descricao, valor: parseFloat(form.valor),
      tipo: form.tipo, data: form.data, categoria: form.categoria,
      contaId: form.tipo !== 'credito_cartao' ? form.contaId : undefined,
      cartaoId: form.tipo === 'credito_cartao' ? form.cartaoId : undefined,
      recorrente: initialData ? initialData.recorrente : false,
      observacao: form.observacao || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-surface border border-white/[0.07] rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold">{initialData ? 'Editar Transação' : 'Nova Transação'}</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <input className="input-dark w-full" placeholder="Descrição" value={form.descricao}
            onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} autoFocus />
          <div className="flex gap-3">
            <input className="input-dark flex-1" type="number" step="0.01" placeholder="Valor"
              value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
            <input className="input-dark flex-1" type="date" value={form.data}
              onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <select className="input-dark flex-1" value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              <option value="debito">Débito</option>
              <option value="credito_cartao">Crédito</option>
              <option value="entrada">Entrada</option>
            </select>
            <select className="input-dark flex-1" value={form.categoria}
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value as Categoria }))}>
              {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          {form.tipo !== 'credito_cartao' ? (
            <select className="input-dark w-full" value={form.contaId}
              onChange={e => setForm(f => ({ ...f, contaId: e.target.value }))}>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          ) : (
            <select className="input-dark w-full" value={form.cartaoId}
              onChange={e => setForm(f => ({ ...f, cartaoId: e.target.value }))}>
              {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          )}
          <textarea className="input-dark w-full" rows={2} placeholder="Observação (opcional)"
            value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary">{initialData ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}
