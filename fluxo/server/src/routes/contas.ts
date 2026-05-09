import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { readFile, writeFile } from '../services/storage.js';
import type { Conta } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const contas = await readFile<Conta[]>(userId, 'contas.json', []);
  res.json(contas);
});

router.post('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const contas = await readFile<Conta[]>(userId, 'contas.json', []);
  const nova: Conta = {
    id: uuid(),
    nome: req.body.nome,
    banco: req.body.banco,
    tipo: req.body.tipo,
    saldoInicial: Number(req.body.saldoInicial) || 0,
    cor: req.body.cor || '#a78bfa',
    ativa: true,
    limiteChequeEspecial: Number(req.body.limiteChequeEspecial) || 0,
    taxaJurosChequeEspecial: Number(req.body.taxaJurosChequeEspecial) || 0,
    diaCobrancaJuros: Number(req.body.diaCobrancaJuros) || 1,
    criadoEm: new Date().toISOString(),
  };
  contas.push(nova);
  await writeFile(userId, 'contas.json', contas);
  res.status(201).json(nova);
});

router.put('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const contas = await readFile<Conta[]>(userId, 'contas.json', []);
  const idx = contas.findIndex(c => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Conta não encontrada' }); return; }
  contas[idx] = { ...contas[idx], ...req.body, id: req.params.id };
  await writeFile(userId, 'contas.json', contas);
  res.json(contas[idx]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  let contas = await readFile<Conta[]>(userId, 'contas.json', []);
  const exists = contas.find(c => c.id === req.params.id);
  if (!exists) { res.status(404).json({ error: 'Conta não encontrada' }); return; }
  contas = contas.filter(c => c.id !== req.params.id);
  await writeFile(userId, 'contas.json', contas);
  res.json({ ok: true });
});

// PATCH /:id/saldo — Directly set account balance by adjusting saldoInicial
router.patch('/:id/saldo', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const contas = await readFile<Conta[]>(userId, 'contas.json', []);
  const idx = contas.findIndex(c => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Conta não encontrada' }); return; }
  const novoSaldo = Number(req.body.saldo);
  if (isNaN(novoSaldo)) { res.status(400).json({ error: 'Saldo inválido' }); return; }
  // Adjust saldoInicial to make the effective balance match the desired value
  contas[idx].saldoInicial = novoSaldo;
  await writeFile(userId, 'contas.json', contas);
  res.json(contas[idx]);
});

export default router;
