export interface User {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  criadoEm: string;
}

export type Categoria =
  | "moradia" | "alimentacao" | "transporte" | "saude"
  | "educacao" | "lazer" | "assinaturas" | "vestuario"
  | "viagem" | "investimento" | "outros"
  | "entrada_salario" | "entrada_freelance" | "entrada_outros"
  | "transferencia";

export interface Conta {
  id: string;
  nome: string;
  banco: string;
  tipo: "corrente" | "poupanca" | "investimento" | "dinheiro";
  saldoInicial: number;
  cor: string;
  ativa: boolean;
  criadoEm: string;
}

export interface Cartao {
  id: string;
  nome: string;
  banco: string;
  bandeira: "Visa" | "Mastercard" | "Elo" | "Amex" | "Hipercard";
  ultimos4: string;
  limite: number;
  diaVencimento: number;
  diaFechamento: number;
  cor: string;
  ativa: boolean;
  taxaJurosRotativo?: number;  // % ao mês para pagamento mínimo/parcial (padrão: usa global)
  taxaJurosParcela?: number;   // % ao mês para parcelamentos (padrão: 0)
}

export interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: "debito" | "credito_cartao" | "entrada" | "transferencia";
  data: string;
  categoria: Categoria;
  contaId?: string;
  contaDestinoId?: string;
  cartaoId?: string;
  faturaId?: string;
  recorrente: boolean;
  recorrenciaId?: string;
  parcelamento?: {
    total: number;
    atual: number;
    grupoId: string;
    valorTotal: number;
  };
  observacao?: string;
  tags?: string[];
  criadoEm: string;
}

export interface Fatura {
  id: string;
  cartaoId: string;
  mes: number;
  ano: number;
  dataVencimento: string;
  dataFechamento: string;
  status: "aberta" | "fechada" | "paga" | "vencida" | "parcial";
  dataPagamento?: string;
  contaPagamentoId?: string;
  valorPago?: number;                // valor efetivamente pago
  saldoAnteriorRollover?: number;    // dívida rolada da fatura anterior (já com juros)
  jurosAplicados?: number;           // juros cobrados sobre o rollover desta fatura
  taxaJurosAplicada?: number;        // taxa % usada ao pagar parcialmente
}

export interface RecorrenciaConfig {
  id: string;
  descricao: string;
  valor: number;
  categoria: Categoria;
  tipo: "debito" | "credito_cartao" | "entrada";
  contaId?: string;
  cartaoId?: string;
  diaCobranca: number;
  ativa: boolean;
  inicioEm: string;
  fimEm?: string;
}

export interface OrcamentoCategoria {
  id: string;
  categoria: Categoria;
  limite: number;
  mes: number;
  ano: number;
  alertaPct: number;
}

export interface Meta {
  id: string;
  nome: string;
  descricao?: string;
  valorAlvo: number;
  valorAtual: number;
  depositos: Array<{ data: string; valor: number; observacao?: string }>;
  contaVinculadaId?: string;
  prazo?: string;
  cor: string;
  icone: string;
  status: "ativa" | "concluida" | "pausada";
  criadoEm: string;
}

export interface Config {
  nomeUsuario: string;
  moeda: string;
  limiteDiarioPadrao: number;
  limiteDinamico: boolean;
  tema: "fluxo" | "emerald" | "ocean" | "sunset";
  reservaInvestimento: number;
  radarPeriodo: number;
  taxaJurosCartoesGlobal: number; // % ao mês padrão para todos os cartões (ex: 15)
}

export interface CategoriaCustom {
  id: string;
  nome: string;
  label: string;
  cor: string;
  icone: string;
  criadoEm: string;
}

export interface Alerta {
  tipo: "danger" | "warn" | "info" | "ok";
  mensagem: string;
  acao?: string;
}

export interface DashboardData {
  saldoTotal: number;
  totalEntradas: number;
  totalSaidas: number;
  totalFaturasMes: number;
  score: number;
  scoreLabel: string;
  taxaPoupanca: number;
  alertas: Alerta[];
  saldoDiario: Array<{ dia: number; saldo: number }>;
  gastosPorCategoria: Array<{ categoria: Categoria; total: number }>;
  proximasSaidas: Transacao[];
  contasSaldo: Array<{ conta: Conta; saldoAtual: number }>;
  faturasAbertas: Array<{
    cartao: Cartao;
    fatura: Fatura;
    total: number;
    diasParaVencer: number;
    limiteDisponivelReal: number;
  }>;
  patrimonioHistorico: Array<{ data: string; saldo: number }>;
  regra503020: {
    necessidades: { gasto: number; ideal: number };
    desejos: { gasto: number; ideal: number };
    poupanca: { gasto: number; ideal: number };
  };
  limiteDiarioDinamico: number;
  detalhesLimiteDiario?: {
    diasRestantes: number;
    valorPorDia: number;
    saldoLivreRestante: number;
  };
  projecaoRadar: Array<{
    mes: number;
    ano: number;
    saldoProjetado: number;
    entradas: number;
    saidas: number;
    poupanca: number;
    breakdown: {
      parcelas: number;
      recorrencias: number;
      fixas: number;
      estimativas: number;
    }
  }>;
  projecaoDiaria30Dias?: Array<{ data: string; saldo: number; tipo: 'real' | 'projetado' }>;
}
