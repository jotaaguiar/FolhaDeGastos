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
  limiteChequeEspecial?: number;
  taxaJurosChequeEspecial?: number;
  diaCobrancaJuros?: number;
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
  taxaJurosRotativo?: number;
  taxaJurosParcela?: number;
  // Computed by server — card-wide limit metrics
  limiteUsadoTotal?: number;
  limiteDisponivelReal?: number;
  limiteDisponivelProjetado?: number;
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
  status: "aberta" | "fechada" | "paga" | "vencida" | "parcial" | "futura";
  dataPagamento?: string;
  contaPagamentoId?: string;
  valorPago?: number;
  saldoAnteriorRollover?: number;
  valorAjuste?: number;
  jurosAplicados?: number;
  taxaJurosAplicada?: number;
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
  pulosManual?: string[];
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
  tema: string;
  reservaInvestimento: number;
  radarPeriodo: number;
  taxaJurosCartoesGlobal: number;
  regra503020Ativa: boolean;
  regra503020Necessidades: number;
  regra503020Desejos: number;
  regra503020Poupanca: number;
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
    limiteUsadoTotal: number;
    limiteDisponivelReal: number;
    limiteDisponivelProjetado: number;
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
    };
  }>;
  projecaoDiaria30Dias?: Array<{ data: string; saldo: number; tipo: 'real' | 'projetado' }>;
}
