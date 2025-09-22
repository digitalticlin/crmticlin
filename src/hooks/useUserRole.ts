
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"admin" | "operational">("operational");

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        console.log('[useUserRole] 🔍 Verificando role real do usuário');
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('[useUserRole] ❌ Usuário não autenticado');
          setIsAdmin(false);
          setRole("operational");
          setLoading(false);
          return;
        }

        console.log('[useUserRole] 👤 Buscando perfil do usuário:', user.id);
        
        // 🚀 CORREÇÃO FINAL: Usar ID direto (linked_auth_user_id está NULL)
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, created_by_user_id')
          .eq('id', user.id)  // ✅ ID direto - profiles.id = auth.users.id
          .single();

        if (error) {
          console.error('[useUserRole] ❌ Erro ao buscar perfil:', error);
          setIsAdmin(false);
          setRole("operational");
          setLoading(false);
          return;
        }

        if (!profile) {
          console.log('[useUserRole] ❌ Perfil não encontrado');
          setIsAdmin(false);
          setRole("operational");
          setLoading(false);
          return;
        }

        const userRole = profile.role as "admin" | "operational";
        const userIsAdmin = userRole === 'admin';

        console.log('[useUserRole] ✅ Role real encontrada:', {
          userId: user.id,
          role: userRole,
          isAdmin: userIsAdmin,
          createdByUserId: profile.created_by_user_id
        });
        
        setRole(userRole);
        setIsAdmin(userIsAdmin);
        
      } catch (error) {
        console.error('[useUserRole] ❌ Erro ao verificar role:', error);
        setIsAdmin(false);
        setRole("operational");
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  // Logs removidos completamente - evitar loops no render

  return { isAdmin, role, loading };
};
