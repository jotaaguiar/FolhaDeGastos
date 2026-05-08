import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAlert } from '@/context/AlertContext';

interface BotaoBaixarPDFProps {
  mes: number;
  ano: number;
  className?: string;
}

export default function BotaoBaixarPDF({ mes, ano, className = '' }: BotaoBaixarPDFProps) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useAlert();

  const baixar = async () => {
    setLoading(true);
    try {
      await api.downloadRelatorioPDF(mes, ano);
      addToast('success', 'PDF baixado!');
    } catch {
      addToast('error', 'Erro ao gerar PDF');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={baixar}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-muted hover:text-white hover:border-white/20 transition-all disabled:opacity-50 ${className}`}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
      PDF
    </button>
  );
}
