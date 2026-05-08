import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { readFile, writeFile } from '../services/storage.js';
import type { Cartao, Fatura, Transacao } from '../types/index.js';

const router = Router();

function computeLimiteCartao(
  cartao: Cartao,
  allFaturas: Fatura[],
  transacoes: Transacao[],
  targetMes?: number,
  targetAno?: number
): { limiteUsadoTotal: number; limiteDisponivelReal: number; limiteDisponivelProjetado: number } {
  const faturasNaoPagas = allFaturas.filter(f => f.cartaoId === cartao.id && f.status !== 'paga');
  const faturasNaoPagasIds = new Set(faturasNaoPagas.map(f => f.id));

  // Actual CC charges in unpaid invoices
  const gastoTransacoes = transacoes
    .filter(t => t.cartaoId === cartao.id && t.tipo === 'credito_cartao' && t.faturaId && faturasNaoPagasIds.has(t.faturaId))
    .reduce((acc, t) => acc + t.valor, 0);

  // Interest from partial payments (not a transaction, stored on the fatura)
  const juros = faturasNaoPagas
    .filter(f => f.status === 'parcial')
    .reduce((acc, f) => acc + (f.jurosAplicados || 0), 0);

  // Amount already paid on partial invoices
  const jaPago = faturasNaoPagas
    .filter(f => f.status === 'parcial')
    .reduce((acc, f) => acc + (f.valorPago || 0), 0);

  const limiteUsadoTotal = Math.max(0, Math.round((gastoTransacoes + juros - jaPago) * 100) / 100);

  // Projected: if targetMes/targetAno given, show limit if only that month's invoice remained;
  // otherwise fall back to only the currently open invoice.
  let gastoAberto: number;
  if (targetMes !== undefined && targetAno !== undefined) {
    const faturaDoMes = allFaturas.find(
      f => f.cartaoId === cartao.id && f.mes === targetMes && f.ano === targetAno
    );
    gastoAberto = faturaDoMes
      ? transacoes
          .filter(t => t.cartaoId === cartao.id && t.tipo === 'credito_cartao' && t.faturaId === faturaDoMes.id)
          .reduce((acc, t) => acc + t.valor, 0)
      : 0;
  } else {
    const faturasAbertasIds = new Set(
      allFaturas.filter(f => f.cartaoId === cartao.id && f.status === 'aberta').map(f => f.id)
    );
    gastoAberto = transacoes
      .filter(t => t.cartaoId === cartao.id && t.tipo === 'credito_cartao' && t.faturaId && faturasAbertasIds.has(t.faturaId))
      .reduce((acc, t) => acc + t.valor, 0);
  }

  return {
    limiteUsadoTotal,
    limiteDisponivelReal: Math.max(0, Math.round((cartao.limite - limiteUsadoTotal) * 100) / 100),
    limiteDisponivelProjetado: Math.max(0, Math.round((cartao.limite - gastoAberto) * 100) / 100),
  };
}

export { computeLimiteCartao };

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const mes = req.query.mes ? Number(req.query.mes) : undefined;
  const ano = req.query.ano ? Number(req.query.ano) : undefined;

  const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
  const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);

  const result = cartoes.map(cartao => ({
    ...cartao,
    ...computeLimiteCartao(cartao, faturas, transacoes, mes, ano),
  }));
  res.json(result);
});

router.post('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
  const novo: Cartao = {
    id: uuid(),
    nome: req.body.nome,
    banco: req.body.banco,
    bandeira: req.body.bandeira,
    ultimos4: req.body.ultimos4,
    limite: Number(req.body.limite) || 0,
    diaVencimento: Number(req.body.diaVencimento) || 10,
    diaFechamento: Number(req.body.diaFechamento) || 3,
    cor: req.body.cor || '#a78bfa',
    ativa: true,
    taxaJurosRotativo: req.body.taxaJurosRotativo !== undefined ? Number(req.body.taxaJurosRotativo) : undefined,
    taxaJurosParcela: req.body.taxaJurosParcela !== undefined ? Number(req.body.taxaJurosParcela) : undefined,
  };
  cartoes.push(novo);
  await writeFile(userId, 'cartoes.json', cartoes);
  res.status(201).json(novo);
});

router.put('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
  const idx = cartoes.findIndex(c => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Cartão não encontrado' }); return; }
  cartoes[idx] = { ...cartoes[idx], ...req.body, id: req.params.id };
  await writeFile(userId, 'cartoes.json', cartoes);
  res.json(cartoes[idx]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  let cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
  const exists = cartoes.find(c => c.id === req.params.id);
  if (!exists) { res.status(404).json({ error: 'Cartão não encontrado' }); return; }
  cartoes = cartoes.filter(c => c.id !== req.params.id);
  await writeFile(userId, 'cartoes.json', cartoes);
  res.json({ ok: true });
});

export default router;
