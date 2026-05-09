import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { readFile, writeFile } from '../services/storage.js';
import { calcularJurosChequeEspecial } from '../services/calculators.js';
import type { RecorrenciaConfig, Transacao, Fatura, Conta } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const recorrencias = await readFile<RecorrenciaConfig[]>(userId, 'recorrencias.json', []);
  res.json(recorrencias);
});

router.post('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const recorrencias = await readFile<RecorrenciaConfig[]>(userId, 'recorrencias.json', []);
  const nova: RecorrenciaConfig = {
    id: uuid(),
    descricao: req.body.descricao,
    valor: Number(req.body.valor),
    categoria: req.body.categoria,
    tipo: req.body.tipo,
    contaId: req.body.contaId,
    cartaoId: req.body.cartaoId,
    diaCobranca: Number(req.body.diaCobranca),
    ativa: true,
    inicioEm: req.body.inicioEm || new Date().toISOString().split('T')[0],
    fimEm: req.body.fimEm,
  };
  recorrencias.push(nova);
  await writeFile(userId, 'recorrencias.json', recorrencias);
  res.status(201).json(nova);
});

router.put('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const recorrencias = await readFile<RecorrenciaConfig[]>(userId, 'recorrencias.json', []);
  const idx = recorrencias.findIndex(r => r.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Recorrência não encontrada' }); return; }
  recorrencias[idx] = { ...recorrencias[idx], ...req.body, id: req.params.id };
  await writeFile(userId, 'recorrencias.json', recorrencias);
  res.json(recorrencias[idx]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  let recorrencias = await readFile<RecorrenciaConfig[]>(userId, 'recorrencias.json', []);
  recorrencias = recorrencias.filter(r => r.id !== req.params.id);
  await writeFile(userId, 'recorrencias.json', recorrencias);
  res.json({ ok: true });
});

router.patch('/:id/toggle', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const recorrencias = await readFile<RecorrenciaConfig[]>(userId, 'recorrencias.json', []);
  const idx = recorrencias.findIndex(r => r.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Recorrência não encontrada' }); return; }
  recorrencias[idx].ativa = !recorrencias[idx].ativa;
  await writeFile(userId, 'recorrencias.json', recorrencias);
  res.json(recorrencias[idx]);
});

router.post('/processar', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const recorrencias = await readFile<RecorrenciaConfig[]>(userId, 'recorrencias.json', []);
  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const contas = await readFile<Conta[]>(userId, 'contas.json', []);

  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  let criadas = 0;

  for (const rec of recorrencias) {
    if (!rec.ativa) continue;
    if (rec.fimEm && new Date(rec.fimEm) < new Date(anoAtual, mesAtual - 1, 1)) continue;

    // Deduplication check
    const jaExiste = transacoes.find(t =>
      t.recorrenciaId === rec.id &&
      (() => {
        const d = new Date(t.data);
        return d.getMonth() + 1 === mesAtual && d.getFullYear() === anoAtual;
      })()
    );
    if (jaExiste) continue;

    const dia = Math.min(rec.diaCobranca, new Date(anoAtual, mesAtual, 0).getDate());
    const data = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    let faturaId: string | undefined;
    if (rec.tipo === 'credito_cartao' && rec.cartaoId) {
      const fat = faturas.find(f => f.cartaoId === rec.cartaoId && f.mes === mesAtual && f.ano === anoAtual);
      if (fat) faturaId = fat.id;
    }

    const tx: Transacao = {
      id: uuid(),
      descricao: rec.descricao,
      valor: rec.valor,
      tipo: rec.tipo,
      data,
      categoria: rec.categoria,
      contaId: rec.contaId,
      cartaoId: rec.cartaoId,
      faturaId,
      recorrente: true,
      recorrenciaId: rec.id,
      criadoEm: new Date().toISOString(),
    };

    transacoes.push(tx);
    criadas++;
  }

  // 2. Process Overdraft Interest
  for (const conta of contas) {
    if (!conta.limiteChequeEspecial || !conta.taxaJurosChequeEspecial || !conta.diaCobrancaJuros) continue;
    
    // Check if charging day has arrived
    if (hoje.getDate() < conta.diaCobrancaJuros) continue;

    // Deduplication check for this month
    const jaExiste = transacoes.find(t => 
      t.contaId === conta.id && 
      t.descricao.includes('Juros Cheque Especial') &&
      (() => {
        const d = new Date(t.data);
        return d.getMonth() + 1 === mesAtual && d.getFullYear() === anoAtual;
      })()
    );
    if (jaExiste) continue;

    // Calculate interest accrued in the current month until today
    const juros = calcularJurosChequeEspecial(
      conta.saldoInicial,
      conta.id,
      transacoes,
      faturas,
      conta.taxaJurosChequeEspecial,
      mesAtual,
      anoAtual
    );

    if (juros > 0.01) {
      const diaC = Math.min(conta.diaCobrancaJuros, new Date(anoAtual, mesAtual, 0).getDate());
      const data = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(diaC).padStart(2, '0')}`;
      
      const tx: Transacao = {
        id: uuid(),
        descricao: `Juros Cheque Especial - ${conta.nome}`,
        valor: juros,
        tipo: 'debito',
        data,
        categoria: 'outros',
        contaId: conta.id,
        recorrente: false,
        criadoEm: new Date().toISOString(),
        observacao: `Cobrança automática de juros sobre saldo negativo (mês ${mesAtual}/${anoAtual})`
      };

      transacoes.push(tx);
      criadas++;
    }
  }

  if (criadas > 0) {
    await writeFile(userId, 'transacoes.json', transacoes);
  }

  res.json({ ok: true, criadas });
});

export default router;
