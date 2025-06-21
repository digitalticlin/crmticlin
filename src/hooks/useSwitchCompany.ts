
import { useProfileData } from "./useProfileData";
import { useCompanyData } from "./useCompanyData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// Troca o company_id do perfil do usuário e recarrega dados do contexto
export function useSwitchCompany(userId?: string | null) {
  const { refetch } = useProfileData();
  const { companyId } = useCompanyData();
  const queryClient = useQueryClient();

  const switchCompany = async (newCompanyId: string) => {
    if (!userId) return;

    // Atualiza o perfil
    const { error } = await supabase
      .from("profiles")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao trocar de empresa");
      return;
    }

    // Recarregar dados do perfil
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    
    toast.success("Empresa alterada com sucesso");
  };

  return { switchCompany, currentCompanyId: companyId };
}
