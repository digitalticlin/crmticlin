
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "operational" | "manager";

export const useSecureUserRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        setLoading(true);
        console.log('[useSecureUserRole] 🔐 Verificando papel do usuário de forma segura');
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('[useSecureUserRole] ❌ Usuário não autenticado');
          setIsAdmin(false);
          setRole(null);
          return;
        }

        console.log('[useSecureUserRole] 👤 Usuário autenticado:', { userId: user.id, email: user.email });
        
        // Buscar papel real do usuário no banco de dados
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('[useSecureUserRole] ❌ Erro ao buscar perfil:', error);
          // Definir papel padrão em caso de erro
          setRole('operational');
          setIsAdmin(false);
          return;
        }

        if (!profile) {
          console.log('[useSecureUserRole] ⚠️ Perfil não encontrado, usando papel padrão');
          setRole('operational');
          setIsAdmin(false);
          return;
        }

        const userRole = profile.role as UserRole;
        console.log('[useSecureUserRole] ✅ Papel do usuário:', userRole);
        
        setRole(userRole);
        setIsAdmin(userRole === 'admin');
        
      } catch (error) {
        console.error('[useSecureUserRole] ❌ Erro ao verificar papel:', error);
        // Em caso de erro, definir papel mais restritivo
        setRole('operational');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  console.log('[useSecureUserRole] 📊 Estado atual:', { isAdmin, role, loading });

  return { isAdmin, role, loading };
};
