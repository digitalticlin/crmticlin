
import { ReactNode, useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const redirectCountRef = useRef<number>(0);
  const lastPathRef = useRef<string>("");
  
  // Reset contador após mudança de rota
  useEffect(() => {
    if (lastPathRef.current !== location.pathname) {
      redirectCountRef.current = 0;
      lastPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  console.log(`[ProtectedRoute] Checking access for ${location.pathname}`, {
    loading,
    hasUser: !!user,
    userId: user?.id,
    redirectCount: redirectCountRef.current
  });

  // Se ainda estamos carregando, mostrar loading
  if (loading) {
    console.log(`[ProtectedRoute] Loading auth state...`);
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
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-ticlin mx-auto mb-4"></div>
          <p className="text-gray-800 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Verificar proteção anti-loop
  if (redirectCountRef.current > 2) {
    console.error(`[ProtectedRoute] Too many redirects detected for ${location.pathname}`);
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
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro de Navegação</h2>
          <p className="text-gray-600 mb-4">Detectado loop de redirecionamento. Recarregue a página.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-ticlin text-white rounded hover:bg-ticlin/80"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  // Se não há usuário autenticado, redirecionar para login
  if (!user) {
    console.log(`[ProtectedRoute] No user found, redirecting to login`);
    redirectCountRef.current++;
    
    return <Navigate to="/login" replace />;
  }

  // Se há usuário autenticado, renderizar o conteúdo da rota
  console.log(`[ProtectedRoute] User authenticated, rendering protected content`);
  return <>{children}</>;
};

export default ProtectedRoute;
