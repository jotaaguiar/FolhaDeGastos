import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useAlert } from '@/context/AlertContext';
import type { Conta, Cartao } from '@/types';

interface QuickAddProps {
  contas: Conta[];
  cartoes: Cartao[];
  onAdded: () => void;
}

export default function QuickAdd({ contas, cartoes, onAdded }: QuickAddProps) {
  const { addToast } = useAlert();
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<'debito' | 'entrada' | 'credito_cartao'>('debito');
  const [contaId, setContaId] = useState(contas[0]?.id || '');
  const [cartaoId, setCartaoId] = useState(cartoes[0]?.id || '');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!descricao.trim() || !valor) return;
    setLoading(true);
    try {
      await api.createTransacao({
        descricao: descricao.trim(),
        valor: parseFloat(valor),
        tipo,
        data: new Date().toISOString().split('T')[0],
        categoria: tipo === 'entrada' ? 'entrada_outros' : 'outros',
        contaId: tipo !== 'credito_cartao' ? contaId : undefined,
        cartaoId: tipo === 'credito_cartao' ? cartaoId : undefined,
        recorrente: false,
      });
      setDescricao('');
      setValor('');
      addToast('success', 'Transação adicionada!');
      onAdded();
    } catch {
      addToast('error', 'Erro ao adicionar transação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <p className="label-mono mb-3">Lançamento Rápido</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="input-dark flex-1"
          placeholder="Descrição do lançamento"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <div className="flex gap-2">
          <input
            className="input-dark w-28 shrink-0"
            placeholder="Valor"
            type="number"
            step="0.01"
            value={valor}
            onChange={e => setValor(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
          <select className="input-dark flex-1 sm:w-28" value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)}>
            <option value="debito">Débito</option>
            <option value="entrada">Entrada</option>
            <option value="credito_cartao">Crédito</option>
          </select>
          {tipo !== 'credito_cartao' ? (
            <select className="input-dark flex-1 sm:w-32" value={contaId} onChange={e => setContaId(e.target.value)}>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          ) : (
            <select className="input-dark flex-1 sm:w-32" value={cartaoId} onChange={e => setCartaoId(e.target.value)}>
              {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          )}
          <button onClick={submit} disabled={loading} className="btn-primary flex items-center gap-1.5 shrink-0">
            <Plus size={16} /><span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
