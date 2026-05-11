import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { readFile, writeFile } from '../services/storage.js';
import { calcularJurosChequeEspecial } from '../services/calculators.js';
import type { RecorrenciaConfig, Transacao, Fatura, Cartao, Conta } from '../types/index.js';

const router = Router();

const DEFAULT_QUANTIDADE_MESES = 12;

/**
 * Garante que existe uma fatura para cartão+mês+ano. Cria se faltar.
 * Side-effect: pode mutar o array de faturas (e devolve a fatura encontrada/criada).
 */
function ensureFaturaInline(
  faturas: Fatura[],
  cartoes: Cartao[],
  cartaoId: string,
  mes: number,
  ano: number,
): Fatura | undefined {
  let fatura = faturas.find(f => f.cartaoId === cartaoId && f.mes === mes && f.ano === ano);
  if (fatura) return fatura;

  const cartao = cartoes.find(c => c.id === cartaoId);
  if (!cartao) return undefined;

  let vencMes = mes, vencAno = ano;
  if (cartao.diaVencimento <= cartao.diaFechamento) {
    vencMes++;
    if (vencMes > 12) { vencMes = 1; vencAno++; }
  }

  fatura = {
    id: `fat-${cartaoId.slice(0, 8)}-${ano}-${String(mes).padStart(2, '0')}`,
    cartaoId, mes, ano,
    dataVencimento: `${vencAno}-${String(vencMes).padStart(2, '0')}-${String(cartao.diaVencimento).padStart(2, '0')}`,
    dataFechamento: `${ano}-${String(mes).padStart(2, '0')}-${String(cartao.diaFechamento).padStart(2, '0')}`,
    status: 'aberta',
  };
  faturas.push(fatura);
  return fatura;
}

/**
 * Materializa transações concretas para uma recorrência, dos próximos N meses
 * a partir de `inicioEm` (ou do mês atual se já passou). Idempotente:
 * - Pula meses em pulosManual
 * - Pula meses que já têm tx com esse recorrenciaId
 * - Não cria nada após `fimEm` se setado
 *
 * Mutates: transacoes[], faturas[]. Retorna número de txs criadas.
 */
function materializarRecorrencia(
  rec: RecorrenciaConfig,
  transacoes: Transacao[],
  faturas: Fatura[],
  cartoes: Cartao[],
): number {
  if (!rec.ativa) return 0;
  const quantidade = rec.quantidadeMeses ?? DEFAULT_QUANTIDADE_MESES;

  const inicio = rec.inicioEm ? new Date(rec.inicioEm + 'T12:00:00') : new Date();
  let criadas = 0;

  for (let i = 0; i < quantidade; i++) {
    const d = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
    const mes = d.getMonth() + 1;
    const ano = d.getFullYear();
    const chaveMes = `${ano}-${String(mes).padStart(2, '0')}`;

    // Não passa do fimEm se setado
    if (rec.fimEm && new Date(rec.fimEm) < new Date(ano, mes - 1, 1)) break;

    // Pulo manual
    if (rec.pulosManual?.includes(chaveMes)) continue;

    // Já existe?
    const jaExiste = transacoes.some(t => {
      if (t.recorrenciaId !== rec.id) return false;
      const td = new Date(t.data + 'T12:00:00');
      return td.getMonth() + 1 === mes && td.getFullYear() === ano;
    });
    if (jaExiste) continue;

    const dia = Math.min(rec.diaCobranca, new Date(ano, mes, 0).getDate());
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    let faturaId: string | undefined;
    if (rec.tipo === 'credito_cartao' && rec.cartaoId) {
      const fat = ensureFaturaInline(faturas, cartoes, rec.cartaoId, mes, ano);
      if (fat) faturaId = fat.id;
    }

    transacoes.push({
      id: uuid(),
      descricao: rec.descricao,
      valor: rec.valor,
      tipo: rec.tipo,
      data: dataStr,
      categoria: rec.categoria,
      contaId: rec.contaId,
      cartaoId: rec.cartaoId,
      faturaId,
      recorrente: true,
      recorrenciaId: rec.id,
      criadoEm: new Date().toISOString(),
    });
    criadas++;
  }

  return criadas;
}

// ─────────────────────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const recorrencias = await readFile<RecorrenciaConfig[]>(userId, 'recorrencias.json', []);
  res.json(recorrencias);
});

router.post('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const recorrencias = await readFile<RecorrenciaConfig[]>(userId, 'recorrencias.json', []);
  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);

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
    quantidadeMeses: req.body.quantidadeMeses ? Number(req.body.quantidadeMeses) : DEFAULT_QUANTIDADE_MESES,
  };

  recorrencias.push(nova);

  // Materialização eager: cria as N txs concretamente
  const criadas = materializarRecorrencia(nova, transacoes, faturas, cartoes);

  await writeFile(userId, 'recorrencias.json', recorrencias);
  if (criadas > 0) {
    await writeFile(userId, 'transacoes.json', transacoes);
    await writeFile(userId, 'faturas.json', faturas);
  }

  res.status(201).json({ ...nova, transacoesCriadas: criadas });
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
  let transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);

  const existe = recorrencias.find(r => r.id === req.params.id);
  if (!existe) { res.status(404).json({ error: 'Recorrência não encontrada' }); return; }

  // Cascata: apaga txs futuras (data > hoje) que pertencem a essa recorrência.
  // Mantém histórico (txs com data <= hoje).
  const hoje = new Date().toISOString().split('T')[0];
  const txAntes = transacoes.length;
  transacoes = transacoes.filter(t => !(t.recorrenciaId === req.params.id && t.data > hoje));
  const txRemovidas = txAntes - transacoes.length;

  recorrencias = recorrencias.filter(r => r.id !== req.params.id);

  await writeFile(userId, 'recorrencias.json', recorrencias);
  if (txRemovidas > 0) await writeFile(userId, 'transacoes.json', transacoes);

  res.json({ ok: true, transacoesRemovidas: txRemovidas });
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

/**
 * Materializa todas as recorrências (idempotente). Útil para:
 * - Migração de recorrências antigas que não tinham materialização eager
 * - Re-sync se algo saiu do alinhamento
 */
router.post('/processar', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const recorrencias = await readFile<RecorrenciaConfig[]>(userId, 'recorrencias.json', []);
  const transacoes = await readFile<Transacao[]>(userId, 'transacoes.json', []);
  const faturas = await readFile<Fatura[]>(userId, 'faturas.json', []);
  const cartoes = await readFile<Cartao[]>(userId, 'cartoes.json', []);
  const contas = await readFile<Conta[]>(userId, 'contas.json', []);

  let criadas = 0;
  for (const rec of recorrencias) {
    criadas += materializarRecorrencia(rec, transacoes, faturas, cartoes);
  }

  // Juros de cheque especial (mantido — não relacionado à mudança arquitetural)
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  for (const conta of contas) {
    if (!conta.limiteChequeEspecial || !conta.taxaJurosChequeEspecial || !conta.diaCobrancaJuros) continue;
    if (hoje.getDate() < conta.diaCobrancaJuros) continue;

    const jaExiste = transacoes.find(t =>
      t.contaId === conta.id &&
      t.descricao.includes('Juros Cheque Especial') &&
      (() => {
        const d = new Date(t.data);
        return d.getMonth() + 1 === mesAtual && d.getFullYear() === anoAtual;
      })()
    );
    if (jaExiste) continue;

    const juros = calcularJurosChequeEspecial(
      conta.saldoInicial, conta.id, transacoes, faturas,
      conta.taxaJurosChequeEspecial, mesAtual, anoAtual,
    );

    if (juros > 0.01) {
      const diaC = Math.min(conta.diaCobrancaJuros, new Date(anoAtual, mesAtual, 0).getDate());
      transacoes.push({
        id: uuid(),
        descricao: `Juros Cheque Especial - ${conta.nome}`,
        valor: juros,
        tipo: 'debito',
        data: `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(diaC).padStart(2, '0')}`,
        categoria: 'outros',
        contaId: conta.id,
        recorrente: false,
        criadoEm: new Date().toISOString(),
        observacao: `Cobrança automática de juros sobre saldo negativo (mês ${mesAtual}/${anoAtual})`,
      });
      criadas++;
    }
  }

  if (criadas > 0) {
    await writeFile(userId, 'transacoes.json', transacoes);
    await writeFile(userId, 'faturas.json', faturas);
  }

  res.json({ ok: true, criadas });
});

export { materializarRecorrencia };
export default router;
