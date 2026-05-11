import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Cartao, Categoria, Conta } from '@/types';

const categorias: { value: Categoria; label: string }[] = [
  { value: 'moradia', label: 'Moradia' }, { value: 'alimentacao', label: 'Alimentação' },
  { value: 'transporte', label: 'Transporte' }, { value: 'saude', label: 'Saúde' },
  { value: 'educacao', label: 'Educação' }, { value: 'lazer', label: 'Lazer' },
  { value: 'assinaturas', label: 'Assinaturas' }, { value: 'vestuario', label: 'Vestuário' },
  { value: 'viagem', label: 'Viagem' }, { value: 'investimento', label: 'Investimento' },
  { value: 'outros', label: 'Outros' },
  { value: 'entrada_salario', label: 'Salário' },
  { value: 'entrada_freelance', label: 'Freelance' },
  { value: 'entrada_outros', label: 'Outras Entradas' },
];

interface ModalRecorrenciaProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  cartoes?: Cartao[];
  contas?: Conta[];
  initialData?: any;
  isCartaoOnly?: boolean;
}

export default function ModalRecorrencia({
  open, onClose, onSubmit,
  cartoes = [], contas = [],
  initialData, isCartaoOnly
}: ModalRecorrenciaProps) {
  const [modo, setModo] = useState<'debito' | 'entrada'>(initialData?.tipo || 'debito');
  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    diaCobranca: '10',
    categoria: 'assinaturas' as Categoria,
    cartaoId: cartoes[0]?.id || '',
    contaId: contas[0]?.id || '',
  });

  useEffect(() => {
    if (initialData) {
      setModo(initialData.tipo === 'entrada' ? 'entrada' : 'debito');
      setForm({
        descricao: initialData.descricao || '',
        valor: initialData.valor ? String(initialData.valor) : '',
        diaCobranca: initialData.diaCobranca ? String(initialData.diaCobranca) : '10',
        categoria: initialData.categoria || 'assinaturas',
        cartaoId: initialData.cartaoId || cartoes[0]?.id || '',
        contaId: initialData.contaId || contas[0]?.id || '',
      });
    } else {
      setModo('debito');
      setForm({
        descricao: '', valor: '', diaCobranca: '10', categoria: 'assinaturas',
        cartaoId: cartoes[0]?.id || '', contaId: contas[0]?.id || '',
      });
    }
  }, [initialData, open, cartoes, contas, isCartaoOnly]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.descricao || !form.valor || !form.diaCobranca) return;
    onSubmit({
      id: initialData?.id,
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      tipo: isCartaoOnly ? 'credito_cartao' : (form.cartaoId && modo === 'debito' ? 'credito_cartao' : modo),
      categoria: form.categoria,
      diaCobranca: parseInt(form.diaCobranca),
      cartaoId: (isCartaoOnly || modo === 'debito') && form.cartaoId ? form.cartaoId : undefined,
      contaId: isCartaoOnly ? undefined : form.contaId,
      ativa: initialData ? initialData.ativa : true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-surface border border-white/[0.07] rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold">{initialData ? 'Editar Recorrência' : 'Nova Recorrência'}</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>

        {!isCartaoOnly && (
          <div className="flex gap-1 bg-white/[0.03] p-1 rounded-lg mb-4">
            <button onClick={() => setModo('debito')} className={`flex-1 py-1.5 text-xs font-mono rounded ${modo === 'debito' ? 'bg-fluxo-red text-white' : 'text-muted'}`}>Saída Fixa</button>
            <button onClick={() => setModo('entrada')} className={`flex-1 py-1.5 text-xs font-mono rounded ${modo === 'entrada' ? 'bg-fluxo-green text-white' : 'text-muted'}`}>Entrada Fixa</button>
          </div>
        )}

        <div className="space-y-3">
          <input className="input-dark w-full" placeholder={modo === 'debito' ? "Descrição (ex: Netflix, Academia...)" : "Descrição (ex: Salário...)"}
            value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />

          <div className="flex gap-3">
            <input className="input-dark flex-1" type="number" step="0.01" placeholder="Valor mensal"
              value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
            <div className="w-24">
              <input className="input-dark w-full" type="number" min="1" max="31" placeholder="Dia (1-31)"
                value={form.diaCobranca} onChange={e => setForm(f => ({ ...f, diaCobranca: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted font-mono block mb-1">Categoria</label>
              <select className="input-dark w-full" value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value as Categoria }))}>
                {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            {!isCartaoOnly ? (
              <div className="flex-1">
                <label className="text-xs text-muted font-mono block mb-1">Conta de Origem/Destino</label>
                <select className="input-dark w-full" value={form.contaId}
                  onChange={e => setForm(f => ({ ...f, contaId: e.target.value }))}>
                  {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            ) : (
              <div className="flex-1">
                <label className="text-xs text-muted font-mono block mb-2">Cartão de Crédito</label>
                <div className="grid grid-cols-2 gap-2">
                  {cartoes.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, cartaoId: c.id }))}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                        form.cartaoId === c.id
                          ? 'border-brand-primary bg-brand-primary/10'
                          : 'border-white/[0.07] hover:border-white/20'
                      }`}
                    >
                      <div className="w-6 h-1.5 rounded-full mb-1.5" style={{ background: c.cor }} />
                      <p className="text-xs font-bold truncate">{c.nome}</p>
                      <p className="text-[10px] text-muted font-mono truncate">**** {c.ultimos4}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {modo === 'debito' && cartoes.length > 0 && !isCartaoOnly && (
              <div className="flex-1">
                <label className="text-xs text-muted font-mono block mb-1">Cartão (Opcional)</label>
                <select className="input-dark w-full" value={form.cartaoId}
                  onChange={e => setForm(f => ({ ...f, cartaoId: e.target.value }))}>
                  <option value="">Débito em Conta</option>
                  {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary">{initialData ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}
