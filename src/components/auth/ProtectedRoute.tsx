import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = React.memo(({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Se ainda estamos carregando, mostrar loading
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        {/* Fundo gradiente igual ao resto do app */}
        <div 
          className="fixed inset-0 z-0"
          style={{
            background: `radial-gradient(circle at 30% 70%, #D3D800 0%, transparent 50%), 
                         radial-gradient(circle at 80% 20%, #17191c 0%, transparent 60%),
                         radial-gradient(circle at 60% 40%, #D3D800 0%, transparent 40%)`,
            backgroundColor: '#e5e7eb'
          }}
        />
        
        <div className="text-center relative z-10">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-800 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se há usuário autenticado, renderizar o conteúdo da rota
  return <>{children}</>;
});

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;
