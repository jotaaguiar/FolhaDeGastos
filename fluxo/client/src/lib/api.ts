const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export function getToken(): string | null {
  return localStorage.getItem('fluxo_token');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Health
  health: () => request<{ ok: boolean; version: string }>('/health'),

  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ id: string; username: string; email?: string }>('/auth/me'),
  updateEmail: (email: string) =>
    request<{ ok: boolean }>('/auth/me/email', { method: 'PUT', body: JSON.stringify({ email }) }),
  forgotPassword: (email: string) =>
    request<{ ok: boolean }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    request<{ ok: boolean }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),

  // Dashboard
  dashboard: (mes: number, ano: number) =>
    request<import('@/types').DashboardData>(`/dashboard?mes=${mes}&ano=${ano}`),

  // Contas
  getContas: () => request<import('@/types').Conta[]>('/contas'),
  createConta: (data: Partial<import('@/types').Conta>) =>
    request<import('@/types').Conta>('/contas', { method: 'POST', body: JSON.stringify(data) }),
  updateConta: (id: string, data: Partial<import('@/types').Conta>) =>
    request<import('@/types').Conta>(`/contas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConta: (id: string) =>
    request<{ ok: boolean }>(`/contas/${id}`, { method: 'DELETE' }),
  updateSaldoConta: (id: string, saldo: number) =>
    request<import('@/types').Conta>(`/contas/${id}/saldo`, { method: 'PATCH', body: JSON.stringify({ saldo }) }),

  // Cartões
  getCartoes: (mes?: number, ano?: number) => {
    const q = new URLSearchParams();
    if (mes) q.set('mes', String(mes));
    if (ano) q.set('ano', String(ano));
    const qs = q.toString();
    return request<import('@/types').Cartao[]>(`/cartoes${qs ? '?' + qs : ''}`);
  },
  createCartao: (data: Partial<import('@/types').Cartao>) =>
    request<import('@/types').Cartao>('/cartoes', { method: 'POST', body: JSON.stringify(data) }),
  updateCartao: (id: string, data: Partial<import('@/types').Cartao>) =>
    request<import('@/types').Cartao>(`/cartoes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCartao: (id: string) =>
    request<{ ok: boolean }>(`/cartoes/${id}`, { method: 'DELETE' }),

  // Transações
  getTransacoes: (params?: { mes?: number; ano?: number; contaId?: string; cartaoId?: string; categoria?: string; tipo?: string; tag?: string }) => {
    const q = new URLSearchParams();
    if (params?.mes) q.set('mes', String(params.mes));
    if (params?.ano) q.set('ano', String(params.ano));
    if (params?.contaId) q.set('contaId', params.contaId);
    if (params?.cartaoId) q.set('cartaoId', params.cartaoId);
    if (params?.categoria) q.set('categoria', params.categoria);
    if (params?.tipo) q.set('tipo', params.tipo);
    if (params?.tag) q.set('tag', params.tag);
    return request<import('@/types').Transacao[]>(`/transacoes?${q.toString()}`);
  },
  getTags: () => request<string[]>('/transacoes/tags'),
  createTransacao: (data: Partial<import('@/types').Transacao>) =>
    request<import('@/types').Transacao>('/transacoes', { method: 'POST', body: JSON.stringify(data) }),
  updateTransacao: (id: string, data: Partial<import('@/types').Transacao>) =>
    request<import('@/types').Transacao>(`/transacoes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransacao: (id: string) =>
    request<{ ok: boolean }>(`/transacoes/${id}`, { method: 'DELETE' }),
  criarParcelamento: (data: { descricao: string; valorTotal: number; parcelas: number; cartaoId: string; categoria: string; mesInicio: number; anoInicio: number }) =>
    request<{ ok: boolean; criadas: number; grupoId: string }>('/transacoes/parcelamento', { method: 'POST', body: JSON.stringify(data) }),

  // Faturas
  getFaturas: (params?: { cartaoId?: string; mes?: number; ano?: number }) => {
    const q = new URLSearchParams();
    if (params?.cartaoId) q.set('cartaoId', params.cartaoId);
    if (params?.mes) q.set('mes', String(params.mes));
    if (params?.ano) q.set('ano', String(params.ano));
    return request<(import('@/types').Fatura & { total: number; cartao?: import('@/types').Cartao; limiteUsadoTotal: number; limiteDisponivelReal: number; limiteDisponivelProjetado: number })[]>(`/faturas?${q.toString()}`);
  },
  getFatura: (id: string) =>
    request<import('@/types').Fatura & { total: number; cartao?: import('@/types').Cartao }>(`/faturas/${id}`),
  getFaturaTransacoes: (id: string) =>
    request<import('@/types').Transacao[]>(`/faturas/${id}/transacoes`),
  pagarFatura: (id: string, data: { contaPagamentoId: string; dataPagamento?: string; valorPago?: number; taxaJuros?: number }) =>
    request<import('@/types').Fatura>(`/faturas/${id}/pagar`, { method: 'POST', body: JSON.stringify(data) }),
  fecharFatura: (id: string) =>
    request<import('@/types').Fatura>(`/faturas/${id}/fechar`, { method: 'POST' }),
  updateFatura: (id: string, data: Partial<import('@/types').Fatura>) =>
    request<import('@/types').Fatura>(`/faturas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  gerarFaturas: (meses?: number) =>
    request<{ ok: boolean; criadas: number }>('/faturas/gerar', { method: 'POST', body: JSON.stringify({ meses: meses ?? 3 }) }),

  // Recorrências
  getRecorrencias: () => request<import('@/types').RecorrenciaConfig[]>('/recorrencias'),
  createRecorrencia: (data: Partial<import('@/types').RecorrenciaConfig>) =>
    request<import('@/types').RecorrenciaConfig>('/recorrencias', { method: 'POST', body: JSON.stringify(data) }),
  updateRecorrencia: (id: string, data: Partial<import('@/types').RecorrenciaConfig>) =>
    request<import('@/types').RecorrenciaConfig>(`/recorrencias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecorrencia: (id: string) =>
    request<{ ok: boolean }>(`/recorrencias/${id}`, { method: 'DELETE' }),
  toggleRecorrencia: (id: string) =>
    request<import('@/types').RecorrenciaConfig>(`/recorrencias/${id}/toggle`, { method: 'PATCH' }),
  processarRecorrencias: () =>
    request<{ ok: boolean; criadas: number }>('/recorrencias/processar', { method: 'POST' }),

  // Orçamento
  getOrcamento: (mes: number, ano: number) =>
    request<(import('@/types').OrcamentoCategoria & { gasto: number })[]>(`/orcamento?mes=${mes}&ano=${ano}`),
  createOrcamento: (data: Partial<import('@/types').OrcamentoCategoria>) =>
    request<import('@/types').OrcamentoCategoria>('/orcamento', { method: 'POST', body: JSON.stringify(data) }),
  updateOrcamento: (id: string, data: Partial<import('@/types').OrcamentoCategoria>) =>
    request<import('@/types').OrcamentoCategoria>(`/orcamento/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrcamento: (id: string) =>
    request<{ ok: boolean }>(`/orcamento/${id}`, { method: 'DELETE' }),

  // Metas
  getMetas: () => request<import('@/types').Meta[]>('/metas'),
  createMeta: (data: Partial<import('@/types').Meta>) =>
    request<import('@/types').Meta>('/metas', { method: 'POST', body: JSON.stringify(data) }),
  updateMeta: (id: string, data: Partial<import('@/types').Meta>) =>
    request<import('@/types').Meta>(`/metas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMeta: (id: string) =>
    request<{ ok: boolean }>(`/metas/${id}`, { method: 'DELETE' }),
  depositarMeta: (id: string, data: { valor: number; observacao?: string }) =>
    request<import('@/types').Meta>(`/metas/${id}/deposito`, { method: 'POST', body: JSON.stringify(data) }),
  updateMetaStatus: (id: string, status: string) =>
    request<import('@/types').Meta>(`/metas/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Relatórios PDF
  downloadRelatorioPDF: (mes: number, ano: number) => {
    const token = getToken();
    return fetch(`${API_BASE}/relatorios/mensal?mes=${mes}&ano=${ano}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(async r => {
      if (!r.ok) throw new Error('Erro ao gerar PDF');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const mesLabel = new Date(ano, mes - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(' de ', '-').replace(' ', '-');
      a.href = url;
      a.download = `fluxo-${mesLabel}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  },

  // Comparativo
  getComparativo: (passados?: number, futuros?: number) =>
    request<Array<{ mes: number; ano: number; label: string; entradas: number; saidas: number; saldo: number; porCategoria: Record<string, number>; projetado: boolean }>>(`/comparativo?passados=${passados ?? 6}&futuros=${futuros ?? 3}`),

  // Importação OFX/CSV
  importacaoPreview: (file: File, contaId?: string, cartaoId?: string) => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    if (contaId) form.append('contaId', contaId);
    if (cartaoId) form.append('cartaoId', cartaoId);
    return fetch(`${API_BASE}/importacao/preview`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(async r => {
      if (!r.ok) { const e = await r.json().catch(() => ({ error: 'Erro' })); throw new Error(e.error); }
      return r.json() as Promise<{ total: number; novas: number; duplicatas: number; items: Array<{ externalId: string; data: string; descricao: string; valor: number; tipo: 'debito' | 'entrada'; duplicata: boolean; transacaoExistenteId?: string }> }>;
    });
  },
  importacaoConfirmar: (items: unknown[], contaId?: string, cartaoId?: string, categoria?: string) =>
    request<{ ok: boolean; criadas: number }>('/importacao/confirmar', {
      method: 'POST',
      body: JSON.stringify({ items, contaId, cartaoId, categoria }),
    }),

  // Categorias customizadas
  getCategorias: () => request<import('@/types').CategoriaCustom[]>('/categorias'),
  createCategoria: (data: { label: string; cor?: string; icone?: string }) =>
    request<import('@/types').CategoriaCustom>('/categorias', { method: 'POST', body: JSON.stringify(data) }),
  updateCategoria: (id: string, data: Partial<import('@/types').CategoriaCustom>) =>
    request<import('@/types').CategoriaCustom>(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategoria: (id: string) =>
    request<{ ok: boolean }>(`/categorias/${id}`, { method: 'DELETE' }),

  // Config
  getConfig: () => request<import('@/types').Config>('/config'),
  updateConfig: (data: Partial<import('@/types').Config>) =>
    request<import('@/types').Config>('/config', { method: 'PUT', body: JSON.stringify(data) }),
  wipeData: () => request<{ ok: boolean }>('/config/wipe', { method: 'POST' }),
  importData: (data: object) => request<{ ok: boolean }>('/config/import', { method: 'POST', body: JSON.stringify(data) }),
};
