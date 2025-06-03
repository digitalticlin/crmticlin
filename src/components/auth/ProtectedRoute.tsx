
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  console.log("ProtectedRoute - loading:", loading, "user:", !!user, "path:", location.pathname);
  
  // Se ainda estamos carregando, mostrar loading
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-ticlin"></div>
      </div>
    );
  }
  
  // Se não há usuário autenticado, redirecionar para a página de login
  // Usar replace para evitar adicionar à história de navegação
  if (!user) {
    console.log("ProtectedRoute - Redirecting to login");
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  
  // Se há usuário autenticado, renderizar o conteúdo da rota
  console.log("ProtectedRoute - User authenticated, rendering children");
  return <>{children}</>;
};

export default ProtectedRoute;
