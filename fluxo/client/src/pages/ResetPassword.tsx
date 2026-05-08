import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('As senhas não coincidem'); return; }
    if (password.length < 4) { setError('Senha deve ter pelo menos 4 caracteres'); return; }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (e: any) {
      setError(e.message || 'Token inválido ou expirado');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-brand-primary">Flu</span>xo
          </h1>
          <p className="text-muted text-sm mt-1">controle financeiro</p>
        </div>

        <div className="card space-y-5">
          <h2 className="text-lg font-bold">Nova Senha</h2>

          {!token ? (
            <p className="text-sm text-fluxo-red">Token inválido. <Link to="/login" className="underline">Voltar ao login</Link></p>
          ) : done ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">✅</div>
              <p className="text-sm text-fluxo-green">Senha redefinida com sucesso! Redirecionando...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className="input-dark w-full"
                type="password"
                placeholder="Nova senha (mín. 4 caracteres)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
              />
              <input
                className="input-dark w-full"
                type="password"
                placeholder="Confirmar nova senha"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              {error && <p className="text-xs text-fluxo-red">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? 'Salvando...' : 'Redefinir Senha'}
              </button>
              <Link to="/login" className="block text-center text-xs text-muted hover:text-white transition-colors">
                Voltar ao login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
