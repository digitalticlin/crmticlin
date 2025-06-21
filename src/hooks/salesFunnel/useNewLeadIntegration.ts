
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "../useCompanyData";
import { useRealtimeManager } from "../realtime/useRealtimeManager";
import { toast } from "sonner";

export const useNewLeadIntegration = (selectedFunnelId?: string) => {
  const { companyId } = useCompanyData();
  const { registerCallback, unregisterCallback } = useRealtimeManager();

  useEffect(() => {
    if (!companyId || !selectedFunnelId) return;

    const handleNewLead = async (payload: any) => {
      console.log('Novo lead detectado:', payload.new);
      
      if (!payload.new.kanban_stage_id) {
        try {
          const { data: entryStage } = await supabase
            .from('kanban_stages')
            .select('id')
            .eq('funnel_id', selectedFunnelId)
            .eq('title', 'ENTRADA DE LEAD')
            .single();

          if (entryStage) {
            await supabase
              .from('leads')
              .update({
                kanban_stage_id: entryStage.id,
                funnel_id: selectedFunnelId
              })
              .eq('id', payload.new.id);

            toast.success(`Novo lead "${payload.new.name || payload.new.phone}" adicionado ao funil!`);
          }
        } catch (error) {
          console.error('Erro ao integrar novo lead:', error);
        }
      }
    };

    registerCallback(
      'new-lead-integration',
      'leadInsert',
      handleNewLead,
      {
        filters: { funnel_id: selectedFunnelId }
      }
    );

    return () => {
      unregisterCallback('new-lead-integration');
    };
  }, [companyId, selectedFunnelId, registerCallback, unregisterCallback]);

  const addExistingLeadToFunnel = async (leadId: string) => {
    if (!selectedFunnelId) {
      toast.error("Nenhum funil selecionado");
      return;
    }

    try {
      const { data: entryStage } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('funnel_id', selectedFunnelId)
        .eq('title', 'ENTRADA DE LEAD')
        .single();

      if (!entryStage) {
        toast.error("Estágio de entrada não encontrado");
        return;
      }

      const { error } = await supabase
        .from('leads')
        .update({
          kanban_stage_id: entryStage.id,
          funnel_id: selectedFunnelId
        })
        .eq('id', leadId);

      if (error) throw error;

      toast.success("Lead adicionado ao funil com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar lead ao funil:", error);
      toast.error("Erro ao adicionar lead ao funil");
    }
  };

  return {
    addExistingLeadToFunnel
  };
};
