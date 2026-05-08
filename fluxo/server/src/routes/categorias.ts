import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { readFile, writeFile } from '../services/storage.js';

const router = Router();

export interface CategoriaCustom {
  id: string;
  nome: string;   // slug usado em Transacao.categoria
  label: string;  // texto exibido
  cor: string;    // hex color
  icone: string;  // emoji
  criadoEm: string;
}

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const cats = await readFile<CategoriaCustom[]>(userId, 'categorias.json', []);
  res.json(cats);
});

router.post('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { label, cor, icone } = req.body;
  if (!label) { res.status(400).json({ error: 'label é obrigatório' }); return; }
  const cats = await readFile<CategoriaCustom[]>(userId, 'categorias.json', []);
  const nome = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (cats.find(c => c.nome === nome)) {
    res.status(409).json({ error: 'Categoria já existe' }); return;
  }
  const nova: CategoriaCustom = {
    id: uuid(), nome, label: label.trim(),
    cor: cor || '#6366f1', icone: icone || '📂',
    criadoEm: new Date().toISOString(),
  };
  cats.push(nova);
  await writeFile(userId, 'categorias.json', cats);
  res.status(201).json(nova);
});

router.put('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const cats = await readFile<CategoriaCustom[]>(userId, 'categorias.json', []);
  const idx = cats.findIndex(c => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Categoria não encontrada' }); return; }
  cats[idx] = { ...cats[idx], ...req.body, id: req.params.id };
  await writeFile(userId, 'categorias.json', cats);
  res.json(cats[idx]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  let cats = await readFile<CategoriaCustom[]>(userId, 'categorias.json', []);
  if (!cats.find(c => c.id === req.params.id)) {
    res.status(404).json({ error: 'Categoria não encontrada' }); return;
  }
  cats = cats.filter(c => c.id !== req.params.id);
  await writeFile(userId, 'categorias.json', cats);
  res.json({ ok: true });
});

export default router;
