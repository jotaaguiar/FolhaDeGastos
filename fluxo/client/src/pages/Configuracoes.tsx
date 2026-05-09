import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAlert } from '@/context/AlertContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useCartoes } from '@/hooks/useCartoes';
import { api } from '@/lib/api';
import { Settings, Download, Upload, Trash2, Info, FileSpreadsheet, CreditCard, Percent, Plus, X, Layers, Mail } from 'lucide-react';
import type { Cartao } from '@/types';
import { useCategorias } from '@/hooks/useCategorias';
import { useAuth } from '@/context/AuthContext';

export default function Configuracoes() {
  const { config, atualizarConfig } = useApp();
  const { addToast } = useAlert();
  const { confirm } = useConfirm();
  const { cartoes, update: updateCartao } = useCartoes();
  const { user } = useAuth();
  const { custom: customCats, create: createCat, remove: removeCat } = useCategorias();
  const [novaCatLabel, setNovaCatLabel] = useState('');
  const [novaCatCor, setNovaCatCor] = useState('#6366f1');
  const [novaCatIcone, setNovaCatIcone] = useState('📂');
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState(config?.nomeUsuario || '');
  const [limite, setLimite] = useState(config?.limiteDiarioPadrao?.toString() || '150');
  const [limiteDinamico, setLimiteDinamico] = useState(config?.limiteDinamico ?? false);
  const [reserva, setReserva] = useState(config?.reservaInvestimento?.toString() || '0');
  const [radarPeriodo, setRadarPeriodo] = useState(config?.radarPeriodo?.toString() || '6');
  const [tema, setTema] = useState<string>(config?.tema || 'escuro');
  const [taxaJurosGlobal, setTaxaJurosGlobal] = useState(config?.taxaJurosCartoesGlobal?.toString() || '15');
  const [taxasIndividuais, setTaxasIndividuais] = useState<Record<string, string>>({});

  // Sync form state when config loads (useState initializer only runs once,
  // but config may be null on first render if the API hasn't responded yet)
  useEffect(() => {
    if (!config) return;
    setNome(config.nomeUsuario || '');
    setLimite(config.limiteDiarioPadrao?.toString() || '150');
    setLimiteDinamico(config.limiteDinamico ?? false);
    setReserva(config.reservaInvestimento?.toString() || '0');
    setRadarPeriodo(config.radarPeriodo?.toString() || '6');
    setTema(config.tema || 'escuro');
    setTaxaJurosGlobal(config.taxaJurosCartoesGlobal?.toString() || '15');
  }, [config]);

  const salvar = async () => {
    try {
      await atualizarConfig({
        nomeUsuario: nome,
        limiteDiarioPadrao: parseFloat(limite) || 150,
        limiteDinamico,
        reservaInvestimento: parseFloat(reserva) || 0,
        radarPeriodo: parseInt(radarPeriodo) || 6,
        tema,
        taxaJurosCartoesGlobal: parseFloat(taxaJurosGlobal) || 15,
      });
      // Save individual card rates
      const updates = Object.entries(taxasIndividuais);
      await Promise.all(updates.map(([cardId, taxa]) =>
        updateCartao(cardId, { taxaJurosRotativo: parseFloat(taxa) || undefined })
      ));
      addToast('success', 'Configurações salvas!');
    } catch { addToast('error', 'Erro ao salvar'); }
  };

  const exportarJSON = async () => {
    try {
      const [contas, cartoes, transacoes, faturas, recorrencias, metas, orcamento, cfg] = await Promise.all([
        api.getContas(), api.getCartoes(), api.getTransacoes({}), api.getFaturas({}),
        api.getRecorrencias(), api.getMetas(), api.getOrcamento(new Date().getMonth() + 1, new Date().getFullYear()),
        api.getConfig(),
      ]);
      const data = { contas, cartoes, transacoes, faturas, recorrencias, metas, orcamento, config: cfg, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `fluxo-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
      addToast('success', 'Backup JSON exportado!');
    } catch { addToast('error', 'Erro ao exportar'); }
  };

  const exportarCSV = async () => {
    try {
      const [transacoes, contas, cartoes] = await Promise.all([
        api.getTransacoes({}), api.getContas(), api.getCartoes(),
      ]);
      const header = 'Data,Descrição,Tipo,Categoria,Valor,Conta,Cartão,Parcelamento';
      const rows = transacoes.map(t => {
        const conta = contas.find(c => c.id === t.contaId)?.nome ?? '';
        const cartao = cartoes.find(c => c.id === t.cartaoId)?.nome ?? '';
        const parcela = t.parcelamento ? `${t.parcelamento.atual}/${t.parcelamento.total}` : '';
        const sinal = t.tipo === 'entrada' ? '' : '-';
        return [
          t.data,
          `"${t.descricao.replace(/"/g, '""')}"`,
          t.tipo,
          t.categoria,
          `${sinal}${t.valor.toFixed(2)}`,
          `"${conta}"`,
          `"${cartao}"`,
          parcela,
        ].join(',');
      });
      const csv = [header, ...rows].join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `fluxo-transacoes-${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      addToast('success', 'Planilha CSV exportada!');
    } catch { addToast('error', 'Erro ao exportar CSV'); }
  };

  const importar = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (!await confirm('Isso substituirá TODOS os dados atuais. Esta ação não pode ser desfeita.', { title: 'Importar backup?', danger: true, confirmLabel: 'Importar' })) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await api.importData(data);
        addToast('success', 'Backup restaurado! Recarregando...');
        setTimeout(() => window.location.reload(), 1200);
      } catch { addToast('error', 'Arquivo inválido ou erro ao restaurar'); }
    };
    input.click();
  };

  const limpar = async () => {
    if (!await confirm('Todos os dados serão apagados permanentemente. Esta ação NÃO pode ser desfeita.', { title: 'Apagar todos os dados?', danger: true, confirmLabel: 'Apagar tudo' })) return;
    try {
      await api.wipeData();
      addToast('success', 'Dados apagados com sucesso!');
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      addToast('error', 'Erro ao apagar os dados');
    }
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      {/* General */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-brand-primary" />
          <h3 className="text-lg font-bold">Geral</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted font-mono block mb-1">Nome do Usuário</label>
            <input className="input-dark w-full" value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted font-mono block mb-1">Moeda</label>
            <input className="input-dark w-full" value="BRL (Real Brasileiro)" disabled />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted font-mono block mb-1">Limite Diário (R$)</label>
              <input className="input-dark w-full" type="number" value={limite} onChange={e => setLimite(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted font-mono block mb-1">Reserva IA (R$)</label>
              <input className="input-dark w-full" type="number" value={reserva} onChange={e => setReserva(e.target.value)}
                placeholder="Ex: 500" />
            </div>
            <div>
              <label className="text-xs text-muted font-mono block mb-1">Radar (Meses)</label>
              <select className="input-dark w-full" value={radarPeriodo} onChange={e => setRadarPeriodo(e.target.value)}>
                <option value="3">3 Meses</option>
                <option value="6">6 Meses</option>
                <option value="12">12 Meses</option>
                <option value="24">24 Meses</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-s2 border border-white/[0.05]">
            <div>
              <p className="text-sm font-medium">Limite Diário Dinâmico</p>
              <p className="text-xs text-muted">Ajusta o limite baseado no saldo livre restante</p>
            </div>
            <button
              onClick={() => setLimiteDinamico(!limiteDinamico)}
              className={`w-12 h-6 rounded-full transition-all relative ${limiteDinamico ? 'bg-brand-primary' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${limiteDinamico ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          <div>
            <label className="text-xs text-muted font-mono block mb-3">Tema da Interface</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {([
                { id: 'escuro', label: 'Midnight', icon: '🌙', color: '#a78bfa', desc: 'Clássico Escuro' },
                { id: 'emerald', label: 'Emerald', icon: '🌲', color: '#10b981', desc: 'Verde Floresta' },
                { id: 'ocean', label: 'Oceanic', icon: '🌊', color: '#0ea5e9', desc: 'Azul Profundo' },
                { id: 'sunset', label: 'Sunset', icon: '🌆', color: '#f43f5e', desc: 'Rosa Crepúsculo' },
                { id: 'claro', label: 'Aurora', icon: '☀️', color: '#6d28d9', desc: 'Modo Claro' },
              ] as const).map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTema(t.id);
                    const root = document.documentElement;
                    root.classList.forEach(cls => {
                      if (cls.startsWith('theme-')) root.classList.remove(cls);
                    });
                    root.classList.add(`theme-${t.id}`);
                    if (t.id === 'claro') root.classList.remove('dark');
                    else root.classList.add('dark');
                  }}
                  className={`relative p-3 rounded-xl border-2 transition-all text-left overflow-hidden group ${
                    tema === t.id
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-white/10 hover:border-white/20 bg-s2/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xl">{t.icon}</div>
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: t.color }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-tight">{t.label}</p>
                  <p className="text-[9px] text-muted leading-tight mt-0.5">{t.desc}</p>
                  {tema === t.id && (
                    <div className="absolute top-0 right-0 p-1">
                      <div className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_8px_var(--brand-glow)]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button onClick={salvar} className="btn-primary w-full">Salvar Alterações</button>
        </div>
      </div>

      {/* E-mail */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={18} className="text-brand-primary" />
          <h3 className="text-lg font-bold">E-mail & Segurança</h3>
        </div>
        <div className="space-y-3">
          <p className="text-xs text-muted">Cadastre seu e-mail para recuperação de senha.</p>
          <div className="flex gap-2">
            <input
              className="input-dark flex-1"
              type="email"
              placeholder={`E-mail atual: ${user?.email || 'não cadastrado'}`}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button
              onClick={async () => {
                if (!email.trim()) return;
                try {
                  await api.updateEmail(email.trim());
                  addToast('success', 'E-mail atualizado!');
                  setEmail('');
                } catch { addToast('error', 'Erro ao atualizar e-mail'); }
              }}
              className="btn-primary"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>

      {/* Cartões — Juros */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-brand-primary" />
          <h3 className="text-lg font-bold">Cartões & Juros</h3>
        </div>
        <div className="space-y-4">
          {/* Global rate */}
          <div className="p-4 rounded-xl bg-fluxo-amber/5 border border-fluxo-amber/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Percent size={16} className="text-fluxo-amber" />
                <div>
                  <p className="text-sm font-medium">Taxa de Juros Rotativa Global</p>
                  <p className="text-[10px] text-muted">Aplicada a todos os cartões sem taxa individual definida</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="input-dark w-24 text-right font-mono"
                  type="number"
                  step="0.1"
                  value={taxaJurosGlobal}
                  onChange={e => setTaxaJurosGlobal(e.target.value)}
                />
                <span className="text-sm text-muted font-mono">% a.m.</span>
              </div>
            </div>
            <p className="text-[10px] text-muted">
              Referência: Juros Rotativo médio no Brasil em 2024 é ~15-18% a.m. (Banco Central)
            </p>
          </div>

          {/* Per-card rates */}
          {cartoes.length > 0 && (
            <div className="space-y-2">
              <p className="label-mono">Taxa Individual por Cartão</p>
              <p className="text-[10px] text-muted">Deixe em branco para usar a taxa global acima</p>
              {cartoes.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-s2 border border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: c.cor }} />
                    <div>
                      <p className="text-sm font-medium">{c.nome}</p>
                      <p className="text-[10px] text-muted font-mono">{c.banco} •••• {c.ultimos4} • fecha dia {c.diaFechamento} • vence dia {c.diaVencimento}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="input-dark w-20 text-right font-mono text-sm"
                      type="number"
                      step="0.1"
                      placeholder={taxaJurosGlobal}
                      value={taxasIndividuais[c.id] ?? (c.taxaJurosRotativo !== undefined ? String(c.taxaJurosRotativo) : '')}
                      onChange={e => setTaxasIndividuais(prev => ({ ...prev, [c.id]: e.target.value }))}
                    />
                    <span className="text-xs text-muted font-mono">%</span>
                    {c.taxaJurosRotativo !== undefined && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary font-mono">individual</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={salvar} className="btn-primary w-full">Salvar Configurações de Cartões</button>
        </div>
      </div>

      {/* Categorias */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={18} className="text-brand-primary" />
          <h3 className="text-lg font-bold">Categorias Personalizadas</h3>
        </div>
        <div className="space-y-3">
          {customCats.length === 0 && (
            <p className="text-xs text-muted">Nenhuma categoria personalizada criada ainda.</p>
          )}
          {customCats.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-s2 border border-white/[0.05]">
              <div className="flex items-center gap-2">
                <span className="text-lg">{c.icone}</span>
                <div className="w-3 h-3 rounded-full" style={{ background: c.cor }} />
                <span className="text-sm font-medium">{c.label}</span>
                <span className="text-[10px] text-muted font-mono">({c.nome})</span>
              </div>
              <button onClick={() => removeCat(c.id)} className="text-muted hover:text-fluxo-red transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.05]">
            <input
              className="input-dark w-8 h-9 text-center p-1"
              value={novaCatIcone}
              onChange={e => setNovaCatIcone(e.target.value)}
              placeholder="📂"
              maxLength={2}
            />
            <input
              className="input-dark flex-1"
              placeholder="Nome da categoria"
              value={novaCatLabel}
              onChange={e => setNovaCatLabel(e.target.value)}
              onKeyDown={async e => {
                if (e.key === 'Enter' && novaCatLabel.trim()) {
                  try {
                    await createCat({ label: novaCatLabel.trim(), cor: novaCatCor, icone: novaCatIcone });
                    setNovaCatLabel(''); setNovaCatIcone('📂');
                    addToast('success', 'Categoria criada!');
                  } catch { addToast('error', 'Erro ao criar categoria'); }
                }
              }}
            />
            <input type="color" value={novaCatCor} onChange={e => setNovaCatCor(e.target.value)}
              className="w-10 h-9 rounded-lg border border-white/[0.07] cursor-pointer bg-transparent p-1" />
            <button
              onClick={async () => {
                if (!novaCatLabel.trim()) return;
                try {
                  await createCat({ label: novaCatLabel.trim(), cor: novaCatCor, icone: novaCatIcone });
                  setNovaCatLabel(''); setNovaCatIcone('📂');
                  addToast('success', 'Categoria criada!');
                } catch { addToast('error', 'Erro ao criar categoria'); }
              }}
              className="btn-primary flex items-center gap-1.5"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Dados</h3>
        <div className="space-y-1">
          <button onClick={exportarCSV} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/[0.03] transition-all text-left">
            <FileSpreadsheet size={18} className="text-fluxo-green" />
            <div>
              <p className="text-sm font-medium">Exportar Planilha CSV</p>
              <p className="text-xs text-muted">Todas as transações para Excel / Google Sheets</p>
            </div>
          </button>
          <button onClick={exportarJSON} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/[0.03] transition-all text-left">
            <Download size={18} className="text-fluxo-blue" />
            <div>
              <p className="text-sm font-medium">Exportar Backup JSON</p>
              <p className="text-xs text-muted">Backup completo para restauração futura</p>
            </div>
          </button>
          <button onClick={importar} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/[0.03] transition-all text-left">
            <Upload size={18} className="text-fluxo-amber" />
            <div>
              <p className="text-sm font-medium">Importar Dados</p>
              <p className="text-xs text-muted">Restaurar backup de arquivo JSON</p>
            </div>
          </button>
          <button onClick={limpar} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-fluxo-red/[0.03] transition-all text-left">
            <Trash2 size={18} className="text-fluxo-red" />
            <div>
              <p className="text-sm font-medium text-fluxo-red">Limpar Todos os Dados</p>
              <p className="text-xs text-muted">Remove permanentemente todas as informações</p>
            </div>
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Info size={18} className="text-brand-primary" />
          <h3 className="text-lg font-bold">Sobre</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted">Versão</span>
            <span className="font-mono text-sm">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Build</span>
            <span className="font-mono text-sm">{new Date().toISOString().split('T')[0]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Stack</span>
            <span className="font-mono text-sm">React + Express + JSON</span>
          </div>
        </div>
      </div>
    </div>
  );
}
