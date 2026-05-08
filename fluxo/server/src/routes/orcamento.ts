import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { readFile, writeFile } from '../services/storage.js';
import type { OrcamentoCategoria, Transacao } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const mes = Number(req.query.mes) || new Date().getMonth() + 1;
  const ano = Number(req.query.ano) || new Date().getFullYear();
  const orcamento = await readFile<OrcamentoCategoria[]>(userId, 'orcamento.json', []);
  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const orcamentoMes = orcamento.filter(o => o.mes === mes && o.ano === ano);
  const transacoesMes = transacoes.filter(t => {
    const d = new Date(t.data);
    return d.getMonth() + 1 === mes && d.getFullYear() === ano;
  });
  const result = orcamentoMes.map(o => {
    const gasto = transacoesMes
      .filter(t => t.categoria === o.categoria && t.tipo !== 'entrada' && t.tipo !== 'transferencia')
      .reduce((acc, t) => acc + t.valor, 0);
    return { ...o, gasto: Math.round(gasto * 100) / 100 };
  });
  res.json(result);
});

router.post('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const orcamento = await readFile<OrcamentoCategoria[]>(userId, 'orcamento.json', []);
  const novo: OrcamentoCategoria = {
    id: uuid(),
    categoria: req.body.categoria,
    limite: Number(req.body.limite),
    mes: Number(req.body.mes) || new Date().getMonth() + 1,
    ano: Number(req.body.ano) || new Date().getFullYear(),
    alertaPct: Number(req.body.alertaPct) || 80,
  };
  orcamento.push(novo);
  await writeFile(userId, 'orcamento.json', orcamento);
  res.status(201).json(novo);
});

router.put('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const orcamento = await readFile<OrcamentoCategoria[]>(userId, 'orcamento.json', []);
  const idx = orcamento.findIndex(o => o.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Orçamento não encontrado' }); return; }
  orcamento[idx] = { ...orcamento[idx], ...req.body, id: req.params.id };
  await writeFile(userId, 'orcamento.json', orcamento);
  res.json(orcamento[idx]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  let orcamento = await readFile<OrcamentoCategoria[]>(userId, 'orcamento.json', []);
  orcamento = orcamento.filter(o => o.id !== req.params.id);
  await writeFile(userId, 'orcamento.json', orcamento);
  res.json({ ok: true });
});

export default router;
