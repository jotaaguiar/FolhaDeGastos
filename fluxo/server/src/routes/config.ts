import { Router, Request, Response } from 'express';
import { readFile, writeFile } from '../services/storage.js';
import type { Config } from '../types/index.js';

const router = Router();

const defaultConfig: Config = {
  nomeUsuario: 'Usuário',
  moeda: 'BRL',
  limiteDiarioPadrao: 150,
  limiteDinamico: false,
  tema: 'escuro' as any,
  reservaInvestimento: 0,
  radarPeriodo: 6,
  taxaJurosCartoesGlobal: 15,
  regra503020Ativa: true,
  regra503020Necessidades: 50,
  regra503020Desejos: 30,
  regra503020Poupanca: 20,
};

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const config = await readFile<Config>(userId, 'config.json', defaultConfig);
  res.json(config);
});

router.put('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const config = await readFile<Config>(userId, 'config.json', defaultConfig);
  const updated = { ...config, ...req.body };
  await writeFile(userId, 'config.json', updated);
  res.json(updated);
});

router.post('/import', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  try {
    const { contas, cartoes, transacoes, faturas, recorrencias, metas, orcamento, config: cfg } = req.body;
    if (contas !== undefined) await writeFile(userId, 'contas.json', contas);
    if (cartoes !== undefined) await writeFile(userId, 'cartoes.json', cartoes);
    if (transacoes !== undefined) await writeFile(userId, 'transacoes.json', transacoes);
    if (faturas !== undefined) await writeFile(userId, 'faturas.json', faturas);
    if (recorrencias !== undefined) await writeFile(userId, 'recorrencias.json', recorrencias);
    if (metas !== undefined) await writeFile(userId, 'metas.json', metas);
    if (orcamento !== undefined) await writeFile(userId, 'orcamento.json', orcamento);
    if (cfg !== undefined) await writeFile(userId, 'config.json', { ...defaultConfig, ...cfg });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao importar os dados.' });
  }
});

router.post('/wipe', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  try {
    await writeFile(userId, 'contas.json', []);
    await writeFile(userId, 'cartoes.json', []);
    await writeFile(userId, 'transacoes.json', []);
    await writeFile(userId, 'faturas.json', []);
    await writeFile(userId, 'recorrencias.json', []);
    await writeFile(userId, 'metas.json', []);
    await writeFile(userId, 'orcamento.json', []);
    await writeFile(userId, 'config.json', defaultConfig);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao limpar os dados.' });
  }
});

export default router;
