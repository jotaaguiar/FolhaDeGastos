import { parse } from 'csv-parse/sync';
import type { ParsedTransaction } from './ofxParser.js';

// Detect common CSV formats from Brazilian banks
export function parseCSV(content: string): ParsedTransaction[] {
  // Remove BOM
  const clean = content.replace(/^﻿/, '').trim();
  const transactions: ParsedTransaction[] = [];

  try {
    const records: string[][] = parse(clean, {
      skip_empty_lines: true,
      relax_column_count: true,
      delimiter: [',', ';'],
      trim: true,
    });

    if (records.length < 2) return [];

    const header = records[0].map(h => h.toLowerCase().replace(/['"]/g, '').trim());

    // Map column indices
    const idx = {
      data: findCol(header, ['data', 'date', 'data pagamento', 'data lançamento', 'data de lançamento']),
      descricao: findCol(header, ['descricao', 'descrição', 'description', 'historico', 'histórico', 'estabelecimento', 'memo']),
      valor: findCol(header, ['valor', 'value', 'amount', 'quantia', 'débito', 'crédito', 'debit', 'credit']),
      tipo: findCol(header, ['tipo', 'type', 'natureza']),
    };

    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      if (!row || row.length < 2) continue;

      const rawData = idx.data >= 0 ? row[idx.data] : '';
      const rawDesc = idx.descricao >= 0 ? row[idx.descricao] : row[1] || '';
      const rawValor = idx.valor >= 0 ? row[idx.valor] : row[2] || '';

      const data = parseDate(rawData);
      if (!data) continue;

      const rawNum = rawValor.replace(/[^\d,.-]/g, '').replace(',', '.');
      const valor = parseFloat(rawNum);
      if (isNaN(valor)) continue;

      const tipo: 'debito' | 'entrada' = valor < 0 ? 'debito' : 'entrada';

      transactions.push({
        externalId: `csv-${i}-${data}-${Math.abs(valor)}`,
        data,
        descricao: rawDesc.replace(/^["']|["']$/g, '').trim() || 'Transação',
        valor: Math.abs(valor),
        tipo,
      });
    }
  } catch {
    // Try line-by-line fallback
    const lines = clean.split(/\r?\n/).filter(l => l.trim());
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/[,;]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 3) continue;
      const data = parseDate(parts[0]);
      if (!data) continue;
      const valor = parseFloat(parts[2].replace(/[^\d,.-]/g, '').replace(',', '.'));
      if (isNaN(valor)) continue;
      transactions.push({
        externalId: `csv-${i}-${data}`,
        data,
        descricao: parts[1] || 'Transação',
        valor: Math.abs(valor),
        tipo: valor < 0 ? 'debito' : 'entrada',
      });
    }
  }

  return transactions;
}

function findCol(header: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = header.findIndex(h => h.includes(c));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/["']/g, '').trim();

  // DD/MM/YYYY or DD-MM-YYYY
  let m = cleaned.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  // YYYY-MM-DD
  m = cleaned.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  // MM/DD/YYYY
  m = cleaned.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (m) {
    const [, a, b, c] = m;
    if (parseInt(a) <= 12 && parseInt(b) <= 31) return `${c}-${a}-${b}`;
  }

  return null;
}
