import { Router, Request, Response } from 'express';
import { readFile } from '../services/storage.js';
import {
  calcularScore, calcularTaxaPoupanca, calcularSaldoDiario,
  calcularSaldoAtualConta, calcularTotalFatura, calcularRegra503020,
  projetarFluxoFuturo, projetarSaldoDiarioProximos30Dias
} from '../services/calculators.js';
import { computeLimiteCartao } from './cartoes.js';
import type {
  Conta, Cartao, Transacao, Fatura, Config, DashboardData, Alerta, Categoria, RecorrenciaConfig
} from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const mes = Number(req.query.mes) || new Date().getMonth() + 1;
  const ano = Number(req.query.ano) || new Date().getFullYear();

  const contas = await readFile<Conta[]>(userId, 'contas.json', []);
  const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
  const todasTransacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const config = await readFile<Config>(userId, 'config.json', { nomeUsuario: 'Usuário', moeda: 'BRL', limiteDiarioPadrao: 150, limiteDinamico: false, tema: 'escuro' as any, reservaInvestimento: 0, radarPeriodo: 6, taxaJurosCartoesGlobal: 15 });

  const parseDate = (dateStr: string) => {
    if (!dateStr) return { m: 0, a: 0 };
    const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    if (parts.length < 2) return { m: 0, a: 0 };
    // Handle YYYY-MM-DD or DD/MM/YYYY
    if (parts[0].length === 4) return { a: Number(parts[0]), m: Number(parts[1]) };
    return { a: Number(parts[2]), m: Number(parts[1]) };
  };

  const transacoesMes = todasTransacoes.filter(t => {
    const { m, a } = parseDate(t.data);
    return m === mes && a === ano;
  });

  // Calculate real transactions
  const totalEntradasReal = transacoesMes
    .filter(t => t.tipo === 'entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalSaidasReal = transacoesMes
    .filter(t => t.tipo === 'debito' || t.tipo === 'credito_cartao')
    .reduce((acc, t) => acc + t.valor, 0);

  // Add pending recurrences (those not yet materialized as transactions this month)
  const recorrencias = await readFile<RecorrenciaConfig[]>(userId, 'recorrencias.json', []);
  const pendingRecs = recorrencias.filter(r => {
    if (!r.ativa) return false;
    const exists = todasTransacoes.some(t => {
      const { m, a } = parseDate(t.data);
      return t.recorrenciaId === r.id && m === mes && a === ano;
    });
    return !exists;
  });

  const totalEntradasPendentes = pendingRecs
    .filter(r => r.tipo === 'entrada')
    .reduce((acc, r) => acc + r.valor, 0);

  const totalSaidasPendentes = pendingRecs
    .filter(r => r.tipo === 'debito' || r.tipo === 'credito_cartao')
    .reduce((acc, r) => acc + r.valor, 0);

  const totalEntradas = totalEntradasReal + totalEntradasPendentes;
  const totalSaidas = totalSaidasReal; // Mantemos apenas saídas reais de conta para não duplicar com faturas futuras

  // Account balances
  const contasSaldo = contas.filter(c => c.ativa).map(conta => ({
    conta,
    saldoAtual: calcularSaldoAtualConta(conta.saldoInicial, conta.id, todasTransacoes, faturas),
  }));

  const saldoTotal = contasSaldo.reduce((acc, cs) => acc + cs.saldoAtual, 0);

  // Faturas do mês
  const faturasMes = faturas.filter(f => f.mes === mes && f.ano === ano);
  const totalFaturasMes = faturasMes.reduce((acc, f) =>
    acc + calcularTotalFatura(f.id, todasTransacoes, f), 0);

  // Taxa de poupança
  const taxaPoupanca = calcularTaxaPoupanca(totalEntradas, totalSaidas);

  // Saldo diário (todas as contas somadas)
  const saldoDiarioContas = contas.filter(c => c.ativa).map(conta =>
    calcularSaldoDiario(conta.saldoInicial, conta.id, todasTransacoes, faturas, mes, ano)
  );
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const saldoDiario = Array.from({ length: diasNoMes }, (_, i) => ({
    dia: i + 1,
    saldo: saldoDiarioContas.reduce((acc, arr) => acc + (arr[i]?.saldo ?? 0), 0),
  }));

  // Score
  const diasComSaldoNeg = saldoDiario.filter(d => d.saldo < 0).length;
  const gastoDiario = transacoesMes
    .filter(t => t.tipo === 'debito' || t.tipo === 'credito_cartao')
    .reduce((acc, t) => {
      const dia = new Date(t.data).getDate();
      if (!acc[dia]) acc[dia] = 0;
      acc[dia] += t.valor;
      return acc;
    }, {} as Record<number, number>);
  const diasAcimaLimite = Object.values(gastoDiario)
    .filter(v => v > config.limiteDiarioPadrao).length;
  const saldoFinal = saldoDiario[saldoDiario.length - 1]?.saldo ?? 0;
  const { score, label: scoreLabel } = calcularScore(
    totalEntradas, totalSaidas, diasComSaldoNeg, diasAcimaLimite, saldoFinal, taxaPoupanca
  );

  // Gastos por categoria
  const catMap: Record<string, number> = {};
  transacoesMes
    .filter(t => t.tipo !== 'entrada' && t.tipo !== 'transferencia')
    .forEach(t => {
      catMap[t.categoria] = (catMap[t.categoria] || 0) + t.valor;
    });
  const gastosPorCategoria = Object.entries(catMap)
    .map(([categoria, total]) => ({ categoria: categoria as Categoria, total }))
    .sort((a, b) => b.total - a.total);

  // Próximas saídas (next 10 days)
  const hojeStr = new Date().toISOString().split('T')[0];
  const daqui10 = new Date();
  daqui10.setDate(daqui10.getDate() + 10);
  const daqui10Str = daqui10.toISOString().split('T')[0];
  const proximasSaidas = todasTransacoes
    .filter(t => t.data >= hojeStr && t.data <= daqui10Str &&
      (t.tipo === 'debito' || t.tipo === 'credito_cartao'))
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 10);

  // 50/30/20 Rule
  const regra503020 = calcularRegra503020(transacoesMes, totalEntradas);

  // Patrimônio Histórico (radarPeriodo meses)
  const patrimonioHistorico: Array<{ data: string; saldo: number }> = [];
  const period = config.radarPeriodo || 6;

  for (let i = period - 1; i >= 0; i--) {
    const d = new Date(ano, mes - 1 - i, 1);
    const m = d.getMonth() + 1;
    const a = d.getFullYear();
    const saldoNoMes = contas.filter(c => c.ativa).reduce((acc, conta) => {
      // Simplificação para o histórico: saldo no fim daquele mês
      return acc + calcularSaldoAtualConta(conta.saldoInicial, conta.id, todasTransacoes.filter(t => {
        const td = new Date(t.data);
        return td.getFullYear() < a || (td.getFullYear() === a && td.getMonth() + 1 <= m);
      }), faturas.filter(f => {
        if (!f.dataPagamento) return false;
        const fd = new Date(f.dataPagamento);
        return fd.getFullYear() < a || (fd.getFullYear() === a && fd.getMonth() + 1 <= m);
      }));
    }, 0);
    patrimonioHistorico.push({
      data: `${a}-${String(m).padStart(2, '0')}`,
      saldo: Math.round(saldoNoMes * 100) / 100
    });
  }

  // Projeção Radar (radarPeriodo meses)
  const projecaoRadar = projetarFluxoFuturo(period, saldoTotal, todasTransacoes, recorrencias, mes, ano);

  // Limite Diário Dinâmico com Reserva de Investimento e Detalhes
  let limiteDiarioDinamico = config.limiteDiarioPadrao;
  let detalhesLimiteDiario = undefined;
  const reserva = config.reservaInvestimento || 0;

  const hojeDia = new Date().getDate();
  const diasRestantes = diasNoMes - hojeDia + 1;

  if (config.limiteDinamico) {
    if (diasRestantes > 0) {
      const gastosFixosRestantes = todasTransacoes.filter(t => {
        const td = new Date(t.data);
        return td.getMonth() + 1 === mes && td.getFullYear() === ano && td.getDate() > hojeDia && t.recorrente;
      }).reduce((acc, t) => acc + t.valor, 0);

      const saldoLivreRestante = saldoTotal - reserva - gastosFixosRestantes;
      limiteDiarioDinamico = Math.max(0, saldoLivreRestante / diasRestantes);
      detalhesLimiteDiario = {
        diasRestantes,
        valorPorDia: Math.round(limiteDiarioDinamico * 100) / 100,
        saldoLivreRestante: Math.round(saldoLivreRestante * 100) / 100
      };
    }
  }

  // Projeção Diária 30 dias (Granularidade Micro)
  const projecaoDiaria30Dias = projetarSaldoDiarioProximos30Dias(saldoTotal, todasTransacoes, recorrencias);

  // Alertas inteligentes baseados na projeção
  const alertas: Alerta[] = [];
  if (projecaoRadar.some(p => p.saldoProjetado < 0)) {
    const primeiroMesNeg = projecaoRadar.find(p => p.saldoProjetado < 0);
    alertas.push({
      tipo: 'danger',
      mensagem: `Atenção: Projeção de saldo negativo para ${primeiroMesNeg?.mes}/${primeiroMesNeg?.ano}!`,
      acao: '/radar'
    });
  }
  const data: DashboardData = {
    saldoTotal: Math.round(saldoTotal * 100) / 100,
    totalEntradas: Math.round(totalEntradas * 100) / 100,
    totalSaidas: Math.round(totalSaidas * 100) / 100,
    totalFaturasMes: Math.round(totalFaturasMes * 100) / 100,
    score, scoreLabel, taxaPoupanca: Math.round(taxaPoupanca * 10) / 10,
    alertas, saldoDiario, gastosPorCategoria, proximasSaidas,
    contasSaldo, faturasAbertas: faturasMes
      .filter(f => f.status !== 'paga')
      .map(f => {
        const cartao = cartoes.find(c => c.id === f.cartaoId);
        if (!cartao) return null;
        const total = calcularTotalFatura(f.id, todasTransacoes, f);
        const diasParaVencer = Math.ceil(
          (new Date(f.dataVencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        const limiteInfo = computeLimiteCartao(cartao, faturas, todasTransacoes);
        return {
          cartao, fatura: f, total, diasParaVencer,
          limiteUsadoTotal: limiteInfo.limiteUsadoTotal,
          limiteDisponivelReal: limiteInfo.limiteDisponivelReal,
          limiteDisponivelProjetado: limiteInfo.limiteDisponivelProjetado,
        };
      })
      .filter(Boolean) as DashboardData['faturasAbertas'],
    patrimonioHistorico,
    regra503020,
    limiteDiarioDinamico: Math.round(limiteDiarioDinamico * 100) / 100,
    detalhesLimiteDiario,
    projecaoRadar,
    projecaoDiaria30Dias,
  };

  res.json(data);
});

export default router;
