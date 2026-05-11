import type { Categoria } from '@/types';

/**
 * Detecção de categoria por palavras-chave em pt-BR.
 * Cada chave é um padrão (substring lowercase) que mapeia pra uma categoria.
 * Ordem importa — o primeiro match vence.
 */
const KEYWORDS: Array<{ patterns: string[]; categoria: Categoria }> = [
  // Transporte
  { patterns: ['uber', '99 ', '99app', 'taxi', 'táxi', 'metro', 'metrô', 'ônibus', 'onibus', 'bilhete único', 'gasolina', 'combustível', 'combustivel', 'posto ipiranga', 'posto shell', 'estacionamento', 'pedágio', 'pedagio', 'cabify', 'indriver'], categoria: 'transporte' },

  // Alimentação
  { patterns: ['ifood', 'rappi', 'james delivery', 'mc donalds', 'mcdonalds', 'burger', 'subway', 'pizza', 'sushi', 'padaria', 'açougue', 'acougue', 'mercado', 'supermercado', 'extra ', 'pão de açúcar', 'pao de acucar', 'carrefour', 'assaí', 'assai', 'atacadão', 'atacadao', 'restaurante', 'lanchonete', 'cafeteria', 'starbucks', 'kfc'], categoria: 'alimentacao' },

  // Moradia
  { patterns: ['aluguel', 'condomínio', 'condominio', 'iptu', 'luz', 'energia', 'cemig', 'enel', 'água', 'agua', 'sabesp', 'copasa', 'internet', 'vivo fibra', 'claro net', 'gás', 'gas comgás', 'comgás', 'comgas'], categoria: 'moradia' },

  // Saúde
  { patterns: ['farmácia', 'farmacia', 'drogaria', 'droga raia', 'droga sil', 'drogasil', 'pacheco', 'consulta', 'médico', 'medico', 'dentista', 'hospital', 'plano de saúde', 'unimed', 'amil', 'bradesco saúde', 'sulamerica'], categoria: 'saude' },

  // Assinaturas
  { patterns: ['netflix', 'spotify', 'amazon prime', 'disney+', 'disney plus', 'hbo', 'globoplay', 'youtube premium', 'apple music', 'apple tv', 'icloud', 'google one', 'office 365', 'microsoft 365', 'adobe', 'notion', 'github copilot', 'chatgpt', 'openai'], categoria: 'assinaturas' },

  // Lazer
  { patterns: ['cinema', 'ingresso.com', 'cinemark', 'kinoplex', 'show', 'bar ', 'pub ', 'balada', 'steam', 'playstation', 'xbox', 'nintendo', 'parque', 'beto carrero'], categoria: 'lazer' },

  // Vestuário
  { patterns: ['zara', 'renner', 'c&a', 'cea', 'riachuelo', 'shein', 'nike', 'adidas', 'sapato', 'tênis', 'tenis', 'camiseta', 'roupa'], categoria: 'vestuario' },

  // Viagem
  { patterns: ['latam', 'gol linhas', 'azul linhas', 'booking', 'airbnb', 'hotel', 'pousada', 'passagem aérea', 'passagem aerea', 'hospedagem'], categoria: 'viagem' },

  // Educação
  { patterns: ['udemy', 'coursera', 'alura', 'rocketseat', 'curso ', 'livraria', 'amazon livros', 'kindle'], categoria: 'educacao' },

  // Investimento
  { patterns: ['investimento', 'tesouro direto', 'cdb', 'lci', 'lca', 'aplicação', 'aplicacao', 'rico', 'xp investimentos', 'nuinvest', 'aporte', 'binance', 'mercado bitcoin', 'btc'], categoria: 'investimento' },

  // Entrada — salário
  { patterns: ['salário', 'salario', 'folha de pagamento', 'pagamento mensal'], categoria: 'entrada_salario' },

  // Entrada — freelance
  { patterns: ['freela', 'freelance', 'projeto pj', 'consultoria'], categoria: 'entrada_freelance' },
];

/**
 * Detecta categoria pela descrição. Retorna `null` se nada bater.
 */
export function detectCategoria(descricao: string): Categoria | null {
  if (!descricao || descricao.trim().length < 3) return null;
  const lower = descricao.toLowerCase();
  for (const { patterns, categoria } of KEYWORDS) {
    for (const p of patterns) {
      if (lower.includes(p)) return categoria;
    }
  }
  return null;
}
