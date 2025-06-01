
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  console.log('[ProtectedRoute] Verificando autenticação...');
  
  const { user, loading } = useAuth();
  
  // Se ainda estamos carregando, mostrar loading
  if (loading) {
    console.log('[ProtectedRoute] Carregando...');
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Se não há usuário autenticado, redirecionar para login
  if (!user) {
    console.log('[ProtectedRoute] Usuário não autenticado, redirecionando...');
    return <Navigate to="/" replace />;
  }
  
  console.log('[ProtectedRoute] Usuário autenticado, renderizando conteúdo...');
  // Se há usuário autenticado, renderizar o conteúdo da rota
  return <>{children}</>;
};

export default ProtectedRoute;
