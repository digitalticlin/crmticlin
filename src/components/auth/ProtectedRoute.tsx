
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  
  // Se ainda estamos carregando, não renderize nada por enquanto
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-ticlin"></div>
      </div>
    );
  }
  
  // Se não há usuário autenticado, redirecione para a página de login
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Se há usuário autenticado, renderize o conteúdo da rota
  return <>{children}</>;
};

export default ProtectedRoute;
