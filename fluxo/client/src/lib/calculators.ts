import type { Transacao, Categoria } from '@/types';

const NECESSIDADES: Categoria[] = ['moradia', 'alimentacao', 'transporte', 'saude'];
const DESEJOS: Categoria[] = ['lazer', 'assinaturas', 'vestuario', 'viagem', 'educacao'];

export function calcularRegra503020(transacoes: Transacao[], totalEntradas: number) {
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
    necessidades: { gasto: gastoNecessidades, ideal: totalEntradas * 0.5 },
    desejos: { gasto: gastoDesejos, ideal: totalEntradas * 0.3 },
    poupanca: { gasto: poupanca, ideal: totalEntradas * 0.2 },
  };
}

export function calcularTaxaPoupanca(totalEntradas: number, totalSaidas: number): number {
  if (totalEntradas <= 0) return 0;
  return Math.max(0, ((totalEntradas - totalSaidas) / totalEntradas) * 100);
}
