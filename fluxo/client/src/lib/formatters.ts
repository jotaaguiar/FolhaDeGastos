export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR');
}

export function formatDateShort(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatCompact(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toFixed(0);
}

export function getMesNome(mes: number): string {
  const nomes = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return nomes[mes] || '';
}

export function getMesAbrev(mes: number): string {
  const nomes = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return nomes[mes] || '';
}

export function getDiaSemana(date: string): string {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return dias[new Date(date + 'T12:00:00').getDay()];
}

export function getCategoriaLabel(cat: string): string {
  const labels: Record<string, string> = {
    moradia: 'Moradia', alimentacao: 'Alimentação', transporte: 'Transporte',
    saude: 'Saúde', educacao: 'Educação', lazer: 'Lazer',
    assinaturas: 'Assinaturas', vestuario: 'Vestuário', viagem: 'Viagem',
    investimento: 'Investimento', outros: 'Outros',
    entrada_salario: 'Salário', entrada_freelance: 'Freelance',
    entrada_outros: 'Outras Entradas', transferencia: 'Transferência',
  };
  return labels[cat] || cat;
}

export function getCategoriaColor(cat: string): string {
  const colors: Record<string, string> = {
    moradia: '#60a5fa', alimentacao: '#34d399', transporte: '#fbbf24',
    saude: '#fb7185', educacao: '#a78bfa', lazer: '#f472b6',
    assinaturas: '#2dd4bf', vestuario: '#f97316', viagem: '#818cf8',
    investimento: '#22d3ee', outros: '#6b6890',
    entrada_salario: '#34d399', entrada_freelance: '#2dd4bf',
    entrada_outros: '#60a5fa', transferencia: '#6b6890',
  };
  return colors[cat] || '#6b6890';
}

export function getCategoriaIcon(cat: string): string {
  const icons: Record<string, string> = {
    moradia: '🏠', alimentacao: '🍽️', transporte: '🚗',
    saude: '💊', educacao: '📚', lazer: '🎮',
    assinaturas: '📱', vestuario: '👕', viagem: '✈️',
    investimento: '📈', outros: '📦',
    entrada_salario: '💰', entrada_freelance: '💻',
    entrada_outros: '💵', transferencia: '🔄',
  };
  return icons[cat] || '📦';
}

export function getBandeiraLabel(bandeira: string): string {
  return bandeira;
}
