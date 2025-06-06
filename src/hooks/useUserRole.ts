
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"admin" | "operational" | "manager" | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        console.log('[useUserRole] 🔍 Verificando role do usuário...');
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('[useUserRole] ❌ Usuário não autenticado');
          setIsAdmin(false);
          setRole(null);
          setLoading(false);
          return;
        }

        console.log('[useUserRole] 👤 Usuário autenticado:', { userId: user.id, email: user.email });

        // Tentar buscar o perfil do usuário com tratamento robusto de erros
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error('[useUserRole] ❌ Erro ao buscar perfil:', error);
          
          // Se o erro for relacionado a RLS, tentar uma abordagem alternativa
          if (error.message?.includes('row-level security') || error.message?.includes('infinite recursion')) {
            console.log('[useUserRole] 🔄 Tentando verificação alternativa de role...');
            
            // Fallback: verificar se é super admin através da função RPC
            try {
              const { data: isSuperAdmin, error: superAdminError } = await supabase.rpc('is_super_admin');
              
              if (!superAdminError && isSuperAdmin) {
                console.log('[useUserRole] 👑 Usuário é super admin');
                setRole('admin');
                setIsAdmin(true);
                setLoading(false);
                return;
              }
            } catch (superAdminErr) {
              console.error('[useUserRole] ❌ Erro ao verificar super admin:', superAdminErr);
            }
            
            // Se chegou até aqui, assumir role operacional como fallback seguro
            console.log('[useUserRole] ⚠️ Assumindo role operacional como fallback');
            setRole('operational');
            setIsAdmin(false);
          } else {
            // Para outros tipos de erro, também usar fallback
            console.log('[useUserRole] ⚠️ Erro desconhecido, usando fallback operacional');
            setRole('operational');
            setIsAdmin(false);
          }
        } else {
          // Sucesso ao buscar o perfil
          const userRole = profile?.role as "admin" | "operational" | "manager" | null;
          console.log('[useUserRole] ✅ Role encontrado:', userRole);
          
          setRole(userRole);
          setIsAdmin(userRole === "admin");
        }
      } catch (error) {
        console.error('[useUserRole] 💥 Erro geral ao verificar role:', error);
        
        // Em caso de erro geral, assumir role operacional
        setRole('operational');
        setIsAdmin(false);
      } finally {
        setLoading(false);
        console.log('[useUserRole] ✅ Verificação de role concluída');
      }
    };

    checkUserRole();
  }, []);

  console.log('[useUserRole] 📊 Estado atual:', { isAdmin, role, loading });

  return { isAdmin, role, loading };
};
