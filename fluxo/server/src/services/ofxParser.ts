export interface ParsedTransaction {
  externalId: string;  // FITID from OFX
  data: string;        // YYYY-MM-DD
  descricao: string;
  valor: number;       // positive = credit, negative = debit
  tipo: 'debito' | 'entrada';
}

export function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // OFX is SGML-like; extract STMTTRN blocks
  const blocks = content.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi);

  for (const block of blocks) {
    const body = block[1];
    const get = (tag: string) => {
      const m = body.match(new RegExp(`<${tag}>([^<\n\r]+)`, 'i'));
      return m ? m[1].trim() : '';
    };

    const fitid = get('FITID') || get('REFNUM') || `${Date.now()}-${Math.random()}`;
    const rawDate = get('DTPOSTED') || get('DTUSER');
    const rawVal = get('TRNAMT');
    const memo = get('MEMO') || get('NAME') || get('TRNTYPE') || 'Transação';

    if (!rawDate || !rawVal) continue;

    // Parse date: YYYYMMDDHHMMSS or YYYYMMDD
    const year = rawDate.substring(0, 4);
    const month = rawDate.substring(4, 6);
    const day = rawDate.substring(6, 8);
    const data = `${year}-${month}-${day}`;

    const valor = parseFloat(rawVal.replace(',', '.'));
    if (isNaN(valor)) continue;

    transactions.push({
      externalId: fitid,
      data,
      descricao: memo,
      valor: Math.abs(valor),
      tipo: valor >= 0 ? 'entrada' : 'debito',
    });
  }

  // Fallback: headerless OFX (older format without XML tags)
  if (transactions.length === 0) {
    const lines = content.split(/\r?\n/);
    let current: Partial<ParsedTransaction & { rawDate: string; rawVal: string; fitid: string }> = {};
    for (const line of lines) {
      const [tag, val] = line.split(':').map(s => s.trim());
      if (!tag || !val) continue;
      if (tag === 'FITID') current.fitid = val;
      if (tag === 'DTPOSTED' || tag === 'DTUSER') current.rawDate = val;
      if (tag === 'TRNAMT') current.rawVal = val;
      if (tag === 'MEMO' || tag === 'NAME') current.descricao = val;
      if (tag === 'TRNTYPE' && !current.descricao) current.descricao = val;
      if (tag === '</STMTTRN' || tag === 'FITID' && current.rawDate) {
        if (current.rawDate && current.rawVal) {
          const year = current.rawDate.substring(0, 4);
          const month = current.rawDate.substring(4, 6);
          const day = current.rawDate.substring(6, 8);
          const valor = parseFloat((current.rawVal || '0').replace(',', '.'));
          transactions.push({
            externalId: current.fitid || `${Date.now()}-${Math.random()}`,
            data: `${year}-${month}-${day}`,
            descricao: current.descricao || 'Transação',
            valor: Math.abs(valor),
            tipo: valor >= 0 ? 'entrada' : 'debito',
          });
          current = {};
        }
      }
    }
  }

  return transactions;
}
