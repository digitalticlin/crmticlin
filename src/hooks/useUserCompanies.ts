
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Hook para buscar empresas do usuário (multiempresa)
// Existe company_id no perfil e tabela companies.
// Retorna todas empresas em que existe pelo menos um perfil com mesmo user_id/email.
export function useUserCompanies(userId?: string | null) {
  const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!userId) return;
      setLoading(true);
      // Busca todas empresas ligadas a perfis do user
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userId);

      if (error || !profiles) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      const uniqueCompanyIds = Array.from(new Set(profiles.map(p => p.company_id).filter(Boolean)));

      if (uniqueCompanyIds.length === 0) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      // Buscar dados das empresas
      const { data: companyData } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", uniqueCompanyIds);

      setCompanies(companyData || []);
      setLoading(false);
    }
    load();
  }, [userId]);

  return { companies, loading };
}
