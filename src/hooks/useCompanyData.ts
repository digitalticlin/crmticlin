
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCompanyData = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          console.log('[useCompanyData] ✅ Usuário autenticado:', user.id);
          setUserId(user.id);
        } else {
          console.log('[useCompanyData] ❌ Usuário não autenticado');
          setUserId(null);
        }
      } catch (error) {
        console.error('[useCompanyData] ❌ Erro ao obter usuário:', error);
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };

    getUserId();
  }, []);

  // Manter compatibilidade com código existente
  return { 
    companyId: userId,  // Alias para compatibilidade
    userId: userId,     // Nome mais preciso
    loading 
  };
};
