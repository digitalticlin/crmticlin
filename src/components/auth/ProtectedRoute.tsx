
import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "operational";
}

const ProtectedRoute = React.memo(({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, isAdmin } = useUserRole();
  const location = useLocation();

  console.log('[ProtectedRoute] 🛡️ Verificando acesso:', {
    pathname: location.pathname,
    hasUser: !!user,
    authLoading,
    roleLoading,
    userRole: role,
    requiredRole,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  // Se ainda estamos carregando, mostrar loading
  if (authLoading || roleLoading) {
    console.log('[ProtectedRoute] ⏳ Carregando autenticação e roles...');
    return (
      <div className="flex h-screen w-full items-center justify-center">
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
          <p className="text-gray-600 text-sm mt-2">Aguarde um momento...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário autenticado, redirecionar para login
  if (!user) {
    console.log('[ProtectedRoute] 🚫 Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se há role requerida, verificar permissões
  if (requiredRole) {
    const hasRequiredRole = (() => {
      switch (requiredRole) {
        case 'admin':
          return role === 'admin';
        case 'operational':
          return true; // Todos os usuários autenticados podem acessar
        default:
          return false;
      }
    })();

    if (!hasRequiredRole) {
      console.log('[ProtectedRoute] ❌ Usuário sem permissões suficientes:', {
        userRole: role,
        requiredRole,
        hasAccess: hasRequiredRole
      });
      
      return (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
            <p className="text-gray-600 mb-4">
              Você não tem permissões suficientes para acessar esta página.
            </p>
            <p className="text-sm text-gray-500">
              Role necessária: {requiredRole} | Sua role: {role}
            </p>
            <button 
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }
  }

  // Se há usuário autenticado e tem permissões, renderizar o conteúdo
  console.log('[ProtectedRoute] ✅ Usuário autenticado e autorizado');
  return <>{children}</>;
});

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;
