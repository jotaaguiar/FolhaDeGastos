import type { Categoria, Transacao, Fatura, RecorrenciaConfig, Meta } from '../types/index.js';

const NECESSIDADES: Categoria[] = ['moradia', 'alimentacao', 'transporte', 'saude'];
const DESEJOS: Categoria[] = ['lazer', 'assinaturas', 'vestuario', 'viagem', 'educacao'];

export function calcularScore(
  totalEntradas: number,
  totalSaidas: number,
  diasComSaldoNegativo: number,
  diasAcimaLimite: number,
  saldoFinal: number,
  taxaPoupanca: number
): { score: number; label: string } {
  let score = 100;

  if (totalEntradas > 0) {
    const ratio = totalSaidas / totalEntradas;
    if (ratio > 1) score -= 40;
    else if (ratio > 0.9) score -= 25;
    else if (ratio > 0.7) score -= 10;
  }

  score -= diasComSaldoNegativo * 3;
  score -= diasAcimaLimite * 2;
  if (saldoFinal < 0) score -= 20;
  if (taxaPoupanca > 20) score += 10;

  score = Math.max(0, Math.min(100, score));

  const label =
    score >= 85 ? 'Excelente' :
    score >= 70 ? 'Bom' :
    score >= 50 ? 'Regular' : 'Atenção';

  return { score: Math.round(score), label };
}

export function calcularTaxaPoupanca(totalEntradas: number, totalSaidas: number): number {
  if (totalEntradas <= 0) return 0;
  return Math.max(0, ((totalEntradas - totalSaidas) / totalEntradas) * 100);
}

export function calcularRegra503020(transacoes: Transacao[], totalEntradas: number) {
  const gastoNecessidades = transacoes
    .filter(t => NECESSIDADES.includes(t.categoria) && t.tipo !== 'entrada' && t.tipo !== 'transferencia')
    .reduce((acc, t) => acc + t.valor, 0);

  const gastoDesejos = transacoes
    .filter(t => DESEJOS.includes(t.categoria) && t.tipo !== 'entrada' && t.tipo !== 'transferencia')
    .reduce((acc, t) => acc + t.valor, 0);

  const poupanca = Math.max(0, totalEntradas - gastoNecessidades - gastoDesejos);

  return {
    necessidades: { gasto: gastoNecessidades, ideal: totalEntradas * 0.5 },
    desejos: { gasto: gastoDesejos, ideal: totalEntradas * 0.3 },
    poupanca: { gasto: poupanca, ideal: totalEntradas * 0.2 },
  };
}

export function calcularReservaEmergencia(
  transacoesTresMeses: Transacao[],
  metaReserva: Meta | undefined
): { ideal: number; cobertura: number; atual: number } {
  const totalGastos = transacoesTresMeses
    .filter(t => t.tipo !== 'entrada' && t.tipo !== 'transferencia')
    .reduce((acc, t) => acc + t.valor, 0);
  const mediaGastosMes = totalGastos / 3;
  const ideal = mediaGastosMes * 6;
  const atual = metaReserva?.valorAtual ?? 0;
  return { ideal, atual, cobertura: ideal > 0 ? (atual / ideal) * 100 : 0 };
}

export function calcularSaldoAtualConta(
  saldoInicial: number,
  contaId: string,
  transacoes: Transacao[],
  faturas: Fatura[]
): number {
  let saldo = saldoInicial;

  for (const t of transacoes) {
    if (t.tipo === 'entrada' && t.contaId === contaId) {
      saldo += t.valor;
    } else if (t.tipo === 'debito' && t.contaId === contaId) {
      saldo -= t.valor;
    } else if (t.tipo === 'transferencia') {
      if (t.contaId === contaId) saldo -= t.valor;
      if (t.contaDestinoId === contaId) saldo += t.valor;
    }
  }

  // Subtract paid invoices — use valorPago if set (supports partial), else calculate total
  const faturasPagas = faturas.filter(f => (f.status === 'paga' || f.status === 'parcial') && f.contaPagamentoId === contaId);
  for (const f of faturasPagas) {
    if (f.valorPago !== undefined) {
      saldo -= f.valorPago;
    } else {
      // Legacy: calculate from transactions
      const totalFatura = transacoes
        .filter(t => t.faturaId === f.id && t.tipo === 'credito_cartao')
        .reduce((acc, t) => acc + t.valor, 0);
      saldo -= totalFatura;
    }
  }

  return saldo;
}

export function projetarFluxoFuturo(
  meses: number,
  saldoInicial: number,
  transacoes: Transacao[],
  recorrencias: RecorrenciaConfig[],
  mesBase: number,
  anoBase: number
): Array<{ 
  mes: number; 
  ano: number; 
  saldoProjetado: number; 
  entradas: number; 
  saidas: number; 
  poupanca: number;
  breakdown: {
    parcelas: number;
    recorrencias: number;
    fixas: number;
    estimativas: number;
  }
}> {
  const projecao: any[] = [];
  let saldoAcumulado = saldoInicial;

  for (let i = 0; i < meses; i++) {
    const d = new Date(anoBase, mesBase - 1 + i, 1);
    const m = d.getMonth() + 1;
    const a = d.getFullYear();

    // 1. Entradas recorrentes e fixas (alta confiança)
    const entradasFixas = recorrencias
      .filter(r => r.ativa && r.tipo === 'entrada')
      .reduce((acc, r) => acc + r.valor, 0);
    
    // 2. Recorrências de saída (alta confiança)
    const saidasRecorrentes = recorrencias
      .filter(r => r.ativa && (r.tipo === 'debito' || r.tipo === 'credito_cartao'))
      .reduce((acc, r) => acc + r.valor, 0);

    // 3. Parcelamentos ativos neste mês (certeza absoluta)
    let parcelasMes = 0;
    const gruposVistos = new Set<string>();
    transacoes.filter(t => t.parcelamento).forEach(t => {
      const gId = t.parcelamento!.grupoId;
      if (gruposVistos.has(gId)) return;
      gruposVistos.add(gId);
      
      const dataBase = new Date(t.data);
      const mBase = dataBase.getMonth() + 1;
      const aBase = dataBase.getFullYear();
      const diff = (a - aBase) * 12 + (m - mBase);
      const nParcela = 1 + diff;
      
      if (nParcela >= 1 && nParcela <= t.parcelamento!.total) {
        parcelasMes += t.valor;
      }
    });

    // 4. Estimativas baseadas em médias históricas (opcional - implementamos como 0 por enquanto para ser honesto)
    const estimativas = 0; 

    const totalSaidas = saidasRecorrentes + parcelasMes + estimativas;
    const poupanca = Math.max(0, entradasFixas - totalSaidas);
    saldoAcumulado += (entradasFixas - totalSaidas);

    projecao.push({
      mes: m,
      ano: a,
      saldoProjetado: Math.round(saldoAcumulado * 100) / 100,
      entradas: Math.round(entradasFixas * 100) / 100,
      saidas: Math.round(totalSaidas * 100) / 100,
      poupanca: Math.round(poupanca * 100) / 100,
      breakdown: {
        parcelas: Math.round(parcelasMes * 100) / 100,
        recorrencias: Math.round(saidasRecorrentes * 100) / 100,
        fixas: Math.round(entradasFixas * 100) / 100,
        estimativas: Math.round(estimativas * 100) / 100
      }
    });
  }

  return projecao;
}

/**
 * Projetar saldo dia a dia para os próximos 30 dias (granularidade micro)
 */
export function projetarSaldoDiarioProximos30Dias(
  saldoInicial: number,
  transacoes: Transacao[],
  recorrencias: RecorrenciaConfig[]
): Array<{ data: string; saldo: number; tipo: 'real' | 'projetado' }> {
  const resultado: any[] = [];
  let saldoCorrente = saldoInicial;
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  for (let i = 0; i < 30; i++) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() + i);
    const dataStr = data.toISOString().split('T')[0];
    const dia = data.getDate();
    const mes = data.getMonth() + 1;
    const ano = data.getFullYear();

    // 1. Recorrências que caem hoje
    const totalRecorrencias = recorrencias
      .filter(r => r.ativa && r.diaCobranca === dia)
      .reduce((acc, r) => {
        if (r.tipo === 'entrada') return acc + r.valor;
        return acc - r.valor;
      }, 0);

    // 2. Parcelas que vencem hoje (aproximado pela data do primeiro lançamento + i meses)
    let totalParcelas = 0;
    const gruposVistos = new Set<string>();
    transacoes.filter(t => t.parcelamento).forEach(t => {
      const gId = t.parcelamento!.grupoId;
      if (gruposVistos.has(gId)) return;
      gruposVistos.add(gId);
      
      const dBase = new Date(t.data);
      if (dBase.getDate() === dia) {
        const diffMeses = (ano - dBase.getFullYear()) * 12 + (mes - dBase.getMonth() - 1);
        const nParcela = 1 + diffMeses;
        if (nParcela >= 1 && nParcela <= t.parcelamento!.total) {
          totalParcelas += t.valor;
        }
      }
    });

    saldoCorrente += (totalRecorrencias - totalParcelas);
    resultado.push({
      data: dataStr,
      saldo: Math.round(saldoCorrente * 100) / 100,
      tipo: 'projetado'
    });
  }

  return resultado;
}

export function calcularLimiteDisponivelReal(
  cartao: Cartao,
  transacoes: Transacao[],
  faturas: Fatura[]
): number {
  // Limite total menos tudo que foi gasto e não foi "liberado" pelo pagamento da fatura
  const faturasNaoPagas = faturas.filter(f => f.cartaoId === cartao.id && f.status !== 'paga');
  const faturasNaoPagasIds = faturasNaoPagas.map(f => f.id);

  const totalGastoFaturas = transacoes
    .filter(t => t.cartaoId === cartao.id && t.tipo === 'credito_cartao' && t.faturaId && faturasNaoPagasIds.includes(t.faturaId))
    .reduce((acc, t) => acc + t.valor, 0);

  // Também subtrair compras parceladas que ainda não foram para faturas (se houver)
  const parcelasFuturas = transacoes
    .filter(t => t.cartaoId === cartao.id && t.tipo === 'credito_cartao' && !t.faturaId)
    .reduce((acc, t) => acc + t.valor, 0);

  return Math.max(0, cartao.limite - totalGastoFaturas - parcelasFuturas);
}

export function calcularSaldoDiario(
  saldoInicial: number,
  contaId: string,
  transacoes: Transacao[],
  faturasPagas: Fatura[],
  mes: number,
  ano: number
): Array<{ dia: number; saldo: number }> {
  const dias = new Date(ano, mes, 0).getDate();
  let saldo = saldoInicial;
  const resultado: Array<{ dia: number; saldo: number }> = [];

  // Apply all transactions before this month
  for (const t of transacoes) {
    const td = new Date(t.data);
    if (td.getFullYear() < ano || (td.getFullYear() === ano && td.getMonth() + 1 < mes)) {
      if (t.tipo === 'entrada' && t.contaId === contaId) saldo += t.valor;
      else if (t.tipo === 'debito' && t.contaId === contaId) saldo -= t.valor;
      else if (t.tipo === 'transferencia') {
        if (t.contaId === contaId) saldo -= t.valor;
        if (t.contaDestinoId === contaId) saldo += t.valor;
      }
    }
  }

  // Apply paid invoices before this month
  for (const f of faturasPagas) {
    if (f.contaPagamentoId === contaId && f.status === 'paga' && f.dataPagamento) {
      const fd = new Date(f.dataPagamento);
      if (fd.getFullYear() < ano || (fd.getFullYear() === ano && fd.getMonth() + 1 < mes)) {
        const totalFatura = transacoes
          .filter(t => t.faturaId === f.id && t.tipo === 'credito_cartao')
          .reduce((acc, t) => acc + t.valor, 0);
        saldo -= totalFatura;
      }
    }
  }

  for (let dia = 1; dia <= dias; dia++) {
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    transacoes
      .filter(t => t.data === dataStr && t.tipo === 'entrada' && t.contaId === contaId)
      .forEach(t => { saldo += t.valor; });

    transacoes
      .filter(t => t.data === dataStr && t.tipo === 'debito' && t.contaId === contaId)
      .forEach(t => { saldo -= t.valor; });

    transacoes
      .filter(t => t.data === dataStr && t.tipo === 'transferencia' && t.contaId === contaId)
      .forEach(t => { saldo -= t.valor; });

    transacoes
      .filter(t => t.data === dataStr && t.tipo === 'transferencia' && t.contaDestinoId === contaId)
      .forEach(t => { saldo += t.valor; });

    faturasPagas
      .filter(f => f.dataPagamento === dataStr && f.contaPagamentoId === contaId)
      .forEach(f => {
        const totalFatura = transacoes
          .filter(t => t.faturaId === f.id && t.tipo === 'credito_cartao')
          .reduce((acc, t) => acc + t.valor, 0);
        saldo -= totalFatura;
      });

    resultado.push({ dia, saldo: Math.round(saldo * 100) / 100 });
  }
  return resultado;
}

export function projetarFatura(
  cartaoId: string,
  mes: number,
  ano: number,
  transacoes: Transacao[],
  recorrencias: RecorrenciaConfig[]
): number {
  // Sum installment charges for this month
  let total = 0;

  // Find transactions that are installments on this card
  const parceladas = transacoes.filter(
    t => t.cartaoId === cartaoId && t.tipo === 'credito_cartao' && t.parcelamento
  );

  // Group by grupoId to avoid double-counting
  const gruposVistos = new Set<string>();
  for (const t of parceladas) {
    if (!t.parcelamento) continue;
    const grupoId = t.parcelamento.grupoId;
    if (gruposVistos.has(grupoId)) continue;
    gruposVistos.add(grupoId);

    // Find the first transaction in the group to get base date
    const primeiraTransacao = parceladas.find(
      p => p.parcelamento?.grupoId === grupoId && p.parcelamento?.atual === 1
    ) || t;

    const dataBase = new Date(primeiraTransacao.data);
    const mesBase = dataBase.getMonth() + 1;
    const anoBase = dataBase.getFullYear();
    const mesesDecorridos = (ano - anoBase) * 12 + (mes - mesBase);
    const parcelaNestesMes = 1 + mesesDecorridos;

    if (parcelaNestesMes >= 1 && parcelaNestesMes <= t.parcelamento.total) {
      total += t.valor;
    }
  }

  // Add non-installment charges for this specific month
  const avista = transacoes.filter(
    t => t.cartaoId === cartaoId &&
      t.tipo === 'credito_cartao' &&
      !t.parcelamento &&
      !t.recorrente
  );
  for (const t of avista) {
    const td = new Date(t.data);
    if (td.getMonth() + 1 === mes && td.getFullYear() === ano) {
      total += t.valor;
    }
  }

  // Add recurring charges
  const recorrentesAtivas = recorrencias.filter(
    r => r.cartaoId === cartaoId && r.ativa && r.tipo === 'credito_cartao'
  ).filter(r => {
    if (r.fimEm) {
      return new Date(r.fimEm) >= new Date(ano, mes - 1, 1);
    }
    return true;
  });

  total += recorrentesAtivas.reduce((acc, r) => acc + r.valor, 0);

  return Math.round(total * 100) / 100;
}

export function calcularTotalFatura(
  faturaId: string,
  transacoes: Transacao[],
  fatura?: Fatura
): number {
  const totalTransacoes = transacoes
    .filter(t => t.faturaId === faturaId && t.tipo === 'credito_cartao')
    .reduce((acc, t) => acc + t.valor, 0);
  
  // Include rollover from previous invoice
  const rollover = fatura?.saldoAnteriorRollover ?? 0;
  
  return Math.round((totalTransacoes + rollover) * 100) / 100;
}

/**
 * Determines which invoice (mes/ano) a credit card purchase should go to,
 * based on the card's closing date (diaFechamento).
 * 
 * Rules:
 * - If purchase day <= diaFechamento → goes to CURRENT month's invoice
 * - If purchase day > diaFechamento → goes to NEXT month's invoice
 */
export function determinarFaturaDestino(
  dataCompra: string,
  diaFechamento: number
): { mes: number; ano: number } {
  const data = new Date(dataCompra + 'T12:00:00'); // avoid timezone issues
  const diaCompra = data.getDate();
  const mesCompra = data.getMonth() + 1;
  const anoCompra = data.getFullYear();

  if (diaCompra <= diaFechamento) {
    // Same month invoice
    return { mes: mesCompra, ano: anoCompra };
  } else {
    // Next month invoice
    const proximoMes = mesCompra === 12 ? 1 : mesCompra + 1;
    const proximoAno = mesCompra === 12 ? anoCompra + 1 : anoCompra;
    return { mes: proximoMes, ano: proximoAno };
  }
}

/**
 * Checks if a fatura is overdue (past due date and not paid).
 */
export function isFaturaVencida(fatura: Fatura): boolean {
  if (fatura.status === 'paga') return false;
  const hoje = new Date();
  const vencimento = new Date(fatura.dataVencimento + 'T23:59:59');
  return hoje > vencimento;
}
