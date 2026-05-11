import type { Transacao, Categoria } from '@/types';

const NECESSIDADES: Categoria[] = ['moradia', 'alimentacao', 'transporte', 'saude'];
const DESEJOS: Categoria[] = ['lazer', 'assinaturas', 'vestuario', 'viagem', 'educacao'];

export function calcularRegra503020(
  transacoes: Transacao[],
  totalEntradas: number,
  pctNecessidades = 50,
  pctDesejos = 30,
  pctPoupanca = 20,
) {
  const saidas = transacoes.filter(t => t.tipo !== 'entrada' && t.tipo !== 'transferencia');

  const gastoNecessidades = saidas
    .filter(t => NECESSIDADES.includes(t.categoria))
    .reduce((acc, t) => acc + t.valor, 0);
  const gastoDesejos = saidas
    .filter(t => DESEJOS.includes(t.categoria))
    .reduce((acc, t) => acc + t.valor, 0);
  const gastoOutros = saidas
    .filter(t => !NECESSIDADES.includes(t.categoria) && !DESEJOS.includes(t.categoria))
    .reduce((acc, t) => acc + t.valor, 0);

  const poupanca = Math.max(0, totalEntradas - gastoNecessidades - gastoDesejos - gastoOutros);
  return {
    necessidades: { gasto: gastoNecessidades, ideal: totalEntradas * (pctNecessidades / 100) },
    desejos: { gasto: gastoDesejos, ideal: totalEntradas * (pctDesejos / 100) },
    poupanca: { gasto: poupanca, ideal: totalEntradas * (pctPoupanca / 100) },
  };
}

export function calcularTaxaPoupanca(totalEntradas: number, totalSaidas: number): number {
  if (totalEntradas <= 0) return 0;
  return Math.max(0, ((totalEntradas - totalSaidas) / totalEntradas) * 100);
}
