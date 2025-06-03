
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  console.log("ProtectedRoute - loading:", loading, "user:", !!user, "path:", location.pathname);
  
  useEffect(() => {
    // Timeout de segurança para loading infinito
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("ProtectedRoute - Loading timeout, assumindo não autenticado");
        setShouldRedirect(true);
      }
    }, 5000); // 5 segundos

    return () => clearTimeout(timeout);
  }, [loading]);

  // Aguardar finalização do loading
  if (loading && !shouldRedirect) {
    console.log("ProtectedRoute - Mostrando loading");
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-ticlin"></div>
      </div>
    );
  }
  
  // Se não há usuário autenticado, redirecionar para login
  if (!user || shouldRedirect) {
    console.log("ProtectedRoute - Usuário não autenticado, redirecionando para login");
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  
  // Se há usuário autenticado, renderizar conteúdo
  console.log("ProtectedRoute - Usuário autenticado, renderizando conteúdo");
  return <>{children}</>;
};

export default ProtectedRoute;
