import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { readFile, writeFile } from '../services/storage.js';
import { calcularTotalFatura, determinarFaturaDestino, isFaturaVencida } from '../services/calculators.js';
import { computeLimiteCartao } from './cartoes.js';
import type { Fatura, Cartao, Transacao, Conta, Config } from '../types/index.js';

const router = Router();

function gerarFaturaId(cartaoId: string, mes: number, ano: number): string {
  return `fat-${cartaoId.slice(0, 8)}-${ano}-${String(mes).padStart(2, '0')}`;
}

async function ensureFatura(userId: string, cartaoId: string, mes: number, ano: number): Promise<Fatura> {
  const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
  const cartao = cartoes.find(c => c.id === cartaoId);

  let fatura = faturas.find(f => f.cartaoId === cartaoId && f.mes === mes && f.ano === ano);
  if (!fatura && cartao) {
    // Calculate vencimento date
    let vencMes = mes;
    let vencAno = ano;
    if (cartao.diaVencimento <= cartao.diaFechamento) {
      // Vencimento is in the next month relative to fechamento
      vencMes++;
      if (vencMes > 12) { vencMes = 1; vencAno++; }
    }

    fatura = {
      id: gerarFaturaId(cartaoId, mes, ano),
      cartaoId,
      mes,
      ano,
      dataVencimento: `${vencAno}-${String(vencMes).padStart(2, '0')}-${String(cartao.diaVencimento).padStart(2, '0')}`,
      dataFechamento: `${ano}-${String(mes).padStart(2, '0')}-${String(cartao.diaFechamento).padStart(2, '0')}`,
      status: 'aberta',
    };
    faturas.push(fatura);
    await writeFile(userId, 'faturas.json', faturas);
  }

  return fatura!;
}

// GET all faturas — optionally filtered
router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { cartaoId, mes, ano } = req.query;
  let faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);

  if (cartaoId && mes && ano) {
    await ensureFatura(userId, String(cartaoId), Number(mes), Number(ano));
    faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  }

  if (cartaoId) faturas = faturas.filter(f => f.cartaoId === String(cartaoId));
  if (mes) faturas = faturas.filter(f => f.mes === Number(mes));
  if (ano) faturas = faturas.filter(f => f.ano === Number(ano));

  // Auto-update overdue status
  let updated = false;
  for (let i = 0; i < faturas.length; i++) {
    if (isFaturaVencida(faturas[i]) && faturas[i].status === 'fechada') {
      faturas[i].status = 'vencida';
      updated = true;
    }
  }

  // Read full (unfiltered) list for card-wide limit computation
  let allFaturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  if (updated) {
    allFaturas = allFaturas.map(f => faturas.find(uf => uf.id === f.id) || f);
    await writeFile(userId, 'faturas.json', allFaturas);
  }

  // Pre-compute card-wide limit info from the full fatura list
  const limiteByCartao = new Map<string, ReturnType<typeof computeLimiteCartao>>();
  for (const cartao of cartoes) {
    limiteByCartao.set(cartao.id, computeLimiteCartao(cartao, allFaturas, transacoes));
  }

  const result = faturas.map(f => {
    const cartao = cartoes.find(c => c.id === f.cartaoId);
    const total = calcularTotalFatura(f.id, transacoes, f);
    const limiteInfo = cartao ? limiteByCartao.get(cartao.id) : undefined;

    return {
      ...f,
      total,
      cartao: cartao || null,
      limiteUsadoTotal: limiteInfo?.limiteUsadoTotal ?? 0,
      limiteDisponivelReal: limiteInfo?.limiteDisponivelReal ?? 0,
      limiteDisponivelProjetado: limiteInfo?.limiteDisponivelProjetado ?? 0,
    };
  });

  res.json(result);
});

// GET single fatura
router.get('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
  const fatura = faturas.find(f => f.id === req.params.id);
  if (!fatura) { res.status(404).json({ error: 'Fatura não encontrada' }); return; }

  const cartao = cartoes.find(c => c.id === fatura.cartaoId);
  const total = calcularTotalFatura(fatura.id, transacoes, fatura);
  const limiteInfo = cartao ? computeLimiteCartao(cartao, faturas, transacoes) : undefined;

  res.json({
    ...fatura,
    total,
    cartao: cartao || null,
    limiteUsadoTotal: limiteInfo?.limiteUsadoTotal ?? 0,
    limiteDisponivelReal: limiteInfo?.limiteDisponivelReal ?? 0,
    limiteDisponivelProjetado: limiteInfo?.limiteDisponivelProjetado ?? 0,
  });
});

// GET transactions of a fatura
router.get('/:id/transacoes', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const faturaTransacoes = transacoes
    .filter(t => t.faturaId === req.params.id)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  res.json(faturaTransacoes);
});

// PUT — manual edit of fatura fields
router.put('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const idx = faturas.findIndex(f => f.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Fatura não encontrada' }); return; }

  const allowed = ['dataVencimento', 'dataFechamento', 'status', 'saldoAnteriorRollover'];
  const updates: Partial<Fatura> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      (updates as any)[key] = req.body[key];
    }
  }

  faturas[idx] = { ...faturas[idx], ...updates };
  await writeFile(userId, 'faturas.json', faturas);
  res.json(faturas[idx]);
});

// POST /pagar — pay a fatura (full or partial)
router.post('/:id/pagar', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
  const contas = await readFile<Conta[]>(userId, 'contas.json', []);
  const config = await readFile<Config>(userId, 'config.json', { taxaJurosCartoesGlobal: 15 } as Config);

  const idx = faturas.findIndex(f => f.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Fatura não encontrada' }); return; }

  const fatura = faturas[idx];
  const cartao = cartoes.find(c => c.id === fatura.cartaoId);
  const { contaPagamentoId, dataPagamento, valorPago: valorPagoReq, taxaJuros: taxaReq } = req.body;

  if (!contaPagamentoId) {
    res.status(400).json({ error: 'Conta de pagamento é obrigatória' });
    return;
  }

  const conta = contas.find(c => c.id === contaPagamentoId);
  if (!conta) { res.status(400).json({ error: 'Conta não encontrada' }); return; }

  const totalFatura = calcularTotalFatura(fatura.id, transacoes, fatura);
  const valorPagoNovo = valorPagoReq !== undefined ? Number(valorPagoReq) : totalFatura;
  const dataPag = dataPagamento || new Date().toISOString().split('T')[0];

  const taxaJuros = taxaReq !== undefined
    ? Number(taxaReq)
    : (cartao?.taxaJurosRotativo ?? config.taxaJurosCartoesGlobal ?? 15);

  // Accumulate payments — allows multiple partial payments on the same fatura
  const valorPagoAnterior = fatura.status === 'parcial' ? (fatura.valorPago || 0) : 0;
  const valorPagoAcumulado = Math.min(totalFatura, Math.round((valorPagoAnterior + valorPagoNovo) * 100) / 100);
  const isParcial = valorPagoAcumulado < totalFatura - 0.01;

  // If this fatura was already parcial, reverse the previous rollover from next month
  // so we can recalculate it correctly with the new cumulative amount
  if (fatura.status === 'parcial' && cartao) {
    const oldRestante = totalFatura - valorPagoAnterior;
    const oldJuros = fatura.jurosAplicados || 0;
    const oldRollover = Math.round((oldRestante + oldJuros) * 100) / 100;

    let proximoMes = fatura.mes + 1;
    let proximoAno = fatura.ano;
    if (proximoMes > 12) { proximoMes = 1; proximoAno++; }
    const proximaFatId = gerarFaturaId(fatura.cartaoId, proximoMes, proximoAno);
    const proximaIdx = faturas.findIndex(f => f.id === proximaFatId);
    if (proximaIdx !== -1) {
      const existente = faturas[proximaIdx].saldoAnteriorRollover || 0;
      faturas[proximaIdx].saldoAnteriorRollover = Math.max(0, Math.round((existente - oldRollover) * 100) / 100);
    }
  }

  // 1. Update the fatura
  faturas[idx].dataPagamento = dataPag;
  faturas[idx].contaPagamentoId = contaPagamentoId;
  faturas[idx].valorPago = valorPagoAcumulado;
  faturas[idx].status = isParcial ? 'parcial' : 'paga';
  faturas[idx].taxaJurosAplicada = isParcial ? taxaJuros : undefined;
  if (!isParcial) {
    faturas[idx].jurosAplicados = undefined;
  }

  // 2. If still partial — create/update rollover in the NEXT month's fatura
  if (isParcial && cartao) {
    const restante = totalFatura - valorPagoAcumulado;
    const juros = Math.round(restante * (taxaJuros / 100) * 100) / 100;
    const rolloverTotal = Math.round((restante + juros) * 100) / 100;

    faturas[idx].jurosAplicados = juros;

    let proximoMes = fatura.mes + 1;
    let proximoAno = fatura.ano;
    if (proximoMes > 12) { proximoMes = 1; proximoAno++; }

    const proximaFaturaId = gerarFaturaId(fatura.cartaoId, proximoMes, proximoAno);
    let proximaFaturaIdx = faturas.findIndex(f => f.id === proximaFaturaId);

    if (proximaFaturaIdx === -1) {
      let vencMes = proximoMes;
      let vencAno = proximoAno;
      if (cartao.diaVencimento <= cartao.diaFechamento) {
        vencMes++;
        if (vencMes > 12) { vencMes = 1; vencAno++; }
      }
      const novaFatura: Fatura = {
        id: proximaFaturaId,
        cartaoId: fatura.cartaoId,
        mes: proximoMes,
        ano: proximoAno,
        dataVencimento: `${vencAno}-${String(vencMes).padStart(2, '0')}-${String(cartao.diaVencimento).padStart(2, '0')}`,
        dataFechamento: `${proximoAno}-${String(proximoMes).padStart(2, '0')}-${String(cartao.diaFechamento).padStart(2, '0')}`,
        status: 'aberta',
        saldoAnteriorRollover: rolloverTotal,
      };
      faturas.push(novaFatura);
    } else {
      const existing = faturas[proximaFaturaIdx].saldoAnteriorRollover ?? 0;
      faturas[proximaFaturaIdx].saldoAnteriorRollover = Math.round((existing + rolloverTotal) * 100) / 100;
    }
  }

  await writeFile(userId, 'faturas.json', faturas);

  // 3. Create a debit transaction on the account to record this payment
  const newTransacao: Transacao = {
    id: uuid(),
    descricao: `Pagamento Fatura${cartao ? ` ${cartao.nome}` : ''} ${String(fatura.mes).padStart(2, '0')}/${fatura.ano}`,
    valor: valorPagoNovo,
    tipo: 'debito',
    data: dataPag,
    categoria: 'outros',
    contaId: contaPagamentoId,
    recorrente: false,
    criadoEm: new Date().toISOString(),
    observacao: `Pagamento de fatura${isParcial ? ' (parcial)' : ' (total)'}`,
  };

  const allTransacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  allTransacoes.push(newTransacao);
  await writeFile(userId, 'transacoes.json', allTransacoes);

  res.json({ ...faturas[idx], transacaoPagamento: newTransacao });
});

// POST /fechar — close a fatura
router.post('/:id/fechar', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const idx = faturas.findIndex(f => f.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Fatura não encontrada' }); return; }

  faturas[idx].status = 'fechada';
  await writeFile(userId, 'faturas.json', faturas);
  res.json(faturas[idx]);
});

// POST /gerar — auto-generate faturas for all cards for next N months
router.post('/gerar', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { meses = 3 } = req.body;
  const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
  const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const hoje = new Date();
  const novas: Fatura[] = [];

  for (const cartao of cartoes) {
    for (let i = 0; i < Number(meses); i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      const mes = d.getMonth() + 1;
      const ano = d.getFullYear();
      const id = gerarFaturaId(cartao.id, mes, ano);
      if (!faturas.find(f => f.id === id)) {
        let vencMes = mes;
        let vencAno = ano;
        if (cartao.diaVencimento <= cartao.diaFechamento) {
          vencMes++;
          if (vencMes > 12) { vencMes = 1; vencAno++; }
        }
        const nova: Fatura = {
          id,
          cartaoId: cartao.id,
          mes,
          ano,
          dataVencimento: `${vencAno}-${String(vencMes).padStart(2, '0')}-${String(cartao.diaVencimento).padStart(2, '0')}`,
          dataFechamento: `${ano}-${String(mes).padStart(2, '0')}-${String(cartao.diaFechamento).padStart(2, '0')}`,
          status: 'aberta',
        };
        novas.push(nova);
      }
    }
  }

  await writeFile(userId, 'faturas.json', [...faturas, ...novas]);
  res.json({ ok: true, criadas: novas.length });
});

export default router;
