import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertTriangle, ChevronRight, ArrowLeft, FileUp, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useContas } from '@/hooks/useContas';
import { useCartoes } from '@/hooks/useCartoes';
import { useCategorias } from '@/hooks/useCategorias';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useAlert } from '@/context/AlertContext';
import ModalConta from '@/components/modals/ModalConta';
import ModalCartao from '@/components/modals/ModalCartao';

type PreviewItem = {
  externalId: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'debito' | 'entrada';
  duplicata: boolean;
  transacaoExistenteId?: string;
};

type Step = 'upload' | 'preview' | 'done';

// Sentinel value used in the <select> to trigger modal opening
const CRIAR_CONTA_VALUE  = '__criar_conta__';
const CRIAR_CARTAO_VALUE = '__criar_cartao__';

export default function Importacao() {
  const { addToast } = useAlert();
  const { contas, create: createConta } = useContas();
  const { cartoes, create: createCartao } = useCartoes();
  const { all: categorias } = useCategorias();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [contaId, setContaId] = useState('');
  const [cartaoId, setCartaoId] = useState('');
  const [categoria, setCategoria] = useState('outros');
  const [targetType, setTargetType] = useState<'conta' | 'cartao'>('conta');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ total: number; novas: number; duplicatas: number; items: PreviewItem[] } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ criadas: number } | null>(null);

  // Modal state
  const [modalConta, setModalConta] = useState(false);
  const [modalCartao, setModalCartao] = useState(false);

  const handleContaSelect = (value: string) => {
    if (value === CRIAR_CONTA_VALUE) {
      setModalConta(true);
    } else {
      setContaId(value);
    }
  };

  const handleCartaoSelect = (value: string) => {
    if (value === CRIAR_CARTAO_VALUE) {
      setModalCartao(true);
    } else {
      setCartaoId(value);
    }
  };

  const handleNovaConta = async (data: Record<string, unknown>) => {
    try {
      const nova = await createConta(data as any);
      setContaId(nova.id);
      addToast('success', `Conta "${nova.nome}" criada!`);
    } catch {
      addToast('error', 'Erro ao criar conta');
    }
  };

  const handleNovoCartao = async (data: Record<string, unknown>) => {
    try {
      const novo = await createCartao(data as any);
      setCartaoId(novo.id);
      addToast('success', `Cartão "${novo.nome}" criado!`);
    } catch {
      addToast('error', 'Erro ao criar cartão');
    }
  };

  const handleFileChange = (f: File) => setFile(f);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileChange(f);
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const cId = targetType === 'conta' ? contaId : undefined;
      const kId = targetType === 'cartao' ? cartaoId : undefined;

      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const rawItems: Array<{ externalId: string; data: string; descricao: string; valor: number; tipo: 'debito' | 'entrada' }> =
          Array.isArray(parsed) ? parsed : parsed.items;
        if (!Array.isArray(rawItems)) throw new Error('JSON inválido: esperado array "items"');
        const items: PreviewItem[] = rawItems.map(i => ({ ...i, duplicata: false }));
        const novas = items.length;
        setPreview({ total: novas, novas, duplicatas: 0, items });
        setSelected(new Set(items.map(i => i.externalId)));
        setStep('preview');
      } else {
        const data = await api.importacaoPreview(file, cId, kId);
        setPreview(data);
        setSelected(new Set(data.items.filter(i => !i.duplicata).map(i => i.externalId)));
        setStep('preview');
      }
    } catch (e: any) {
      addToast('error', e.message || 'Erro ao processar arquivo');
    }
    setLoading(false);
  };

  const handleConfirmar = async () => {
    if (!preview) return;
    const toImport = preview.items.filter(i => selected.has(i.externalId));
    if (toImport.length === 0) { addToast('error', 'Selecione pelo menos uma transação'); return; }
    setLoading(true);
    try {
      const cId = targetType === 'conta' ? contaId : undefined;
      const kId = targetType === 'cartao' ? cartaoId : undefined;
      const res = await api.importacaoConfirmar(toImport, cId, kId, categoria);
      setResultado(res);
      setStep('done');
      addToast('success', `${res.criadas} transações importadas!`);
    } catch (e: any) {
      addToast('error', e.message || 'Erro ao importar');
    }
    setLoading(false);
  };

  const toggleItem = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setSelected(new Set());
    setResultado(null);
  };

  const canProceed = file && (targetType === 'conta' ? !!contaId : !!cartaoId);

  return (
    <>
      <div className="max-w-3xl space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <FileUp size={22} className="text-brand-primary" />
          <div>
            <h2 className="text-xl font-bold">Importar Transações</h2>
            <p className="text-xs text-muted font-mono">Carregue arquivos OFX, QFX, CSV ou JSON</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs">
          {(['upload', 'preview', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                step === s ? 'bg-brand-primary text-white'
                : i < ['upload', 'preview', 'done'].indexOf(step) ? 'bg-fluxo-green text-white'
                : 'bg-white/10 text-muted'
              }`}>
                {i + 1}
              </div>
              <span className={step === s ? 'text-white' : 'text-muted'}>
                {s === 'upload' ? 'Arquivo' : s === 'preview' ? 'Revisão' : 'Concluído'}
              </span>
              {i < 2 && <ChevronRight size={12} className="text-muted" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="card space-y-5">
            {/* Target type toggle */}
            <div>
              <label className="label-mono mb-2">Destino das transações</label>
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => setTargetType('conta')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${targetType === 'conta' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-white/10 text-muted hover:border-white/20'}`}
                >
                  Conta Bancária
                </button>
                <button
                  onClick={() => setTargetType('cartao')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${targetType === 'cartao' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-white/10 text-muted hover:border-white/20'}`}
                >
                  Cartão de Crédito
                </button>
              </div>

              {targetType === 'conta' ? (
                <div className="flex gap-2">
                  <select
                    className="input-dark flex-1"
                    value={contaId}
                    onChange={e => handleContaSelect(e.target.value)}
                  >
                    <option value="">Selecionar conta...</option>
                    {contas.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} ({c.banco})</option>
                    ))}
                    <option disabled>──────────</option>
                    <option value={CRIAR_CONTA_VALUE}>+ Criar nova conta</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setModalConta(true)}
                    title="Criar nova conta"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-muted hover:text-white hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all text-xs font-medium whitespace-nowrap"
                  >
                    <Plus size={14} /> Nova conta
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    className="input-dark flex-1"
                    value={cartaoId}
                    onChange={e => handleCartaoSelect(e.target.value)}
                  >
                    <option value="">Selecionar cartão...</option>
                    {cartoes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} (•••• {c.ultimos4})</option>
                    ))}
                    <option disabled>──────────</option>
                    <option value={CRIAR_CARTAO_VALUE}>+ Criar novo cartão</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setModalCartao(true)}
                    title="Criar novo cartão"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-muted hover:text-white hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all text-xs font-medium whitespace-nowrap"
                  >
                    <Plus size={14} /> Novo cartão
                  </button>
                </div>
              )}

              {/* Show selected account/card as confirmation */}
              {targetType === 'conta' && contaId && (() => {
                const c = contas.find(c => c.id === contaId);
                return c ? (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.cor }} />
                    <span>{c.nome} · {c.banco}</span>
                    <span className="ml-auto text-[10px] bg-fluxo-green/10 text-fluxo-green px-1.5 py-0.5 rounded font-mono">selecionada</span>
                  </div>
                ) : null;
              })()}
              {targetType === 'cartao' && cartaoId && (() => {
                const c = cartoes.find(c => c.id === cartaoId);
                return c ? (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.cor }} />
                    <span>{c.nome} · •••• {c.ultimos4}</span>
                    <span className="ml-auto text-[10px] bg-fluxo-green/10 text-fluxo-green px-1.5 py-0.5 rounded font-mono">selecionado</span>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Default category */}
            <div>
              <label className="label-mono mb-2">Categoria padrão</label>
              <select className="input-dark w-full" value={categoria} onChange={e => setCategoria(e.target.value)}>
                {categorias.map(c => <option key={c.value} value={c.value}>{c.icone} {c.label}</option>)}
              </select>
            </div>

            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                file ? 'border-fluxo-green bg-fluxo-green/5' : 'border-white/10 hover:border-brand-primary/40 hover:bg-brand-primary/5'
              }`}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".ofx,.qfx,.csv,.json"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }}
              />
              {file ? (
                <>
                  <CheckCircle size={32} className="text-fluxo-green mx-auto mb-2" />
                  <p className="text-sm font-medium text-fluxo-green">{file.name}</p>
                  <p className="text-xs text-muted mt-1">{(file.size / 1024).toFixed(1)} KB · clique para trocar</p>
                </>
              ) : (
                <>
                  <Upload size={32} className="text-muted mx-auto mb-2" />
                  <p className="text-sm font-medium">Arraste o arquivo aqui ou clique para selecionar</p>
                  <p className="text-xs text-muted mt-1">Suporta OFX, QFX, CSV e JSON</p>
                </>
              )}
            </div>

            <button
              onClick={handlePreview}
              disabled={!canProceed || loading}
              className="btn-primary w-full disabled:opacity-40"
            >
              {loading ? 'Processando...' : 'Analisar Arquivo →'}
            </button>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && preview && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-fluxo-green" />
                  <span className="text-fluxo-green font-bold">{preview.novas}</span>
                  <span className="text-muted">novas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-fluxo-amber" />
                  <span className="text-fluxo-amber font-bold">{preview.duplicatas}</span>
                  <span className="text-muted">duplicatas</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-muted">
                  <span>{selected.size} selecionadas</span>
                </div>
              </div>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => setSelected(new Set(preview.items.filter(i => !i.duplicata).map(i => i.externalId)))}
                  className="text-xs text-muted hover:text-white underline"
                >
                  Selecionar novas
                </button>
                <button
                  onClick={() => setSelected(new Set(preview.items.map(i => i.externalId)))}
                  className="text-xs text-muted hover:text-white underline"
                >
                  Selecionar tudo
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-muted hover:text-white underline"
                >
                  Desmarcar tudo
                </button>
              </div>
            </div>

            <div className="card space-y-1 max-h-[400px] overflow-y-auto">
              {preview.items.map(item => (
                <div
                  key={item.externalId}
                  onClick={() => toggleItem(item.externalId)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    selected.has(item.externalId) ? 'bg-brand-primary/5 border border-brand-primary/20' : 'hover:bg-white/[0.02]'
                  } ${item.duplicata ? 'opacity-60' : ''}`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    selected.has(item.externalId) ? 'bg-brand-primary border-brand-primary' : 'border-white/20'
                  }`}>
                    {selected.has(item.externalId) && <CheckCircle size={10} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.descricao}</p>
                    <p className="text-xs text-muted font-mono">{formatDate(item.data)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-sm font-mono font-bold ${item.tipo === 'entrada' ? 'text-fluxo-green' : 'text-fluxo-red'}`}>
                      {item.tipo === 'entrada' ? '+' : '-'}{formatCurrency(item.valor)}
                    </span>
                  </div>
                  {item.duplicata && (
                    <span className="text-[10px] bg-fluxo-amber/10 text-fluxo-amber px-1.5 py-0.5 rounded font-mono shrink-0">dup</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={reset} className="btn-ghost flex items-center gap-1.5">
                <ArrowLeft size={14} /> Voltar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={loading || selected.size === 0}
                className="btn-primary flex-1 disabled:opacity-40"
              >
                {loading ? 'Importando...' : `Importar ${selected.size} Transações`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && resultado && (
          <div className="card text-center space-y-4 py-8">
            <CheckCircle size={48} className="text-fluxo-green mx-auto" />
            <h3 className="text-xl font-bold">{resultado.criadas} transações importadas!</h3>
            <p className="text-sm text-muted">As transações já estão disponíveis no Fluxo de Caixa.</p>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={reset} className="btn-ghost">Nova Importação</button>
              <a href="/fluxo" className="btn-primary">Ver no Fluxo de Caixa</a>
            </div>
          </div>
        )}
      </div>

      {/* Modais — rendered outside the main div so z-index works properly */}
      <ModalConta
        open={modalConta}
        onClose={() => setModalConta(false)}
        onSubmit={handleNovaConta}
      />
      <ModalCartao
        open={modalCartao}
        onClose={() => setModalCartao(false)}
        onSubmit={handleNovoCartao}
      />
    </>
  );
}
