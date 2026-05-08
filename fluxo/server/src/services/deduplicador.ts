import type { Transacao } from '../types/index.js';
import type { ParsedTransaction } from './ofxParser.js';

export interface DeduplicacaoResult {
  nova: ParsedTransaction;
  duplicata: boolean;
  transacaoExistente?: Transacao;
}

export function deduplicar(
  parsed: ParsedTransaction[],
  existentes: Transacao[],
  contaId?: string,
  cartaoId?: string
): DeduplicacaoResult[] {
  return parsed.map(nova => {
    // Check for exact match: same date, same value, same description (fuzzy)
    const possivel = existentes.find(t => {
      const mesmaData = t.data === nova.data;
      const mesmoValor = Math.abs(t.valor - nova.valor) < 0.01;
      const mesmaDesc = normalize(t.descricao) === normalize(nova.descricao);

      // Scope to same account/card if provided
      const mesmoContexto = contaId
        ? t.contaId === contaId
        : cartaoId
        ? t.cartaoId === cartaoId
        : true;

      return mesmaData && mesmoValor && mesmaDesc && mesmoContexto;
    });

    return {
      nova,
      duplicata: !!possivel,
      transacaoExistente: possivel,
    };
  });
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}
