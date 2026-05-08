import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { readFile, writeFile } from '../services/storage.js';
import type { Meta } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const metas = await readFile<Meta[]>(userId, 'metas.json', []);
  res.json(metas);
});

router.post('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const metas = await readFile<Meta[]>(userId, 'metas.json', []);
  const nova: Meta = {
    id: uuid(),
    nome: req.body.nome,
    descricao: req.body.descricao,
    valorAlvo: Number(req.body.valorAlvo),
    valorAtual: Number(req.body.valorAtual) || 0,
    depositos: [],
    contaVinculadaId: req.body.contaVinculadaId,
    prazo: req.body.prazo,
    cor: req.body.cor || '#a78bfa',
    icone: req.body.icone || '🎯',
    status: 'ativa',
    criadoEm: new Date().toISOString(),
  };
  metas.push(nova);
  await writeFile(userId, 'metas.json', metas);
  res.status(201).json(nova);
});

router.put('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const metas = await readFile<Meta[]>(userId, 'metas.json', []);
  const idx = metas.findIndex(m => m.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Meta não encontrada' }); return; }
  metas[idx] = { ...metas[idx], ...req.body, id: req.params.id };
  await writeFile(userId, 'metas.json', metas);
  res.json(metas[idx]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  let metas = await readFile<Meta[]>(userId, 'metas.json', []);
  metas = metas.filter(m => m.id !== req.params.id);
  await writeFile(userId, 'metas.json', metas);
  res.json({ ok: true });
});

router.post('/:id/deposito', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const metas = await readFile<Meta[]>(userId, 'metas.json', []);
  const idx = metas.findIndex(m => m.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Meta não encontrada' }); return; }
  const valor = Number(req.body.valor);
  metas[idx].valorAtual += valor;
  metas[idx].depositos.push({
    data: new Date().toISOString().split('T')[0],
    valor,
    observacao: req.body.observacao,
  });
  if (metas[idx].valorAtual >= metas[idx].valorAlvo) {
    metas[idx].status = 'concluida';
  }
  await writeFile(userId, 'metas.json', metas);
  res.json(metas[idx]);
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const metas = await readFile<Meta[]>(userId, 'metas.json', []);
  const idx = metas.findIndex(m => m.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Meta não encontrada' }); return; }
  metas[idx].status = req.body.status;
  await writeFile(userId, 'metas.json', metas);
  res.json(metas[idx]);
});

export default router;
