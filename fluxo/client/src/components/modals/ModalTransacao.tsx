import { useState, useEffect } from 'react';
import { X, ArrowDownRight, CreditCard, ArrowUpRight } from 'lucide-react';
import type { Conta, Cartao, Categoria } from '@/types';
import TagInput from '@/components/shared/TagInput';
import CategoriaSelect from '@/components/shared/CategoriaSelect';
import AmountPad from '@/components/shared/AmountPad';
import { formatCurrency } from '@/lib/formatters';
import { api } from '@/lib/api';

interface ModalTransacaoProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  contas: Conta[];
  cartoes: Cartao[];
  initialData?: any;
}

type Tipo = 'debito' | 'credito_cartao' | 'entrada';

const TIPOS: Array<{ value: Tipo; label: string; Icon: any; color: string }> = [
  { value: 'debito', label: 'Saída', Icon: ArrowDownRight, color: 'text-fluxo-red' },
  { value: 'credito_cartao', label: 'Crédito', Icon: CreditCard, color: 'text-brand-primary' },
  { value: 'entrada', label: 'Entrada', Icon: ArrowUpRight, color: 'text-fluxo-green' },
];

export default function ModalTransacao({ open, onClose, onSubmit, contas, cartoes, initialData }: ModalTransacaoProps) {
  const [form, setForm] = useState({
    descricao: '',
    cents: 0,
    tipo: 'debito' as Tipo,
    data: new Date().toISOString().split('T')[0],
    categoria: 'outros' as Categoria,
    contaId: contas[0]?.id || '',
    cartaoId: cartoes[0]?.id || '',
    observacao: '',
    tags: [] as string[],
  });
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showMaisDetalhes, setShowMaisDetalhes] = useState(false);

  useEffect(() => {
    if (open) api.getTags().then(setTagSuggestions).catch(() => {});
  }, [open]);

  // Desktop: aceita digitos, backspace e ',' do teclado físico — só quando foco NÃO está em input/textarea
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setForm(f => f.cents >= 99999999999 ? f : { ...f, cents: f.cents * 10 + parseInt(e.key, 10) });
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setForm(f => ({ ...f, cents: Math.floor(f.cents / 10) }));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        descricao: initialData.descricao || '',
        cents: initialData.valor ? Math.round(Number(initialData.valor) * 100) : 0,
        tipo: (initialData.tipo as Tipo) || 'debito',
        data: initialData.data || new Date().toISOString().split('T')[0],
        categoria: initialData.categoria || 'outros',
        contaId: initialData.contaId || contas[0]?.id || '',
        cartaoId: initialData.cartaoId || cartoes[0]?.id || '',
        observacao: initialData.observacao || '',
        tags: initialData.tags || [],
      });
      setShowMaisDetalhes(!!(initialData.observacao || (initialData.tags && initialData.tags.length)));
    } else {
      setForm({
        descricao: '', cents: 0, tipo: 'debito',
        data: new Date().toISOString().split('T')[0],
        categoria: 'outros',
        contaId: contas[0]?.id || '',
        cartaoId: cartoes[0]?.id || '',
        observacao: '',
        tags: [],
      });
      setShowMaisDetalhes(false);
    }
  }, [initialData, open]);

  if (!open) return null;

  const valor = form.cents / 100;
  const isValid = form.descricao.trim().length > 0 && form.cents > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      id: initialData?.id,
      descricao: form.descricao,
      valor,
      tipo: form.tipo,
      data: form.data,
      categoria: form.categoria,
      contaId: form.tipo !== 'credito_cartao' ? form.contaId : undefined,
      cartaoId: form.tipo === 'credito_cartao' ? form.cartaoId : undefined,
      recorrente: initialData ? initialData.recorrente : false,
      observacao: form.observacao || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
    });
    onClose();
  };

  // Cor do valor segue o tipo selecionado
  const valorColor = form.tipo === 'entrada' ? 'text-fluxo-green' : form.tipo === 'credito_cartao' ? 'text-brand-primary' : 'text-fluxo-red';

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-sheet p-0" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-5 pb-3 sticky top-0 z-10" style={{ background: 'rgb(var(--surface-rgb))' }}>
          <h3 className="text-lg font-bold tracking-tight">{initialData ? 'Editar' : 'Nova Transação'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-white/[0.06] active:scale-90" style={{ transition: 'background 0.2s var(--ease-ios), transform 0.15s var(--ease-ios)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Hero: valor + tipo */}
        <div className="px-5 pb-5 pt-2 text-center space-y-4">
          <div>
            <p className="label-mono mb-1">Valor</p>
            <p className={`text-4xl md:text-5xl font-extrabold font-mono tracking-tight leading-none ${form.cents === 0 ? 'text-muted opacity-50' : valorColor}`}>
              {formatCurrency(valor)}
            </p>
          </div>

          {/* Segmented control de tipo */}
          <div
            className="grid grid-cols-3 gap-1 p-1 rounded-xl"
            style={{ background: 'var(--overlay-subtle)' }}
          >
            {TIPOS.map(t => {
              const active = form.tipo === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                  className={`relative flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold active:scale-[0.97] ${active ? '' : 'text-muted'}`}
                  style={{
                    background: active ? 'rgb(var(--surface-rgb))' : 'transparent',
                    border: active ? '1px solid var(--border2)' : '1px solid transparent',
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    color: active ? (t.value === 'entrada' ? 'rgb(var(--green-rgb))' : t.value === 'credito_cartao' ? 'rgb(var(--brand-primary-rgb))' : 'rgb(var(--red-rgb))') : undefined,
                    transition: 'background 0.2s var(--ease-ios), border-color 0.2s var(--ease-ios), transform 0.15s var(--ease-ios), color 0.2s var(--ease-ios)',
                  }}
                >
                  <t.Icon size={14} strokeWidth={2.2} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form fields */}
        <div className="px-5 space-y-3">
          <input
            className="input-dark w-full"
            placeholder="Descrição"
            value={form.descricao}
            onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
            autoFocus={!initialData}
          />

          <div className="grid grid-cols-2 gap-3">
            <CategoriaSelect
              value={form.categoria}
              onChange={v => setForm(f => ({ ...f, categoria: v as Categoria }))}
            />
            <input
              className="input-dark w-full"
              type="date"
              value={form.data}
              onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
            />
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

          {/* Mais detalhes — collapsible */}
          <button
            type="button"
            onClick={() => setShowMaisDetalhes(s => !s)}
            className="flex items-center justify-between w-full py-2 text-xs font-mono uppercase tracking-wider text-muted hover:text-text-base"
            style={{ transition: 'color 0.2s var(--ease-ios)' }}
          >
            <span>{showMaisDetalhes ? '− Menos detalhes' : '+ Mais detalhes'}</span>
            <span className="text-[10px]">{form.tags.length > 0 || form.observacao ? '●' : ''}</span>
          </button>
          {showMaisDetalhes && (
            <div className="space-y-3 animate-fade-in">
              <TagInput
                tags={form.tags}
                onChange={tags => setForm(f => ({ ...f, tags }))}
                suggestions={tagSuggestions}
                placeholder="Tags (ex: viagem, agosto...)"
              />
              <textarea
                className="input-dark w-full resize-none"
                rows={2}
                placeholder="Observação"
                value={form.observacao}
                onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
              />
            </div>
          )}
        </div>

        {/* Keypad */}
        <div className="px-5 pt-4 pb-3">
          <AmountPad
            cents={form.cents}
            onChange={cents => setForm(f => ({ ...f, cents }))}
          />
        </div>

        {/* Sticky footer com ações */}
        <div
          className="sticky bottom-0 px-5 py-3 flex gap-2 border-t border-white/[0.05]"
          style={{
            background: 'rgb(var(--surface-rgb) / 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="btn-primary flex-[2] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {initialData ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}
