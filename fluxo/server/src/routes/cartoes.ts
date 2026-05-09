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
  // Calculate total debt using a global approach:
  // Debt = (All transactions) + (All manual adjustments) + (All interest) - (All payments)
  
  const totalTransacoes = transacoes
    .filter(t => t.cartaoId === cartao.id && t.tipo === 'credito_cartao')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalAjustes = allFaturas
    .filter(f => f.cartaoId === cartao.id)
    .reduce((acc, f) => acc + (Number(f.valorAjuste) || 0), 0);

  const totalJuros = allFaturas
    .filter(f => f.cartaoId === cartao.id)
    .reduce((acc, f) => acc + (Number(f.jurosAplicados) || 0), 0);

  const totalPago = allFaturas
    .filter(f => f.cartaoId === cartao.id)
    .reduce((acc, f) => acc + (Number(f.valorPago) || 0), 0);

  const limiteUsadoTotal = Math.max(0, Math.round((totalTransacoes + totalAjustes + totalJuros - totalPago) * 100) / 100);

  // 5. Projected: "If I pay everything up to target month"
  // Remaining debt = Total Debt - (Debt in invoices up to target month)
  // Which is equal to: Debt in invoices AFTER target month.
  let debitoFuturo = 0;
  const now = new Date();
  const tMes = targetMes ?? (now.getMonth() + 1);
  const tAno = targetAno ?? now.getFullYear();

  const faturasFuturas = allFaturas.filter(f => 
    f.cartaoId === cartao.id && 
    (f.ano > tAno || (f.ano === tAno && f.mes > tMes))
  );
  const faturasFuturasIds = new Set(faturasFuturas.map(f => f.id));

  const transacoesFuturas = transacoes
    .filter(t => t.cartaoId === cartao.id && t.tipo === 'credito_cartao' && t.faturaId && faturasFuturasIds.has(t.faturaId))
    .reduce((acc, t) => acc + t.valor, 0);
  
  const ajustesFuturos = faturasFuturas.reduce((acc, f) => acc + (Number(f.valorAjuste) || 0), 0);
  
  debitoFuturo = transacoesFuturas + ajustesFuturos;

  return {
    limiteUsadoTotal,
    limiteDisponivelReal: Math.max(0, Math.round((cartao.limite - limiteUsadoTotal) * 100) / 100),
    limiteDisponivelProjetado: Math.max(0, Math.round((cartao.limite - debitoFuturo) * 100) / 100),
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

  // Handle initial configuration atomically
  const { initialConfig } = req.body;
  if (initialConfig && initialConfig.mode !== 'none') {
    const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
    const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);

    const nowLocal = new Date();
    const mesHoje = nowLocal.getMonth() + 1;
    const anoHoje = nowLocal.getFullYear();

    const ensureLocalFatura = (m: number, a: number) => {
      let f = faturas.find(fat => fat.cartaoId === novo.id && fat.mes === m && fat.ano === a);
      if (!f) {
        let vM = m, vA = a;
        if (novo.diaVencimento <= novo.diaFechamento) { vM++; if (vM > 12) { vM = 1; vA++; } }
        
        let status: Fatura['status'] = 'aberta';
        if (a > anoHoje || (a === anoHoje && m > mesHoje)) {
          status = 'futura';
        }

        f = {
          id: `fat-${novo.id.slice(0, 8)}-${a}-${String(m).padStart(2, '0')}`,
          cartaoId: novo.id, mes: m, ano: a,
          dataVencimento: `${vA}-${String(vM).padStart(2, '0')}-${String(novo.diaVencimento).padStart(2, '0')}`,
          dataFechamento: `${a}-${String(m).padStart(2, '0')}-${String(novo.diaFechamento).padStart(2, '0')}`,
          status,
        };
        faturas.push(f);
      }
      return f;
    };

    if (initialConfig.mode === 'saldos' && initialConfig.saldos) {
      for (const s of initialConfig.saldos) {
        const fat = ensureLocalFatura(Number(s.mes), Number(s.ano));
        fat.valorAjuste = Number(s.valor) || 0;
      }
    } else if (initialConfig.mode === 'parcelas' && initialConfig.parcelas) {
      for (const p of initialConfig.parcelas) {
        const grupoId = uuid();
        const valorParcela = Math.round((Number(p.valorTotal) / Number(p.parcelas)) * 100) / 100;
        for (let i = 0; i < Number(p.parcelas); i++) {
          let m = Number(p.mesInicio) + i;
          let a = Number(p.anoInicio);
          while (m > 12) { m -= 12; a++; }
          const fat = ensureLocalFatura(m, a);
          const dia = Math.min(15, new Date(a, m, 0).getDate());
          transacoes.push({
            id: uuid(),
            descricao: `${p.descricao} — ${i + 1}/${p.parcelas}`,
            valor: valorParcela,
            tipo: 'credito_cartao',
            data: `${a}-${String(m).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
            categoria: p.categoria || 'outros',
            cartaoId: novo.id,
            faturaId: fat.id,
            recorrente: false,
            parcelamento: { total: Number(p.parcelas), atual: i + 1, grupoId, valorTotal: Number(p.valorTotal) },
            criadoEm: new Date().toISOString(),
          });
        }
      }
    }
    await writeFile(userId, 'faturas.json', faturas);
    await writeFile(userId, 'transacoes.json', transacoes);
  }

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
  const cartaoId = req.params.id;

  let cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
  const exists = cartoes.find(c => c.id === cartaoId);
  if (!exists) { res.status(404).json({ error: 'Cartão não encontrado' }); return; }

  // 1. Remove the card
  cartoes = cartoes.filter(c => c.id !== cartaoId);
  await writeFile(userId, 'cartoes.json', cartoes);

  // 2. Remove all associated invoices
  let faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  faturas = faturas.filter(f => f.cartaoId !== cartaoId);
  await writeFile(userId, 'faturas.json', faturas);

  // 3. Remove all associated transactions
  let transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  transacoes = transacoes.filter(t => t.cartaoId !== cartaoId);
  await writeFile(userId, 'transacoes.json', transacoes);

  res.json({ ok: true });
});

export default router;
