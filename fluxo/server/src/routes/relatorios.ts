import { Router, Request, Response } from 'express';
import { readFile } from '../services/storage.js';
import { gerarRelatorioPDF } from '../services/pdfGenerator.js';
import type { Transacao, Conta, Cartao, Config } from '../types/index.js';

const router = Router();

router.get('/mensal', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const mes = parseInt(req.query.mes as string || String(new Date().getMonth() + 1));
  const ano = parseInt(req.query.ano as string || String(new Date().getFullYear()));

  const [allTx, contas, cartoes, config] = await Promise.all([
    readFile<Transacao[]>(userId, 'transacoes.json', []),
    readFile<Conta[]>(userId, 'contas.json', []),
    readFile<Cartao[]>(userId, 'cartoes.json', []),
    readFile<Config>(userId, 'config.json', {} as Config),
  ]);

  const transacoes = allTx.filter(t => {
    const d = new Date(t.data);
    return d.getMonth() + 1 === mes && d.getFullYear() === ano;
  });

  const doc = gerarRelatorioPDF({
    mes, ano, transacoes, contas, cartoes,
    nomeUsuario: config?.nomeUsuario,
  });

  const mesLabel = new Date(ano, mes - 1, 1)
    .toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(' de ', '-')
    .replace(' ', '-');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="fluxo-${mesLabel}.pdf"`);

  doc.pipe(res);
  doc.end();
});

export default router;
