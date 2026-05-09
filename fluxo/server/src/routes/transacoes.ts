import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { readFile, writeFile } from '../services/storage.js';
import type { Transacao, Fatura, Cartao } from '../types/index.js';

const router = Router();

// Helper: ensure a fatura exists for a given card/month/year
function gerarFaturaId(cartaoId: string, mes: number, ano: number): string {
  return `fat-${cartaoId.slice(0, 8)}-${ano}-${String(mes).padStart(2, '0')}`;
}

async function ensureFatura(userId: string, cartaoId: string, mes: number, ano: number): Promise<Fatura> {
  const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
  const cartao = cartoes.find(c => c.id === cartaoId);

  let fatura = faturas.find(f => f.cartaoId === cartaoId && f.mes === mes && f.ano === ano);
  if (!fatura && cartao) {
    let vencMes = mes, vencAno = ano;
    if (cartao.diaVencimento <= cartao.diaFechamento) {
      vencMes++;
      if (vencMes > 12) { vencMes = 1; vencAno++; }
    }
    fatura = {
      id: gerarFaturaId(cartaoId, mes, ano),
      cartaoId, mes, ano,
      dataVencimento: `${vencAno}-${String(vencMes).padStart(2, '0')}-${String(cartao.diaVencimento).padStart(2, '0')}`,
      dataFechamento: `${ano}-${String(mes).padStart(2, '0')}-${String(cartao.diaFechamento).padStart(2, '0')}`,
      status: 'aberta',
    };
    faturas.push(fatura);
    await writeFile(userId, 'faturas.json', faturas);
  }
  return fatura!;
}

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  let transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);

  const { mes, ano, contaId, cartaoId, categoria, tipo } = req.query;

  if (mes && ano) {
    const mReq = Number(mes);
    const aReq = Number(ano);
    transacoes = transacoes.filter(t => {
      if (!t.data) return false;
      const parts = t.data.includes('-') ? t.data.split('-') : t.data.split('/');
      if (parts.length < 2) return false;
      const a = parts[0].length === 4 ? Number(parts[0]) : Number(parts[2]);
      const m = Number(parts[1]);
      return m === mReq && a === aReq;
    });
  }

  if (contaId) {
    transacoes = transacoes.filter(t => t.contaId === contaId || t.contaDestinoId === contaId);
  }

  if (cartaoId) {
    transacoes = transacoes.filter(t => t.cartaoId === cartaoId);
  }

  if (categoria) {
    transacoes = transacoes.filter(t => t.categoria === categoria);
  }

  if (tipo) {
    transacoes = transacoes.filter(t => t.tipo === tipo);
  }

  const { tag } = req.query;
  if (tag) {
    transacoes = transacoes.filter(t => t.tags?.includes(tag as string));
  }

  // Sort by date descending
  transacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  res.json(transacoes);
});

router.post('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const nova: Transacao = {
    id: uuid(),
    descricao: req.body.descricao,
    valor: Number(req.body.valor),
    tipo: req.body.tipo,
    data: req.body.data,
    categoria: req.body.categoria,
    contaId: req.body.contaId,
    contaDestinoId: req.body.contaDestinoId,
    cartaoId: req.body.cartaoId,
    faturaId: req.body.faturaId,
    recorrente: req.body.recorrente || false,
    recorrenciaId: req.body.recorrenciaId,
    parcelamento: req.body.parcelamento,
    observacao: req.body.observacao,
    tags: req.body.tags || [],
    criadoEm: new Date().toISOString(),
  };

  // Auto-assign faturaId for credit card transactions
  if (nova.tipo === 'credito_cartao' && nova.cartaoId && !nova.faturaId) {
    const { determinarFaturaDestino } = await import('../services/calculators.js');
    const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
    const cartao = cartoes.find(c => c.id === nova.cartaoId);

    if (cartao) {
      const { mes, ano } = determinarFaturaDestino(nova.data, cartao.diaFechamento);
      const fat = await ensureFatura(userId, nova.cartaoId, mes, ano);
      nova.faturaId = fat.id;
    }
  }

  transacoes.push(nova);
  await writeFile(userId, 'transacoes.json', transacoes);
  res.status(201).json(nova);
});

router.put('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const idx = transacoes.findIndex(t => t.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Transação não encontrada' }); return; }
  transacoes[idx] = { ...transacoes[idx], ...req.body, id: req.params.id };
  await writeFile(userId, 'transacoes.json', transacoes);
  res.json(transacoes[idx]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  let transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const exists = transacoes.find(t => t.id === req.params.id);
  if (!exists) { res.status(404).json({ error: 'Transação não encontrada' }); return; }
  transacoes = transacoes.filter(t => t.id !== req.params.id);
  await writeFile(userId, 'transacoes.json', transacoes);
  res.json({ ok: true });
});

// POST /parcelamento — Create installment transactions across N months
router.post('/parcelamento', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { descricao, valorTotal, parcelas, cartaoId, contaId, categoria, mesInicio, anoInicio } = req.body;

  if (!descricao || !valorTotal || !parcelas || (!cartaoId && !contaId) || !mesInicio || !anoInicio) {
    res.status(400).json({ error: 'Campos obrigatórios: descricao, valorTotal, parcelas, cartaoId ou contaId, mesInicio, anoInicio' });
    return;
  }

  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const valorParcela = Math.round((Number(valorTotal) / Number(parcelas)) * 100) / 100;
  const grupoId = uuid();
  const criadas: Transacao[] = [];

  for (let i = 0; i < Number(parcelas); i++) {
    let mes = Number(mesInicio) + i;
    let ano = Number(anoInicio);
    while (mes > 12) { mes -= 12; ano++; }

    let faturaId: string | undefined = undefined;
    if (cartaoId) {
      const fatura = await ensureFatura(userId, cartaoId, mes, ano);
      faturaId = fatura.id;
    }

    const dia = Math.min(15, new Date(ano, mes, 0).getDate());
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    const tx: Transacao = {
      id: uuid(),
      descricao: `${descricao} — ${i + 1}/${parcelas}`,
      valor: valorParcela,
      tipo: cartaoId ? 'credito_cartao' : 'debito',
      data: dataStr,
      categoria: categoria || 'outros',
      cartaoId: cartaoId || undefined,
      contaId: contaId || undefined,
      faturaId,
      recorrente: false,
      parcelamento: {
        total: Number(parcelas),
        atual: i + 1,
        grupoId,
        valorTotal: Number(valorTotal),
      },
      criadoEm: new Date().toISOString(),
    };
    transacoes.push(tx);
    criadas.push(tx);
  }

  await writeFile(userId, 'transacoes.json', transacoes);
  res.status(201).json({ ok: true, criadas: criadas.length, grupoId, parcelas: criadas });
});

// GET /tags — all unique tags used across transactions
router.get('/tags', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const tags = [...new Set(transacoes.flatMap(t => t.tags || []))].sort();
  res.json(tags);
});

export default router;
