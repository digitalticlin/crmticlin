
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function AuthNavigationHandler() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Só executar redirecionamento após auth estar carregada
    if (user === null || user !== undefined) {
      const currentPath = location.pathname;
      
      console.log("AuthNavigationHandler - user:", !!user, "currentPath:", currentPath);

      // Se usuário está logado e na página de login, redirecionar para dashboard
      if (user && currentPath === "/") {
        console.log("AuthNavigationHandler - Redirecionando usuário logado para dashboard");
        navigate("/dashboard", { replace: true });
        return;
      }

      // Se usuário não está logado e não está em páginas públicas, redirecionar para login
      const publicPaths = [
        "/", 
        "/register", 
        "/confirm-email", 
        "/confirm-email-instructions", 
        "/forgot-password", 
        "/reset-password"
      ];
      
      if (!user && !publicPaths.includes(currentPath)) {
        console.log("AuthNavigationHandler - Redirecionando usuário não logado para login");
        navigate("/", { replace: true });
        return;
      }
    }
  }, [user, session, location.pathname, navigate]);

  return null; // Este componente não renderiza nada
}
