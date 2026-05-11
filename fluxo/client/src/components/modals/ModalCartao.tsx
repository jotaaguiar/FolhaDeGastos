import { useState, useEffect } from 'react';
import { X, CreditCard, Info } from 'lucide-react';

interface ModalCartaoProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>, initialConfig?: any) => void;
  initialData?: any;
  taxaJurosGlobal?: number;
}

const cores = ['#a78bfa', '#f97316', '#374151', '#60a5fa', '#34d399', '#fb7185', '#fbbf24', '#f472b6'];
export default function ModalCartao({ open, onClose, onSubmit, initialData, taxaJurosGlobal = 15 }: ModalCartaoProps) {
  const [form, setForm] = useState({
    nome: '', banco: '', bandeira: 'Mastercard', ultimos4: '',
    limite: '', diaVencimento: '10', diaFechamento: '3', cor: '#a78bfa',
    usarTaxaGlobal: true,
    taxaJurosRotativo: '',
    taxaJurosParcela: '0',
  });

  const [step, setStep] = useState(1);
  const [initialMode, setInitialMode] = useState<'none' | 'saldos' | 'parcelas'>('none');
  const [mesesInit, setMesesInit] = useState(4);
  const [initialSaldos, setInitialSaldos] = useState<Array<{ mes: number; ano: number; valor: string }>>([]);
  const [initialParcelas, setInitialParcelas] = useState<any[]>([]);

  const now = new Date();
  const getMonths = (count: number) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      let m = now.getMonth() + 1 + i;
      let a = now.getFullYear();
      while (m > 12) { m -= 12; a++; }
      arr.push({ mes: m, ano: a });
    }
    return arr;
  };

  useEffect(() => {
    if (open && !initialData) {
      setStep(1);
      setInitialMode('none');
      setMesesInit(4);
      setInitialSaldos(getMonths(4).map(m => ({ ...m, valor: '' })));
      setInitialParcelas([]);
    }
  }, [open, initialData]);

  useEffect(() => {
    if (step === 2 && initialMode === 'saldos') {
      const current = [...initialSaldos];
      const target = getMonths(mesesInit);
      const updated = target.map(t => {
        const found = current.find(c => c.mes === t.mes && c.ano === t.ano);
        return found || { ...t, valor: '' };
      });
      setInitialSaldos(updated);
    }
  }, [mesesInit, step, initialMode]);

  useEffect(() => {
    if (initialData) {
      const hasCustomRate = initialData.taxaJurosRotativo !== undefined && initialData.taxaJurosRotativo !== null;
      setForm({
        nome: initialData.nome || '',
        banco: initialData.banco || '',
        bandeira: initialData.bandeira || 'Mastercard',
        ultimos4: initialData.ultimos4 || '',
        limite: initialData.limite ? String(initialData.limite) : '',
        diaVencimento: initialData.diaVencimento ? String(initialData.diaVencimento) : '10',
        diaFechamento: initialData.diaFechamento ? String(initialData.diaFechamento) : '3',
        cor: initialData.cor || '#a78bfa',
        usarTaxaGlobal: !hasCustomRate,
        taxaJurosRotativo: hasCustomRate ? String(initialData.taxaJurosRotativo) : '',
        taxaJurosParcela: initialData.taxaJurosParcela !== undefined ? String(initialData.taxaJurosParcela) : '0',
      });
    } else {
      setForm({
        nome: '', banco: '', bandeira: 'Mastercard', ultimos4: '',
        limite: '', diaVencimento: '10', diaFechamento: '3', cor: '#a78bfa',
        usarTaxaGlobal: true, taxaJurosRotativo: '', taxaJurosParcela: '0',
      });
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.nome || !form.ultimos4) return;

    if (!initialData && step === 1 && initialMode === 'none') {
      const taxaRot = form.usarTaxaGlobal ? undefined : (parseFloat(form.taxaJurosRotativo) || undefined);
      onSubmit({
        nome: form.nome, banco: form.banco, bandeira: form.bandeira,
        ultimos4: form.ultimos4, limite: parseFloat(form.limite) || 0,
        diaVencimento: parseInt(form.diaVencimento), diaFechamento: parseInt(form.diaFechamento),
        cor: form.cor,
        taxaJurosRotativo: taxaRot,
        taxaJurosParcela: parseFloat(form.taxaJurosParcela) || 0,
      });
      onClose();
      return;
    }

    if (!initialData && step === 1) {
      setStep(2);
      return;
    }

    const taxaRot = form.usarTaxaGlobal ? undefined : (parseFloat(form.taxaJurosRotativo) || undefined);
    const cardData = {
      id: initialData?.id,
      nome: form.nome, banco: form.banco, bandeira: form.bandeira,
      ultimos4: form.ultimos4, limite: parseFloat(form.limite) || 0,
      diaVencimento: parseInt(form.diaVencimento), diaFechamento: parseInt(form.diaFechamento),
      cor: form.cor,
      taxaJurosRotativo: taxaRot,
      taxaJurosParcela: parseFloat(form.taxaJurosParcela) || 0,
    };

    const initialConfig = initialMode !== 'none' ? {
      mode: initialMode,
      saldos: initialMode === 'saldos' ? initialSaldos.filter(s => parseFloat(s.valor) > 0).map(s => ({ ...s, valor: parseFloat(s.valor) })) : [],
      parcelas: initialMode === 'parcelas' ? initialParcelas : [],
    } : undefined;

    onSubmit(cardData, initialConfig);
    onClose();
  };

  const diaFech = parseInt(form.diaFechamento) || 3;
  const diaVenc = parseInt(form.diaVencimento) || 10;
  const exemploCompra1 = diaFech > 1 ? diaFech - 1 : 1;
  const exemploCompra2 = diaFech + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-surface border border-white/[0.07] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <CreditCard size={20} className="text-brand-primary" />
            <h3 className="text-lg font-bold">{initialData ? 'Editar Cartão' : 'Novo Cartão'}</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white p-1"><X size={18} /></button>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="label-mono">Dados do Cartão</p>
              <input className="input-dark w-full" placeholder="Nome (ex: Nubank, Inter)" value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              <input className="input-dark w-full" placeholder="Banco" value={form.banco}
                onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} />
              <div className="flex gap-3">
                <select className="input-dark flex-1" value={form.bandeira}
                  onChange={e => setForm(f => ({ ...f, bandeira: e.target.value }))}>
                  {['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard'].map(b => <option key={b}>{b}</option>)}
                </select>
                <input className="input-dark w-28" placeholder="Últimos 4" maxLength={4}
                  value={form.ultimos4} onChange={e => setForm(f => ({ ...f, ultimos4: e.target.value }))} />
              </div>
              <input className="input-dark w-full" type="number" placeholder="Limite (R$)"
                value={form.limite} onChange={e => setForm(f => ({ ...f, limite: e.target.value }))} />
            </div>

            <div className="space-y-3">
              <p className="label-mono">Ciclo de Faturamento</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Dia de Fechamento</label>
                  <input className="input-dark w-full" type="number" min="1" max="31"
                    value={form.diaFechamento} onChange={e => setForm(f => ({ ...f, diaFechamento: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Dia de Vencimento</label>
                  <input className="input-dark w-full" type="number" min="1" max="31"
                    value={form.diaVencimento} onChange={e => setForm(f => ({ ...f, diaVencimento: e.target.value }))} />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/10 space-y-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <Info size={12} className="text-brand-primary" />
                  <p className="text-[10px] text-brand-primary font-mono uppercase">Como funciona o ciclo</p>
                </div>
                <p className="text-[11px] text-muted">
                  ✅ Compra no dia <strong className="text-white">{exemploCompra1}</strong> → fatura do mês atual (fecha dia {diaFech})
                </p>
                <p className="text-[11px] text-muted">
                  ➡️ Compra no dia <strong className="text-white">{exemploCompra2}</strong> → próxima fatura (após fechamento)
                </p>
                <p className="text-[11px] text-muted">
                  📅 Vencimento da fatura: dia <strong className="text-white">{diaVenc}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="label-mono">Juros</p>
              <div className="flex items-center justify-between p-3 rounded-lg bg-s2 border border-white/[0.05]">
                <div>
                  <p className="text-sm">Usar taxa global ({taxaJurosGlobal}% a.m.)</p>
                  <p className="text-[10px] text-muted">Configurada em Configurações → Cartões</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, usarTaxaGlobal: !f.usarTaxaGlobal }))}
                  className={`w-11 h-6 rounded-full transition-all relative ${form.usarTaxaGlobal ? 'bg-brand-primary' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.usarTaxaGlobal ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              {!form.usarTaxaGlobal && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  <div>
                    <label className="text-xs text-muted block mb-1">Juros Rotativo (% a.m.)</label>
                    <input className="input-dark w-full" type="number" step="0.1"
                      placeholder={`Ex: ${taxaJurosGlobal}`}
                      value={form.taxaJurosRotativo}
                      onChange={e => setForm(f => ({ ...f, taxaJurosRotativo: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-1">Juros Parcela (% a.m.)</label>
                    <input className="input-dark w-full" type="number" step="0.1"
                      placeholder="Ex: 3"
                      value={form.taxaJurosParcela}
                      onChange={e => setForm(f => ({ ...f, taxaJurosParcela: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>

            <div className="pb-2">
              <p className="text-xs text-muted mb-2">Cor do Cartão</p>
              <div className="flex gap-2 flex-wrap">
                {cores.map(c => (
                  <button key={c} className={`w-8 h-8 rounded-full transition-all ${form.cor === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                    style={{ background: c }} onClick={() => setForm(f => ({ ...f, cor: c }))} />
                ))}
              </div>
            </div>

            {!initialData && (
              <div className="pt-4 border-t border-white/[0.07]">
                <p className="text-xs text-muted mb-2 uppercase font-mono font-bold">Deseja configurar faturas existentes?</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setInitialMode('none')} className={`p-2 text-[10px] rounded-lg border-2 transition-all ${initialMode === 'none' ? 'border-brand-primary bg-brand-primary/10' : 'border-white/5 hover:border-white/10'}`}>
                    <p className="font-bold">Não</p>
                    <p className="text-[8px] opacity-60">Começar do zero</p>
                  </button>
                  <button onClick={() => setInitialMode('saldos')} className={`p-2 text-[10px] rounded-lg border-2 transition-all ${initialMode === 'saldos' ? 'border-brand-primary bg-brand-primary/10' : 'border-white/5 hover:border-white/10'}`}>
                    <p className="font-bold">Sim, Saldos</p>
                    <p className="text-[8px] opacity-60">Valor total por mês</p>
                  </button>
                  <button onClick={() => setInitialMode('parcelas')} className={`p-2 text-[10px] rounded-lg border-2 transition-all ${initialMode === 'parcelas' ? 'border-brand-primary bg-brand-primary/10' : 'border-white/5 hover:border-white/10'}`}>
                    <p className="font-bold">Sim, Parcelas</p>
                    <p className="text-[8px] opacity-60">Add compras individuais</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-muted">Configure os gastos que já existem neste cartão para os próximos meses.</p>

            {initialMode === 'saldos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10">
                  <div>
                    <p className="text-xs font-bold text-brand-primary uppercase font-mono">Período de Ajuste</p>
                    <p className="text-[10px] text-muted">Quantos meses deseja configurar?</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setMesesInit(m => Math.max(1, m - 1))} className="w-8 h-8 rounded-lg bg-surface border border-white/10 flex items-center justify-center hover:bg-white/5">-</button>
                    <span className="text-sm font-bold font-mono w-6 text-center">{mesesInit}</span>
                    <button onClick={() => setMesesInit(m => Math.min(12, m + 1))} className="w-8 h-8 rounded-lg bg-surface border border-white/10 flex items-center justify-center hover:bg-white/5">+</button>
                  </div>
                </div>

                <p className="label-mono">Saldos Totais por Fatura</p>
                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {initialSaldos.map((s, idx) => (
                    <div key={idx} className="bg-s2/40 p-2 rounded-lg border border-white/5">
                      <label className="text-[9px] text-muted font-mono block mb-1 uppercase">
                        {new Date(s.ano, s.mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </label>
                      <input
                        className="input-dark w-full text-xs font-mono"
                        type="number"
                        placeholder="R$ 0,00"
                        value={s.valor}
                        onChange={e => {
                          const news = [...initialSaldos];
                          news[idx].valor = e.target.value;
                          setInitialSaldos(news);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted italic">Estes valores serão adicionados como "ajuste manual" em cada fatura.</p>
              </div>
            )}

            {initialMode === 'parcelas' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-s2/50 border border-white/10 space-y-3">
                  <p className="text-[10px] text-brand-primary font-mono uppercase font-bold">Nova Compra ou Gasto Futuro</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input id="initial-desc" className="input-dark w-full text-xs" placeholder="Descrição (ex: iPhone, IPTU)" />
                    <select id="initial-month" className="input-dark w-full text-xs">
                      {getMonths(12).map(m => (
                        <option key={`${m.mes}-${m.ano}`} value={`${m.mes}-${m.ano}`}>
                          Início: {new Date(m.ano, m.mes - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input id="initial-valor" className="input-dark flex-1 text-xs" type="number" placeholder="Valor (R$)" />
                    <input id="initial-parc" className="input-dark w-20 text-xs" type="number" placeholder="1x, 10x..." defaultValue="1" />
                    <button
                      onClick={() => {
                        const d = document.getElementById('initial-desc') as HTMLInputElement;
                        const v = document.getElementById('initial-valor') as HTMLInputElement;
                        const p = document.getElementById('initial-parc') as HTMLInputElement;
                        const m = document.getElementById('initial-month') as HTMLSelectElement;
                        if (d.value && v.value && p.value) {
                          const [mes, ano] = m.value.split('-').map(Number);
                          setInitialParcelas([...initialParcelas, {
                            descricao: d.value,
                            valorTotal: parseFloat(v.value),
                            parcelas: parseInt(p.value),
                            categoria: 'outros',
                            mesInicio: mes,
                            anoInicio: ano
                          }]);
                          d.value = ''; v.value = '';
                        }
                      }}
                      className="btn-primary text-[10px] px-3"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {initialParcelas.length === 0 && (
                    <div className="p-6 border border-dashed border-white/10 rounded-xl text-center text-xs text-muted">
                      Nenhuma compra adicionada.
                    </div>
                  )}
                  {initialParcelas.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-s2 border border-white/5 text-xs">
                      <div>
                        <p className="font-bold">{p.descricao}</p>
                        <p className="text-[10px] text-muted font-mono">
                          {p.parcelas}× de R$ {(p.valorTotal / p.parcelas).toFixed(2)}
                          <span className="ml-2 text-brand-primary">({p.mesInicio}/{p.anoInicio})</span>
                        </p>
                      </div>
                      <button onClick={() => setInitialParcelas(initialParcelas.filter((_, i) => i !== idx))} className="text-fluxo-red opacity-60 hover:opacity-100 p-1">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => step === 1 ? onClose() : setStep(1)} className="btn-ghost">
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            {step === 1 && initialMode !== 'none' && !initialData ? 'Continuar' : (initialData ? 'Salvar Alterações' : 'Finalizar e Criar')}
          </button>
        </div>
      </div>
    </div>
  );
}
