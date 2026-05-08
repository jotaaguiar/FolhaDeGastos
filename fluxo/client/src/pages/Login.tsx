import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }
      if (password.length < 4) {
        setError('Senha deve ter pelo menos 4 caracteres');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-1">
            <span className="text-brand-primary">Flu</span>xo
          </h1>
          <p className="text-xs text-muted font-mono">controle financeiro pessoal</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-lg font-bold mb-6">
            {mode === 'login' ? 'Entrar na sua conta' : 'Criar nova conta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-mono block mb-1.5">Usuário</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-dark w-full"
                placeholder="Seu nome de usuário"
                required
                autoFocus
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label-mono block mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-dark w-full"
                placeholder="••••••••"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="label-mono block mb-1.5">Confirmar senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input-dark w-full"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <div className="text-sm text-fluxo-red bg-fluxo-red/10 border border-fluxo-red/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : null}
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/[0.07] text-center space-y-2">
            {mode === 'login' ? (
              <>
                <p className="text-sm text-muted">
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); }}
                    className="text-brand-primary hover:underline font-medium"
                  >
                    Criar conta
                  </button>
                </p>
                <Link to="/esqueci-senha" className="text-xs text-muted hover:text-white transition-colors block">
                  Esqueci minha senha
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted">
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-brand-primary hover:underline font-medium"
                >
                  Entrar
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
