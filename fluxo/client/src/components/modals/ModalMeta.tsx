import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalMetaProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: any;
}

const emojis = ['🎯', '🛡️', '✈️', '💻', '🏠', '🚗', '📚', '💍', '🎸', '🏋️', '💰', '🎓', '🌴', '🎮', '📱', '👶', '🐶', '🥊', '🎨', '⚽'];
const cores = ['#34d399', '#60a5fa', '#a78bfa', '#fb7185', '#fbbf24', '#2dd4bf', '#f472b6', '#f97316'];

export default function ModalMeta({ open, onClose, onSubmit, initialData }: ModalMetaProps) {
  const [form, setForm] = useState({
    nome: '', valorAlvo: '', prazo: '', cor: '#34d399', icone: '🎯', descricao: '',
  });

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        nome: initialData.nome || '',
        valorAlvo: initialData.valorAlvo ? String(initialData.valorAlvo) : '',
        prazo: initialData.prazo || '',
        cor: initialData.cor || '#34d399',
        icone: initialData.icone || '🎯',
        descricao: initialData.descricao || '',
      });
    } else {
      setForm({ nome: '', valorAlvo: '', prazo: '', cor: '#34d399', icone: '🎯', descricao: '' });
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.nome || !form.valorAlvo) return;
    onSubmit({
      id: initialData?.id,
      nome: form.nome, valorAlvo: parseFloat(form.valorAlvo),
      prazo: form.prazo || undefined, cor: form.cor, icone: form.icone,
      descricao: form.descricao || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-surface border border-white/[0.07] rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold">{initialData ? 'Editar Meta' : 'Nova Meta'}</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <input className="input-dark w-full" placeholder="Nome da meta" value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} autoFocus />
          <textarea className="input-dark w-full" rows={2} placeholder="Descrição (opcional)"
            value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          <div className="flex gap-3">
            <input className="input-dark flex-1" type="number" step="0.01" placeholder="Valor alvo (R$)"
              value={form.valorAlvo} onChange={e => setForm(f => ({ ...f, valorAlvo: e.target.value }))} />
            <input className="input-dark flex-1" type="date" placeholder="Prazo (opcional)"
              value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
          </div>
          <div>
            <p className="text-xs text-muted mb-2">Ícone</p>
            <div className="flex flex-wrap gap-1.5">
              {emojis.map(e => (
                <button key={e} className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${form.icone === e ? 'bg-white/10 ring-1 ring-white/20 scale-110' : 'hover:bg-white/5'}`}
                  onClick={() => setForm(f => ({ ...f, icone: e }))}>{e}</button>
              ))}
            </div>
          </div>
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
          <button onClick={handleSubmit} className="btn-primary">{initialData ? 'Salvar' : 'Criar Meta'}</button>
        </div>
      </div>
    </div>
  );
}
