import { useEffect, useState } from 'react';
import type { Transacao, Categoria } from '@/types';
import { api } from '@/lib/api';

export interface SugestaoFrequente {
  descricao: string;
  valor: number;
  categoria: Categoria;
  tipo: Transacao['tipo'];
  count: number;
}

/**
 * Calcula as transações mais frequentes do usuário nos últimos 90 dias.
 * Agrupa por descrição normalizada (lowercase + trim) e retorna as top N
 * que apareceram pelo menos 2 vezes. Para cada grupo, usa a mediana do valor.
 */
export function useTransacoesFrequentes(enabled: boolean, topN: number = 5) {
  const [sugestoes, setSugestoes] = useState<SugestaoFrequente[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);

    api.getTransacoes({})
      .then((todas: Transacao[]) => {
        if (cancelled) return;
        const hoje = new Date();
        const corte = new Date(hoje);
        corte.setDate(corte.getDate() - 90);
        const corteStr = corte.toISOString().split('T')[0];

        // Filtra últimos 90 dias e ignora transferências
        const recentes = todas.filter(t =>
          t.data >= corteStr &&
          t.tipo !== 'transferencia' &&
          t.descricao &&
          t.descricao.trim().length > 1
        );

        // Agrupa por chave normalizada
        const grupos = new Map<string, Transacao[]>();
        for (const t of recentes) {
          const chave = t.descricao.toLowerCase().trim().slice(0, 32);
          if (!grupos.has(chave)) grupos.set(chave, []);
          grupos.get(chave)!.push(t);
        }

        // Filtra grupos com >= 2 ocorrências e ordena por contagem
        const candidatos: SugestaoFrequente[] = [];
        for (const [, items] of grupos) {
          if (items.length < 2) continue;
          // Ordena valores e pega mediana
          const valores = [...items].map(i => i.valor).sort((a, b) => a - b);
          const valorMediano = valores[Math.floor(valores.length / 2)];
          // Categoria/tipo mais comum no grupo
          const tipo = mode(items.map(i => i.tipo));
          const categoria = mode(items.map(i => i.categoria));
          // Descrição: usa a mais recente (preserva capitalização)
          const maisRecente = items.reduce((a, b) => a.data > b.data ? a : b);
          candidatos.push({
            descricao: maisRecente.descricao,
            valor: Math.round(valorMediano * 100) / 100,
            categoria,
            tipo,
            count: items.length,
          });
        }

        candidatos.sort((a, b) => b.count - a.count);
        setSugestoes(candidatos.slice(0, topN));
      })
      .catch(() => setSugestoes([]))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [enabled, topN]);

  return { sugestoes, loading };
}

function mode<T>(arr: T[]): T {
  const counts = new Map<T, number>();
  for (const v of arr) counts.set(v, (counts.get(v) || 0) + 1);
  let best = arr[0];
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) { best = v; bestCount = c; }
  }
  return best;
}
