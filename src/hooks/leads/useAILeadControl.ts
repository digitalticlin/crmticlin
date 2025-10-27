import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAILeadControl = () => {
  const [isLoading, setIsLoading] = useState(false);

  const toggleAI = async (leadId: string, currentState: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ ai_enabled: !currentState })
        .eq('id', leadId);

      if (error) throw error;

      toast.success(
        !currentState
          ? "IA ativada para este lead"
          : "IA desativada para este lead"
      );

      // Disparar evento para atualizar UI
      window.dispatchEvent(new CustomEvent('leadAIToggled', {
        detail: { leadId, aiEnabled: !currentState }
      }));

      return true;
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar configuração da IA");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { toggleAI, isLoading };
};
