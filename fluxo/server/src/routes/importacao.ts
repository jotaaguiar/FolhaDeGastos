import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import { readFile, writeFile } from '../services/storage.js';
import { parseOFX } from '../services/ofxParser.js';
import { parseCSV } from '../services/csvParser.js';
import { deduplicar } from '../services/deduplicador.js';
import type { Transacao, Cartao, Fatura } from '../types/index.js';

const router = Router();

// Memory storage — file stays in RAM, never touches disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /importacao/preview
// Upload OFX or CSV and return deduplication preview
router.post('/preview', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'Arquivo não enviado' }); return; }

  const userId = (req as any).userId;
  const { contaId, cartaoId } = req.body;
  const content = req.file.buffer.toString('utf-8');
  const ext = req.file.originalname.toLowerCase();

  let parsed;
  if (ext.endsWith('.ofx') || ext.endsWith('.qfx') || content.includes('<OFX>') || content.includes('<STMTTRN>')) {
    parsed = parseOFX(content);
  } else {
    parsed = parseCSV(content);
  }

  if (parsed.length === 0) {
    res.status(422).json({ error: 'Nenhuma transação encontrada no arquivo' });
    return;
  }

  const existentes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const resultado = deduplicar(parsed, existentes, contaId, cartaoId);

  res.json({
    total: resultado.length,
    novas: resultado.filter(r => !r.duplicata).length,
    duplicatas: resultado.filter(r => r.duplicata).length,
    items: resultado.map(r => ({
      ...r.nova,
      duplicata: r.duplicata,
      transacaoExistenteId: r.transacaoExistente?.id,
    })),
  });
});

// POST /importacao/confirmar
// Actually import selected transactions
router.post('/confirmar', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { items, contaId, cartaoId, categoria } = req.body as {
    items: Array<{ externalId: string; data: string; descricao: string; valor: number; tipo: 'debito' | 'entrada' }>;
    contaId?: string;
    cartaoId?: string;
    categoria?: string;
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Nenhum item para importar' });
    return;
  }

  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
  const criadas: Transacao[] = [];

  for (const item of items) {
    let faturaId: string | undefined;

    if (cartaoId && item.tipo !== 'entrada') {
      const d = new Date(item.data);
      const cartao = cartoes.find(c => c.id === cartaoId);
      if (cartao) {
        const dia = d.getDate();
        let mes = d.getMonth() + 1;
        let ano = d.getFullYear();
        if (dia > cartao.diaFechamento) {
          mes++;
          if (mes > 12) { mes = 1; ano++; }
        }
        const fatId = `fat-${cartaoId.slice(0, 8)}-${ano}-${String(mes).padStart(2, '0')}`;
        let fat = faturas.find(f => f.id === fatId);
        if (!fat) {
          let vencMes = mes, vencAno = ano;
          if (cartao.diaVencimento <= cartao.diaFechamento) {
            vencMes++;
            if (vencMes > 12) { vencMes = 1; vencAno++; }
          }
          fat = {
            id: fatId, cartaoId, mes, ano,
            dataVencimento: `${vencAno}-${String(vencMes).padStart(2, '0')}-${String(cartao.diaVencimento).padStart(2, '0')}`,
            dataFechamento: `${ano}-${String(mes).padStart(2, '0')}-${String(cartao.diaFechamento).padStart(2, '0')}`,
            status: 'aberta',
          };
          faturas.push(fat);
        }
        faturaId = fat.id;
      }
    }

    const tx: Transacao = {
      id: uuid(),
      descricao: item.descricao,
      valor: item.valor,
      tipo: cartaoId && item.tipo !== 'entrada' ? 'credito_cartao' : item.tipo,
      data: item.data,
      categoria: (categoria || 'outros') as any,
      contaId: contaId || undefined,
      cartaoId: cartaoId || undefined,
      faturaId,
      recorrente: false,
      criadoEm: new Date().toISOString(),
    };
    transacoes.push(tx);
    criadas.push(tx);
  }

  await writeFile(userId, 'transacoes.json', transacoes);
  if (faturas.length > 0) await writeFile(userId, 'faturas.json', faturas);

  res.status(201).json({ ok: true, criadas: criadas.length, transacoes: criadas });
});

export default router;
