
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const [isAdmin, setIsAdmin] = useState(true); // Acesso total
  const [loading, setLoading] = useState(false); // Sem loading
  const [role, setRole] = useState<"admin" | "operational" | "manager">("admin"); // Todos são admin

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        console.log('[useUserRole] 🔓 ACESSO TOTAL LIBERADO - sem restrições');
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('[useUserRole] ❌ Usuário não autenticado');
          setIsAdmin(false);
          setRole("operational");
          return;
        }

        console.log('[useUserRole] ✅ Usuário autenticado com ACESSO TOTAL:', { userId: user.id, email: user.email });
        
        // ACESSO TOTAL - todos os usuários autenticados têm acesso completo
        setRole('admin');
        setIsAdmin(true);
        
      } catch (error) {
        console.error('[useUserRole] ❌ Erro ao verificar usuário:', error);
        // Mesmo com erro, dar acesso total
        setRole('admin');
        setIsAdmin(true);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  console.log('[useUserRole] 📊 Estado atual (ACESSO TOTAL):', { isAdmin: true, role: 'admin', loading: false });

  // SEMPRE retornar acesso total
  return { isAdmin: true, role: 'admin' as const, loading: false };
};
