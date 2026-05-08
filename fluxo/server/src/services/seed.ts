import { v4 as uuid } from 'uuid';
import type {
  Conta, Cartao, Transacao, Fatura, RecorrenciaConfig,
  OrcamentoCategoria, Meta, Config, Categoria
} from '../types/index.js';
import { writeFile, readFile, fileExists } from './storage.js';

const hoje = new Date();
const anoAtual = hoje.getFullYear();
const mesAtual = hoje.getMonth() + 1;

function dataRelativa(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().split('T')[0];
}

function dataAbsoluta(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function gerarFaturaId(cartaoId: string, mes: number, ano: number): string {
  return `fat-${cartaoId.slice(0, 8)}-${ano}-${String(mes).padStart(2, '0')}`;
}

const DEFAULT_CONFIG: Config = {
  nomeUsuario: 'Usuário',
  moeda: 'BRL',
  limiteDiarioPadrao: 150,
  limiteDinamico: false,
  tema: 'fluxo',
  reservaInvestimento: 0,
  radarPeriodo: 6,
  taxaJurosCartoesGlobal: 15,
};

export async function seedIfEmpty(userId: string): Promise<void> {
  const configExists = await fileExists(userId, 'config.json');
  if (configExists) {
    const config = await readFile<Config | null>(userId, 'config.json', null);
    if (config) return; // Already seeded
  }

  // New users other than joao-aguiar get an empty account
  if (userId !== 'joao-aguiar') {
    await writeFile(userId, 'config.json', DEFAULT_CONFIG);
    await writeFile(userId, 'contas.json', []);
    await writeFile(userId, 'cartoes.json', []);
    await writeFile(userId, 'transacoes.json', []);
    await writeFile(userId, 'faturas.json', []);
    await writeFile(userId, 'recorrencias.json', []);
    await writeFile(userId, 'metas.json', []);
    await writeFile(userId, 'orcamento.json', []);
    console.log(`✅ Conta vazia criada para ${userId}`);
    return;
  }

  console.log(`🌱 Gerando dados iniciais para ${userId}...`);

  // ====== CONFIG ======
  const config: Config = {
    ...DEFAULT_CONFIG,
    nomeUsuario: 'JoaoAguiar',
  };

  // ====== CONTAS ======
  const contaNubank: Conta = {
    id: uuid(), nome: 'Nubank Conta', banco: 'Nubank',
    tipo: 'corrente', saldoInicial: 3200, cor: '#a78bfa',
    ativa: true, criadoEm: dataRelativa(90),
  };
  const contaInter: Conta = {
    id: uuid(), nome: 'Inter', banco: 'Inter',
    tipo: 'corrente', saldoInicial: 1850, cor: '#f97316',
    ativa: true, criadoEm: dataRelativa(90),
  };
  const contaCaixa: Conta = {
    id: uuid(), nome: 'Caixa Poupança', banco: 'Caixa',
    tipo: 'poupanca', saldoInicial: 8500, cor: '#60a5fa',
    ativa: true, criadoEm: dataRelativa(90),
  };
  const contas: Conta[] = [contaNubank, contaInter, contaCaixa];

  // ====== CARTÕES ======
  const cartaoNubank: Cartao = {
    id: uuid(), nome: 'Nubank', banco: 'Nubank', bandeira: 'Mastercard',
    ultimos4: '4521', limite: 5000, diaVencimento: 10, diaFechamento: 3,
    cor: '#a78bfa', ativa: true,
  };
  const cartaoInter: Cartao = {
    id: uuid(), nome: 'Inter Gold', banco: 'Inter', bandeira: 'Visa',
    ultimos4: '7832', limite: 8000, diaVencimento: 15, diaFechamento: 8,
    cor: '#f97316', ativa: true,
  };
  const cartaoC6: Cartao = {
    id: uuid(), nome: 'C6 Bank', banco: 'C6', bandeira: 'Mastercard',
    ultimos4: '2290', limite: 3000, diaVencimento: 8, diaFechamento: 1,
    cor: '#374151', ativa: true,
  };
  const cartoes: Cartao[] = [cartaoNubank, cartaoInter, cartaoC6];

  // ====== FATURAS ======
  const faturas: Fatura[] = [];
  for (const cartao of cartoes) {
    for (let offset = -2; offset <= 1; offset++) {
      let m = mesAtual + offset;
      let a = anoAtual;
      if (m <= 0) { m += 12; a--; }
      if (m > 12) { m -= 12; a++; }

      const fatId = gerarFaturaId(cartao.id, m, a);
      const isPast = offset < 0;
      faturas.push({
        id: fatId,
        cartaoId: cartao.id,
        mes: m,
        ano: a,
        dataVencimento: dataAbsoluta(a, m, cartao.diaVencimento),
        dataFechamento: dataAbsoluta(a, m, cartao.diaFechamento),
        status: isPast ? 'paga' : (offset === 0 ? 'aberta' : 'aberta'),
        dataPagamento: isPast ? dataAbsoluta(a, m, cartao.diaVencimento) : undefined,
        contaPagamentoId: isPast ? contaNubank.id : undefined,
      });
    }
  }

  // ====== RECORRÊNCIAS ======
  const recorrencias: RecorrenciaConfig[] = [
    {
      id: uuid(), descricao: 'Netflix', valor: 55.90, categoria: 'assinaturas',
      tipo: 'credito_cartao', cartaoId: cartaoNubank.id, diaCobranca: 15,
      ativa: true, inicioEm: dataRelativa(120),
    },
    {
      id: uuid(), descricao: 'Spotify', valor: 21.90, categoria: 'assinaturas',
      tipo: 'credito_cartao', cartaoId: cartaoNubank.id, diaCobranca: 20,
      ativa: true, inicioEm: dataRelativa(120),
    },
    {
      id: uuid(), descricao: 'Smart Fit', valor: 109.90, categoria: 'saude',
      tipo: 'debito', contaId: contaNubank.id, diaCobranca: 10,
      ativa: true, inicioEm: dataRelativa(90),
    },
    {
      id: uuid(), descricao: 'Amazon Prime', valor: 14.90, categoria: 'assinaturas',
      tipo: 'credito_cartao', cartaoId: cartaoInter.id, diaCobranca: 5,
      ativa: true, inicioEm: dataRelativa(150),
    },
    {
      id: uuid(), descricao: 'iCloud 200GB', valor: 14.90, categoria: 'assinaturas',
      tipo: 'credito_cartao', cartaoId: cartaoNubank.id, diaCobranca: 1,
      ativa: true, inicioEm: dataRelativa(200),
    },
    {
      id: uuid(), descricao: 'ChatGPT Plus', valor: 104.90, categoria: 'assinaturas',
      tipo: 'credito_cartao', cartaoId: cartaoInter.id, diaCobranca: 18,
      ativa: true, inicioEm: dataRelativa(60),
    },
  ];

  // ====== TRANSAÇÕES ======
  const transacoes: Transacao[] = [];
  const criarTx = (
    descricao: string, valor: number, tipo: Transacao['tipo'],
    categoria: Categoria, diasAtras: number,
    extra: Partial<Transacao> = {}
  ): Transacao => {
    const data = dataRelativa(diasAtras);
    const d = new Date(data);
    const txMes = d.getMonth() + 1;
    const txAno = d.getFullYear();

    let faturaId: string | undefined;
    if (tipo === 'credito_cartao' && extra.cartaoId) {
      const fat = faturas.find(f => f.cartaoId === extra.cartaoId && f.mes === txMes && f.ano === txAno);
      if (fat) faturaId = fat.id;
    }

    return {
      id: uuid(), descricao, valor, tipo, data, categoria,
      recorrente: false, criadoEm: data,
      faturaId,
      ...extra,
    };
  };

  // Salários (dia 5 de cada mês)
  transacoes.push(criarTx('Salário', 5500, 'entrada', 'entrada_salario', 1, { contaId: contaNubank.id }));
  transacoes.push(criarTx('Salário', 5500, 'entrada', 'entrada_salario', 31, { contaId: contaNubank.id }));
  transacoes.push(criarTx('Salário', 5500, 'entrada', 'entrada_salario', 62, { contaId: contaNubank.id }));

  // Freelances
  transacoes.push(criarTx('Freelance — Landing page', 1200, 'entrada', 'entrada_freelance', 12, { contaId: contaInter.id }));
  transacoes.push(criarTx('Freelance — Logo design', 800, 'entrada', 'entrada_freelance', 45, { contaId: contaInter.id }));

  // Débitos variados
  transacoes.push(criarTx('Supermercado Extra', 287.50, 'debito', 'alimentacao', 2, { contaId: contaNubank.id }));
  transacoes.push(criarTx('Padaria Pão Quente', 42.80, 'debito', 'alimentacao', 4, { contaId: contaNubank.id }));
  transacoes.push(criarTx('Uber — casa/trabalho', 32.90, 'debito', 'transporte', 3, { contaId: contaNubank.id }));
  transacoes.push(criarTx('Aluguel', 1200, 'debito', 'moradia', 5, { contaId: contaNubank.id }));
  transacoes.push(criarTx('Conta de Luz', 189.50, 'debito', 'moradia', 8, { contaId: contaInter.id }));
  transacoes.push(criarTx('Conta de Água', 75.30, 'debito', 'moradia', 10, { contaId: contaInter.id }));
  transacoes.push(criarTx('Internet Vivo', 119.99, 'debito', 'moradia', 7, { contaId: contaInter.id }));
  transacoes.push(criarTx('Farmácia Drogasil', 67.40, 'debito', 'saude', 6, { contaId: contaNubank.id }));
  transacoes.push(criarTx('Gasolina Shell', 180, 'debito', 'transporte', 9, { contaId: contaInter.id }));
  transacoes.push(criarTx('Supermercado Dia', 195.70, 'debito', 'alimentacao', 14, { contaId: contaNubank.id }));
  transacoes.push(criarTx('iFood Jantar', 56.90, 'debito', 'alimentacao', 1, { contaId: contaNubank.id }));

  // Mês anterior - débitos
  transacoes.push(criarTx('Aluguel', 1200, 'debito', 'moradia', 35, { contaId: contaNubank.id }));
  transacoes.push(criarTx('Supermercado Carrefour', 312.80, 'debito', 'alimentacao', 33, { contaId: contaNubank.id }));
  transacoes.push(criarTx('Uber Eats', 78.90, 'debito', 'alimentacao', 38, { contaId: contaNubank.id }));
  transacoes.push(criarTx('Gasolina Ipiranga', 195, 'debito', 'transporte', 40, { contaId: contaInter.id }));
  transacoes.push(criarTx('Consulta médica', 250, 'debito', 'saude', 42, { contaId: contaInter.id }));
  transacoes.push(criarTx('Conta de Luz', 175.30, 'debito', 'moradia', 37, { contaId: contaInter.id }));

  // 2 meses atrás
  transacoes.push(criarTx('Aluguel', 1200, 'debito', 'moradia', 65, { contaId: contaNubank.id }));
  transacoes.push(criarTx('Supermercado Atacadão', 420, 'debito', 'alimentacao', 60, { contaId: contaNubank.id }));

  // Crédito cartão — avista
  transacoes.push(criarTx('Restaurante Outback', 185, 'credito_cartao', 'alimentacao', 5, { cartaoId: cartaoNubank.id }));
  transacoes.push(criarTx('Livraria Cultura', 89.90, 'credito_cartao', 'educacao', 11, { cartaoId: cartaoNubank.id }));
  transacoes.push(criarTx('Cinema — ingressos', 56, 'credito_cartao', 'lazer', 7, { cartaoId: cartaoInter.id }));
  transacoes.push(criarTx('Zara — camiseta', 149.90, 'credito_cartao', 'vestuario', 13, { cartaoId: cartaoInter.id }));
  transacoes.push(criarTx('Posto BR', 210, 'credito_cartao', 'transporte', 3, { cartaoId: cartaoC6.id }));

  // Mês anterior no cartão
  transacoes.push(criarTx('Churrascaria Fogo de Chão', 320, 'credito_cartao', 'alimentacao', 35, { cartaoId: cartaoNubank.id }));
  transacoes.push(criarTx('Decathlon — tênis', 299.90, 'credito_cartao', 'vestuario', 40, { cartaoId: cartaoInter.id }));
  transacoes.push(criarTx('Bar — happy hour', 95, 'credito_cartao', 'lazer', 38, { cartaoId: cartaoC6.id }));

  // Parcelamentos
  const grupoIphone = uuid();
  for (let p = 1; p <= 12; p++) {
    const diasAtras = Math.max(0, 50 - (p - 1) * 30);
    if (diasAtras < 0) continue;
    transacoes.push(criarTx(`iPhone 15 — ${p}/12`, 416.58, 'credito_cartao', 'outros', Math.max(0, diasAtras), {
      cartaoId: cartaoInter.id,
      parcelamento: { total: 12, atual: p, grupoId: grupoIphone, valorTotal: 4999 },
    }));
    if (p >= 3) break; // Only create first 3 months of transactions
  }

  const grupoSofa = uuid();
  for (let p = 1; p <= 6; p++) {
    const diasAtras = Math.max(0, 40 - (p - 1) * 30);
    if (diasAtras < 0) continue;
    transacoes.push(criarTx(`Sofá Tok&Stok — ${p}/6`, 283.17, 'credito_cartao', 'moradia', Math.max(0, diasAtras), {
      cartaoId: cartaoNubank.id,
      parcelamento: { total: 6, atual: p, grupoId: grupoSofa, valorTotal: 1699 },
    }));
    if (p >= 2) break;
  }

  const grupoNotebook = uuid();
  for (let p = 1; p <= 10; p++) {
    const diasAtras = Math.max(0, 55 - (p - 1) * 30);
    if (diasAtras < 0) continue;
    transacoes.push(criarTx(`Notebook Dell — ${p}/10`, 379.90, 'credito_cartao', 'outros', Math.max(0, diasAtras), {
      cartaoId: cartaoC6.id,
      parcelamento: { total: 10, atual: p, grupoId: grupoNotebook, valorTotal: 3799 },
    }));
    if (p >= 2) break;
  }

  const grupoCurso = uuid();
  for (let p = 1; p <= 4; p++) {
    const diasAtras = Math.max(0, 30 - (p - 1) * 30);
    if (diasAtras < 0) continue;
    transacoes.push(criarTx(`Curso Alura — ${p}/4`, 112.25, 'credito_cartao', 'educacao', Math.max(0, diasAtras), {
      cartaoId: cartaoNubank.id,
      parcelamento: { total: 4, atual: p, grupoId: grupoCurso, valorTotal: 449 },
    }));
    if (p >= 1) break;
  }

  // Recorrentes como transações (últimos 2 meses)
  for (const rec of recorrencias) {
    for (let offset = 0; offset < 2; offset++) {
      const diasAtras = offset * 30 + (30 - rec.diaCobranca);
      if (diasAtras < 0 || diasAtras > 65) continue;
      transacoes.push(criarTx(rec.descricao, rec.valor, rec.tipo, rec.categoria, Math.max(0, diasAtras), {
        contaId: rec.contaId,
        cartaoId: rec.cartaoId,
        recorrente: true,
        recorrenciaId: rec.id,
      }));
    }
  }

  // Transferências
  transacoes.push(criarTx('Transferência para poupança', 500, 'transferencia', 'transferencia', 15, {
    contaId: contaNubank.id, contaDestinoId: contaCaixa.id,
  }));
  transacoes.push(criarTx('Transferência para Inter', 300, 'transferencia', 'transferencia', 20, {
    contaId: contaNubank.id, contaDestinoId: contaInter.id,
  }));

  // ====== METAS ======
  const metas: Meta[] = [
    {
      id: uuid(), nome: 'Reserva de Emergência', icone: '🛡️',
      valorAlvo: 30000, valorAtual: 8500, cor: '#34d399',
      contaVinculadaId: contaCaixa.id,
      status: 'ativa', criadoEm: dataRelativa(180),
      depositos: [
        { data: dataRelativa(60), valor: 1000, observacao: 'Depósito mensal' },
        { data: dataRelativa(30), valor: 1500, observacao: 'Bônus do trabalho' },
        { data: dataRelativa(5), valor: 500, observacao: 'Depósito mensal' },
      ],
    },
    {
      id: uuid(), nome: 'Viagem Europa', icone: '✈️',
      valorAlvo: 15000, valorAtual: 2300, cor: '#60a5fa',
      prazo: `${anoAtual}-12-31`,
      status: 'ativa', criadoEm: dataRelativa(120),
      depositos: [
        { data: dataRelativa(45), valor: 800 },
        { data: dataRelativa(15), valor: 500 },
      ],
    },
    {
      id: uuid(), nome: 'MacBook Pro', icone: '💻',
      valorAlvo: 12000, valorAtual: 4100, cor: '#a78bfa',
      status: 'ativa', criadoEm: dataRelativa(150),
      depositos: [
        { data: dataRelativa(50), valor: 2000 },
        { data: dataRelativa(20), valor: 1100 },
        { data: dataRelativa(3), valor: 1000 },
      ],
    },
  ];

  // ====== ORÇAMENTO ======
  const orcamento: OrcamentoCategoria[] = [
    { id: uuid(), categoria: 'moradia', limite: 1800, mes: mesAtual, ano: anoAtual, alertaPct: 80 },
    { id: uuid(), categoria: 'alimentacao', limite: 800, mes: mesAtual, ano: anoAtual, alertaPct: 80 },
    { id: uuid(), categoria: 'transporte', limite: 500, mes: mesAtual, ano: anoAtual, alertaPct: 80 },
    { id: uuid(), categoria: 'saude', limite: 400, mes: mesAtual, ano: anoAtual, alertaPct: 85 },
    { id: uuid(), categoria: 'lazer', limite: 300, mes: mesAtual, ano: anoAtual, alertaPct: 80 },
    { id: uuid(), categoria: 'assinaturas', limite: 350, mes: mesAtual, ano: anoAtual, alertaPct: 90 },
    { id: uuid(), categoria: 'vestuario', limite: 250, mes: mesAtual, ano: anoAtual, alertaPct: 80 },
    { id: uuid(), categoria: 'educacao', limite: 300, mes: mesAtual, ano: anoAtual, alertaPct: 80 },
  ];

  // ====== WRITE ALL ======
  await writeFile(userId, 'config.json', config);
  await writeFile(userId, 'contas.json', contas);
  await writeFile(userId, 'cartoes.json', cartoes);
  await writeFile(userId, 'transacoes.json', transacoes);
  await writeFile(userId, 'faturas.json', faturas);
  await writeFile(userId, 'recorrencias.json', recorrencias);
  await writeFile(userId, 'metas.json', metas);
  await writeFile(userId, 'orcamento.json', orcamento);

  console.log(`✅ Seed concluído para ${userId}: ${transacoes.length} transações, ${contas.length} contas, ${cartoes.length} cartões`);
}
