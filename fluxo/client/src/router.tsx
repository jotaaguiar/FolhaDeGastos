import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import Layout from './components/layout/Layout';
import { useAuth } from './context/AuthContext';
import RouteSkeleton from './components/shared/RouteSkeleton';

// Lazy-loaded pages — code split per route
const Overview      = lazy(() => import('./pages/Overview'));
const Contas        = lazy(() => import('./pages/Contas'));
const Cartoes       = lazy(() => import('./pages/Cartoes/index'));
const FaturaAtual   = lazy(() => import('./pages/Cartoes/FaturaAtual'));
const VisaoMensal   = lazy(() => import('./pages/Cartoes/VisaoMensal'));
const Recorrentes   = lazy(() => import('./pages/Cartoes/Recorrentes'));
const FluxoCaixa    = lazy(() => import('./pages/FluxoCaixa'));
const Orcamento     = lazy(() => import('./pages/Orcamento'));
const Metas         = lazy(() => import('./pages/Metas'));
const Radar         = lazy(() => import('./pages/Radar'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const Importacao    = lazy(() => import('./pages/Importacao'));
const Comparativo   = lazy(() => import('./pages/Comparativo'));
const Login         = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword'));

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteSkeleton />}>{children}</Suspense>;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function LoginRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Lazy><Login /></Lazy>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginRoute />,
  },
  {
    path: '/esqueci-senha',
    element: <Lazy><ForgotPassword /></Lazy>,
  },
  {
    path: '/reset-senha',
    element: <Lazy><ResetPassword /></Lazy>,
  },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true,          element: <Lazy><Overview /></Lazy> },
      { path: 'contas',       element: <Lazy><Contas /></Lazy> },
      {
        path: 'cartoes',
        element: <Lazy><Cartoes /></Lazy>,
        children: [
          { path: 'fatura',      element: <Lazy><FaturaAtual /></Lazy> },
          { path: 'mensal',      element: <Lazy><VisaoMensal /></Lazy> },
          { path: 'recorrentes', element: <Lazy><Recorrentes /></Lazy> },
        ],
      },
      { path: 'fluxo',        element: <Lazy><FluxoCaixa /></Lazy> },
      { path: 'orcamento',    element: <Lazy><Orcamento /></Lazy> },
      { path: 'metas',        element: <Lazy><Metas /></Lazy> },
      { path: 'radar',        element: <Lazy><Radar /></Lazy> },
      { path: 'configuracoes',element: <Lazy><Configuracoes /></Lazy> },
      { path: 'importacao',   element: <Lazy><Importacao /></Lazy> },
      { path: 'comparativo',  element: <Lazy><Comparativo /></Lazy> },
    ],
  },
]);
