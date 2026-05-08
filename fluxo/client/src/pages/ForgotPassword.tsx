import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (e: any) {
      setError(e.message || 'Erro ao enviar e-mail');
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
          <h2 className="text-lg font-bold">Redefinir Senha</h2>

          {sent ? (
            <div className="space-y-4 text-center">
              <div className="text-4xl">📧</div>
              <p className="text-sm text-muted">Se o e-mail existir na nossa base, você receberá um link para redefinir a senha.</p>
              <Link to="/login" className="btn-primary block w-full text-center">Voltar ao Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-muted">Informe seu e-mail cadastrado e enviaremos um link para redefinir a senha.</p>
              <input
                className="input-dark w-full"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
              {error && <p className="text-xs text-fluxo-red">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? 'Enviando...' : 'Enviar Link'}
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
