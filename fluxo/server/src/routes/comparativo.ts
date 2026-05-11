import { Router, Request, Response } from 'express';
import { readFile } from '../services/storage.js';
import type { Transacao, RecorrenciaConfig } from '../types/index.js';

const router = Router();

export interface MesData {
  mes: number;
  ano: number;
  label: string;
  entradas: number;
  saidas: number;
  saldo: number;
  porCategoria: Record<string, number>;
  projetado: boolean; // false = dados reais, true = projeção futura
}

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const passados = Math.min(parseInt(req.query.passados as string || '6'), 24);
  const futuros  = Math.min(parseInt(req.query.futuros  as string || '3'), 12);

  const [transacoes, recorrencias] = await Promise.all([
    readFile<Transacao[]>(userId, 'transacoes.json', []),
    readFile<RecorrenciaConfig[]>(userId, 'recorrencias.json', []),
  ]);

  const hoje = new Date();
  const mesHoje = hoje.getMonth() + 1;
  const anoHoje = hoje.getFullYear();
  const resultado: MesData[] = [];

  // ── MESES PASSADOS (dados reais) ──────────────────────────────────────────
  for (let i = passados - 1; i >= 0; i--) {
    const d = new Date(anoHoje, mesHoje - 1 - i, 1);
    const mes = d.getMonth() + 1;
    const ano = d.getFullYear();
    const label = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });

    const txMes = transacoes.filter(t => {
      const td = new Date(t.data);
      return td.getMonth() + 1 === mes && td.getFullYear() === ano;
    });

    const entradas = txMes.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0);
    const saidas   = txMes.filter(t => t.tipo !== 'entrada' && t.tipo !== 'transferencia').reduce((s, t) => s + t.valor, 0);

    const porCategoria: Record<string, number> = {};
    for (const t of txMes.filter(t => t.tipo !== 'entrada' && t.tipo !== 'transferencia')) {
      porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + t.valor;
    }

    resultado.push({ mes, ano, label, entradas, saidas, saldo: entradas - saidas, porCategoria, projetado: false });
  }

  // ── MESES FUTUROS (projeção) ──────────────────────────────────────────────
  for (let i = 1; i <= futuros; i++) {
    const d = new Date(anoHoje, mesHoje - 1 + i, 1);
    const mes = d.getMonth() + 1;
    const ano = d.getFullYear();
    const label = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });

    // Recorrências ativas neste mês futuro — respeita pulosManual
    const chaveMes = `${ano}-${String(mes).padStart(2, '0')}`;
    const recAtivas = recorrencias.filter(r => {
      if (!r.ativa) return false;
      if (r.pulosManual?.includes(chaveMes)) return false;
      if (r.fimEm) {
        const fim = new Date(r.fimEm);
        if (new Date(ano, mes - 1, 1) > fim) return false;
      }
      return true;
    });

    const entradasRec = recAtivas
      .filter(r => r.tipo === 'entrada')
      .reduce((s, r) => s + r.valor, 0);

    const saidasRec = recAtivas
      .filter(r => r.tipo !== 'entrada')
      .reduce((s, r) => s + r.valor, 0);

    // Parcelas ativas neste mês futuro
    let parcelasMes = 0;
    const gruposVistos = new Set<string>();
    for (const t of transacoes.filter(t => t.parcelamento)) {
      const gId = t.parcelamento!.grupoId;
      if (gruposVistos.has(gId)) continue;
      gruposVistos.add(gId);

      // Find the first installment of this group to calculate future ones
      const firstOfGroup = transacoes
        .filter(tx => tx.parcelamento?.grupoId === gId)
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())[0];

      if (!firstOfGroup) continue;
      const baseDate = new Date(firstOfGroup.data);
      const mBase = baseDate.getMonth() + 1;
      const aBase = baseDate.getFullYear();
      const diff = (ano - aBase) * 12 + (mes - mBase);
      const nParcela = 1 + diff;

      if (nParcela >= 1 && nParcela <= t.parcelamento!.total) {
        parcelasMes += firstOfGroup.valor;
      }
    }

    // Categorias projetadas a partir de recorrências
    const porCategoria: Record<string, number> = {};
    for (const r of recAtivas.filter(r => r.tipo !== 'entrada')) {
      porCategoria[r.categoria] = (porCategoria[r.categoria] || 0) + r.valor;
    }
    if (parcelasMes > 0) {
      porCategoria['outros'] = (porCategoria['outros'] || 0) + parcelasMes;
    }

    const saidas   = saidasRec + parcelasMes;
    const entradas = entradasRec;

    resultado.push({ mes, ano, label, entradas, saidas, saldo: entradas - saidas, porCategoria, projetado: true });
  }

  res.json(resultado);
});

export default router;
