
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const [isAdmin, setIsAdmin] = useState(true); // Simplificado: todos são admin agora
  const [loading, setLoading] = useState(false); // Sem loading necessário
  const [role, setRole] = useState<"admin" | "operational" | "manager">("admin"); // Todos são admin

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        console.log('[useUserRole] 🔍 Verificação simplificada - todos os usuários têm acesso total');
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('[useUserRole] ❌ Usuário não autenticado');
          setIsAdmin(false);
          setRole("operational");
          return;
        }

        console.log('[useUserRole] ✅ Usuário autenticado com acesso total:', { userId: user.id, email: user.email });
        
        // Simplificado: todos os usuários autenticados têm acesso de admin
        setRole('admin');
        setIsAdmin(true);
        
      } catch (error) {
        console.error('[useUserRole] ❌ Erro ao verificar usuário:', error);
        setRole('admin'); // Fallback para admin
        setIsAdmin(true);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  console.log('[useUserRole] 📊 Estado atual (simplificado):', { isAdmin: true, role: 'admin', loading: false });

  return { isAdmin: true, role: 'admin' as const, loading: false };
};
