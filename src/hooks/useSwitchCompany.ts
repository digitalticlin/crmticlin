
import { useProfileData } from "./useProfileData";
import { useCompanyData } from "./useCompanyData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Troca o company_id do perfil do usuário e recarrega dados do contexto
export function useSwitchCompany(userId?: string | null) {
  const { loadProfileData } = useProfileData();
  const { fetchCompanyData, setCompanyId } = useCompanyData();

  const switchCompany = async (companyId: string) => {
    if (!userId) return;

    // Atualiza o perfil
    const { error } = await supabase
      .from("profiles")
      .update({ company_id: companyId, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao trocar de empresa");
      return;
    }

    setCompanyId(companyId); // Atualiza companyId no contexto
    await loadProfileData(userId);
    await fetchCompanyData(companyId);
  };

  return { switchCompany };
}
