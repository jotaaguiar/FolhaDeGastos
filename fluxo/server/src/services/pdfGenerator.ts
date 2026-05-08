import PDFDocument from 'pdfkit';
import type { Transacao, Conta, Cartao } from '../types/index.js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDoc = InstanceType<typeof PDFDocument>;

const CATEGORIA_LABELS: Record<string, string> = {
  moradia: 'Moradia', alimentacao: 'Alimentação', transporte: 'Transporte',
  saude: 'Saúde', educacao: 'Educação', lazer: 'Lazer', assinaturas: 'Assinaturas',
  vestuario: 'Vestuário', viagem: 'Viagem', investimento: 'Investimento',
  outros: 'Outros', entrada_salario: 'Salário', entrada_freelance: 'Freelance',
  entrada_outros: 'Outras Entradas', transferencia: 'Transferência',
};

function fmt(n: number): string {
  return `R$ ${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function gerarRelatorioPDF(params: {
  mes: number;
  ano: number;
  transacoes: Transacao[];
  contas: Conta[];
  cartoes: Cartao[];
  nomeUsuario?: string;
}): PDFDoc {
  const { mes, ano, transacoes, contas, cartoes, nomeUsuario } = params;
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  const mesLabel = new Date(ano, mes - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  // Header
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#6366f1').text('Fluxo', { continued: true })
    .fillColor('#111827').text(' — Relatório Financeiro');
  doc.moveDown(0.3);
  doc.fontSize(11).font('Helvetica').fillColor('#6b7280')
    .text(`${nomeUsuario || 'Usuário'} · ${mesLabel}`);
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e5e7eb').stroke();
  doc.moveDown(0.5);

  const entradas = transacoes.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0);
  const saidas = transacoes.filter(t => t.tipo !== 'entrada' && t.tipo !== 'transferencia').reduce((s, t) => s + t.valor, 0);
  const saldo = entradas - saidas;

  // Summary
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827').text('Resumo do Mês');
  doc.moveDown(0.3);

  const summaryY = doc.y;
  doc.fontSize(10).font('Helvetica').fillColor('#374151');
  const cols = [
    { label: 'Total de Entradas', value: fmt(entradas), color: '#16a34a' },
    { label: 'Total de Saídas', value: fmt(saidas), color: '#dc2626' },
    { label: 'Saldo do Mês', value: fmt(saldo), color: saldo >= 0 ? '#16a34a' : '#dc2626' },
    { label: 'Transações', value: String(transacoes.length), color: '#6366f1' },
  ];

  let colX = 40;
  for (const col of cols) {
    doc.fontSize(9).fillColor('#6b7280').text(col.label, colX, summaryY);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(col.color)
      .text(col.value, colX, summaryY + 14, { width: 120 });
    colX += 130;
  }

  doc.y = summaryY + 50;
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e5e7eb').stroke();
  doc.moveDown(0.5);

  // By category
  const porCategoria: Record<string, number> = {};
  for (const t of transacoes.filter(t => t.tipo !== 'entrada' && t.tipo !== 'transferencia')) {
    porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + t.valor;
  }
  const sorted = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);

  if (sorted.length > 0) {
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827').text('Gastos por Categoria');
    doc.moveDown(0.3);

    const barW = 300;
    for (const [cat, val] of sorted) {
      const pct = saidas > 0 ? val / saidas : 0;
      const label = CATEGORIA_LABELS[cat] || cat;
      const y = doc.y;

      doc.fontSize(10).font('Helvetica').fillColor('#374151').text(label, 40, y, { width: 120 });
      doc.rect(170, y + 1, barW * pct, 10).fillColor('#6366f1').fill();
      doc.rect(170, y + 1, barW, 10).strokeColor('#f3f4f6').lineWidth(0.5).stroke();
      doc.fontSize(9).font('Helvetica').fillColor('#374151').text(fmt(val), 480, y, { width: 80, align: 'right' });
      doc.fontSize(9).fillColor('#9ca3af').text(`${(pct * 100).toFixed(1)}%`, 480, y + 11, { width: 80, align: 'right' });
      doc.y = y + 22;
    }

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.5);
  }

  // Transactions table
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827').text('Transações');
  doc.moveDown(0.3);

  // Table header
  const tableY = doc.y;
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280');
  doc.text('Data', 40, tableY);
  doc.text('Descrição', 90, tableY);
  doc.text('Categoria', 300, tableY);
  doc.text('Tipo', 390, tableY);
  doc.text('Valor', 460, tableY, { width: 90, align: 'right' });

  doc.y = tableY + 14;
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e5e7eb').stroke();

  const txSorted = [...transacoes].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  for (const t of txSorted) {
    if (doc.y > 730) {
      doc.addPage();
      doc.y = 40;
    }
    const rowY = doc.y + 3;
    const isEntrada = t.tipo === 'entrada';
    const color = isEntrada ? '#16a34a' : '#dc2626';

    doc.fontSize(9).font('Helvetica').fillColor('#374151');
    const parts = t.data.split('-');
    const dataFmt = parts.length === 3 ? `${parts[2]}/${parts[1]}` : t.data;
    doc.text(dataFmt, 40, rowY, { width: 45 });
    doc.text(t.descricao.slice(0, 35), 90, rowY, { width: 205 });
    doc.text(CATEGORIA_LABELS[t.categoria] || t.categoria, 300, rowY, { width: 85 });
    doc.text(t.tipo === 'credito_cartao' ? 'Crédito' : t.tipo === 'debito' ? 'Débito' : t.tipo === 'entrada' ? 'Entrada' : 'Transf.', 390, rowY, { width: 65 });
    doc.fontSize(9).font('Helvetica-Bold').fillColor(color)
      .text(`${isEntrada ? '+' : '-'}${fmt(t.valor)}`, 460, rowY, { width: 90, align: 'right' });

    doc.y = rowY + 14;
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#f9fafb').lineWidth(0.3).stroke();
  }

  // Footer
  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica').fillColor('#9ca3af').text(
    `Gerado em ${new Date().toLocaleString('pt-BR')} · Fluxo — controle financeiro`,
    40, doc.y, { align: 'center', width: 515 }
  );

  return doc;
}
