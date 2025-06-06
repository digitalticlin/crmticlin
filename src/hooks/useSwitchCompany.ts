
import { useProfileData } from "./useProfileData";
import { useCompanyData } from "./useCompanyData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Troca o company_id do perfil do usuário e recarrega dados do contexto
export function useSwitchCompany(userId?: string | null) {
  const { loadProfileData } = useProfileData();
  const { companyId } = useCompanyData();

  const switchCompany = async (newCompanyId: string) => {
    if (!userId) return;

    // Atualiza o perfil
    const { error } = await supabase
      .from("profiles")
      .update({ company_id: newCompanyId, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao trocar de empresa");
      return;
    }

    // Recarregar dados do perfil
    await loadProfileData(userId);
    
    toast.success("Empresa alterada com sucesso");
  };

  return { switchCompany, currentCompanyId: companyId };
}
