import { createBrowserRouter, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import Layout from './components/layout/Layout';
import Overview from './pages/Overview';
import Contas from './pages/Contas';
import Cartoes from './pages/Cartoes/index';
import FaturaAtual from './pages/Cartoes/FaturaAtual';
import VisaoMensal from './pages/Cartoes/VisaoMensal';
import Recorrentes from './pages/Cartoes/Recorrentes';
import FluxoCaixa from './pages/FluxoCaixa';
import Orcamento from './pages/Orcamento';
import Metas from './pages/Metas';
import Radar from './pages/Radar';
import Configuracoes from './pages/Configuracoes';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

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

  return <Login />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginRoute />,
  },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <Overview /> },
      { path: 'contas', element: <Contas /> },
      { path: 'cartoes', element: <Cartoes /> },
      { path: 'cartoes/fatura', element: <FaturaAtual /> },
      { path: 'cartoes/mensal', element: <VisaoMensal /> },
      { path: 'cartoes/recorrentes', element: <Recorrentes /> },
      { path: 'fluxo', element: <FluxoCaixa /> },
      { path: 'orcamento', element: <Orcamento /> },
      { path: 'metas', element: <Metas /> },
      { path: 'radar', element: <Radar /> },
      { path: 'configuracoes', element: <Configuracoes /> },
    ],
  },
]);
