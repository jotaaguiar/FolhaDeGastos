import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { CategoriaCustom } from '@/types';

export const CATEGORIAS_BUILTIN: { value: string; label: string; cor: string; icone: string }[] = [
  { value: 'moradia', label: 'Moradia', cor: '#3b82f6', icone: '🏠' },
  { value: 'alimentacao', label: 'Alimentação', cor: '#f97316', icone: '🍽️' },
  { value: 'transporte', label: 'Transporte', cor: '#8b5cf6', icone: '🚗' },
  { value: 'saude', label: 'Saúde', cor: '#ef4444', icone: '💊' },
  { value: 'educacao', label: 'Educação', cor: '#06b6d4', icone: '📚' },
  { value: 'lazer', label: 'Lazer', cor: '#ec4899', icone: '🎮' },
  { value: 'assinaturas', label: 'Assinaturas', cor: '#6366f1', icone: '📱' },
  { value: 'vestuario', label: 'Vestuário', cor: '#84cc16', icone: '👕' },
  { value: 'viagem', label: 'Viagem', cor: '#14b8a6', icone: '✈️' },
  { value: 'investimento', label: 'Investimento', cor: '#22c55e', icone: '📈' },
  { value: 'outros', label: 'Outros', cor: '#6b7280', icone: '📦' },
  { value: 'entrada_salario', label: 'Salário', cor: '#22c55e', icone: '💼' },
  { value: 'entrada_freelance', label: 'Freelance', cor: '#10b981', icone: '💻' },
  { value: 'entrada_outros', label: 'Outras Entradas', cor: '#34d399', icone: '💰' },
  { value: 'transferencia', label: 'Transferência', cor: '#60a5fa', icone: '↔️' },
];

export function useCategorias() {
  const [custom, setCustom] = useState<CategoriaCustom[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.getCategorias();
      setCustom(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const all = [
    ...CATEGORIAS_BUILTIN,
    ...custom.map(c => ({ value: c.nome, label: c.label, cor: c.cor, icone: c.icone })),
  ];

  const getCategoriaInfo = (nome: string) =>
    all.find(c => c.value === nome) ?? { value: nome, label: nome, cor: '#6b7280', icone: '📦' };

  const create = async (data: { label: string; cor?: string; icone?: string }) => {
    const nova = await api.createCategoria(data);
    setCustom(prev => [...prev, nova]);
    return nova;
  };

  const update = async (id: string, data: Partial<CategoriaCustom>) => {
    const updated = await api.updateCategoria(id, data);
    setCustom(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  };

  const remove = async (id: string) => {
    await api.deleteCategoria(id);
    setCustom(prev => prev.filter(c => c.id !== id));
  };

  return { all, custom, loading, getCategoriaInfo, create, update, remove, reload: load };
}
