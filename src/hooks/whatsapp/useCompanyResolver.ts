
// FASE 3: Hook para resolver company_id do usuário
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useCompanyResolver = (userEmail: string): string | null => {
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const getCompanyId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();

          if (profile?.company_id) {
            setCompanyId(profile.company_id);
          }
        }
      } catch (error) {
        console.error('[Company Resolver FASE 3] ❌ Error getting company ID:', error);
      }
    };

    if (userEmail) {
      getCompanyId();
    }
  }, [userEmail]);

  return companyId;
};
