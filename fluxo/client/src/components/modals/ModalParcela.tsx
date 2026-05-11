import { useState } from 'react';
import { X } from 'lucide-react';
import type { Cartao, Categoria } from '@/types';
import { getMesNome } from '@/lib/formatters';

const categorias: { value: Categoria; label: string }[] = [
  { value: 'moradia', label: 'Moradia' }, { value: 'alimentacao', label: 'Alimentação' },
  { value: 'transporte', label: 'Transporte' }, { value: 'saude', label: 'Saúde' },
  { value: 'educacao', label: 'Educação' }, { value: 'lazer', label: 'Lazer' },
  { value: 'assinaturas', label: 'Assinaturas' }, { value: 'vestuario', label: 'Vestuário' },
  { value: 'viagem', label: 'Viagem' }, { value: 'investimento', label: 'Investimento' },
  { value: 'outros', label: 'Outros' },
];

interface ModalParcelaProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    descricao: string; valorTotal: number; parcelas: number;
    cartaoId?: string; contaId?: string; categoria: string; mesInicio: number; anoInicio: number;
  }) => void;
  cartoes: Cartao[];
  contas: import('@/types').Conta[];
}

export default function ModalParcela({ open, onClose, onSubmit, cartoes, contas }: ModalParcelaProps) {
  const now = new Date();
  const [modo, setModo] = useState<'cartao' | 'conta'>('cartao');
  const [form, setForm] = useState({
    descricao: '',
    valorTotal: '',
    parcelas: '3',
    cartaoId: cartoes[0]?.id || '',
    contaId: contas[0]?.id || '',
    categoria: 'outros' as string,
    mesInicio: now.getMonth() + 1,
    anoInicio: now.getFullYear(),
  });

  if (!open) return null;

  const valorParcela = form.valorTotal ? (parseFloat(form.valorTotal) / parseInt(form.parcelas || '1')).toFixed(2) : '0.00';

  // Generate month options (current + 11 months ahead)
  const mesesOpcoes: { mes: number; ano: number; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    let m = now.getMonth() + 1 + i;
    let a = now.getFullYear();
    while (m > 12) { m -= 12; a++; }
    mesesOpcoes.push({ mes: m, ano: a, label: `${getMesNome(m)} ${a}` });
  }

  const handleSubmit = () => {
    if (!form.descricao.trim() || !form.valorTotal || !form.parcelas) return;
    if (modo === 'cartao' && !form.cartaoId) return;
    if (modo === 'conta' && !form.contaId) return;
    onSubmit({
      descricao: form.descricao.trim(),
      valorTotal: parseFloat(form.valorTotal),
      parcelas: parseInt(form.parcelas),
      cartaoId: modo === 'cartao' ? form.cartaoId : undefined,
      contaId: modo === 'conta' ? form.contaId : undefined,
      categoria: form.categoria,
      mesInicio: form.mesInicio,
      anoInicio: form.anoInicio,
    });
    setForm({ ...form, descricao: '', valorTotal: '' });
    onClose();
  };

  // Preview: show which months get charged
  const previewMeses: string[] = [];
  for (let i = 0; i < Math.min(parseInt(form.parcelas || '1'), 24); i++) {
    let m = form.mesInicio + i;
    let a = form.anoInicio;
    while (m > 12) { m -= 12; a++; }
    previewMeses.push(`${getMesNome(m).slice(0, 3)}/${a}`);
  }

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-sheet md:max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold">Novo Parcelamento / Empréstimo</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-lg mb-4">
          <button onClick={() => setModo('cartao')} className={`flex-1 py-1.5 text-xs font-mono rounded ${modo === 'cartao' ? 'bg-brand-primary text-white' : 'text-muted'}`}>Cartão de Crédito</button>
          <button onClick={() => setModo('conta')} className={`flex-1 py-1.5 text-xs font-mono rounded ${modo === 'conta' ? 'bg-fluxo-blue text-white' : 'text-muted'}`}>Débito em Conta (Empréstimo)</button>
        </div>

        <div className="space-y-3">
          <input className="input-dark w-full" placeholder={modo === 'cartao' ? "Descrição (ex: iPhone 15...)" : "Descrição (ex: Empréstimo, Carné...)"}
            value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted font-mono block mb-1">Valor Total</label>
              <input className="input-dark w-full" type="number" step="0.01" placeholder="R$ 0,00"
                value={form.valorTotal} onChange={e => setForm(f => ({ ...f, valorTotal: e.target.value }))} />
            </div>
            <div className="w-24">
              <label className="text-xs text-muted font-mono block mb-1">Parcelas</label>
              <input className="input-dark w-full" type="number" min="1" max="48" placeholder="3"
                value={form.parcelas} onChange={e => setForm(f => ({ ...f, parcelas: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted font-mono block mb-1">{modo === 'cartao' ? 'Cartão' : 'Conta'}</label>
              {modo === 'cartao' ? (
                <select className="input-dark w-full" value={form.cartaoId}
                  onChange={e => setForm(f => ({ ...f, cartaoId: e.target.value }))}>
                  {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome} (•••• {c.ultimos4})</option>)}
                </select>
              ) : (
                <select className="input-dark w-full" value={form.contaId}
                  onChange={e => setForm(f => ({ ...f, contaId: e.target.value }))}>
                  {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              )}
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted font-mono block mb-1">Categoria</label>
              <select className="input-dark w-full" value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted font-mono block mb-1">{modo === 'cartao' ? 'Primeira parcela cai na fatura de:' : 'Primeiro débito acontece em:'}</label>
            <select className="input-dark w-full" value={`${form.mesInicio}-${form.anoInicio}`}
              onChange={e => {
                const [m, a] = e.target.value.split('-').map(Number);
                setForm(f => ({ ...f, mesInicio: m, anoInicio: a }));
              }}>
              {mesesOpcoes.map(o => (
                <option key={`${o.mes}-${o.ano}`} value={`${o.mes}-${o.ano}`}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          {form.valorTotal && form.parcelas && (
            <div className="bg-s2 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted font-mono">Valor por parcela:</span>
                <span className="font-mono text-sm text-brand-primary font-bold">R$ {valorParcela}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted font-mono">Parcelas:</span>
                <span className="font-mono text-sm">{form.parcelas}×</span>
              </div>
              <div>
                <span className="text-xs text-muted font-mono block mb-1">{modo === 'cartao' ? 'Faturas afetadas:' : 'Meses afetados:'}</span>
                <div className="flex flex-wrap gap-1">
                  {previewMeses.map((m, i) => (
                    <span key={i} className="badge text-[10px] bg-brand-primary/10 text-brand-primary">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary">Criar Parcelamento</button>
        </div>
      </div>
    </div>
  );
}
