
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "../useCompanyData";
import { toast } from "sonner";

/**
 * Hook para integrar novos leads vindos do chat com o funil de vendas
 */
export const useNewLeadIntegration = (selectedFunnelId?: string) => {
  const { companyId } = useCompanyData();

  useEffect(() => {
    if (!companyId || !selectedFunnelId) return;

    // Escutar novos leads criados no chat
    const channel = supabase
      .channel('new-leads-integration')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `company_id=eq.${companyId}`
        },
        async (payload) => {
          console.log('Novo lead detectado:', payload.new);
          
          // Se o lead não tem kanban_stage_id, atribuir ao estágio "ENTRADA DE LEAD"
          if (!payload.new.kanban_stage_id) {
            try {
              // Buscar o estágio "ENTRADA DE LEAD" do funil selecionado
              const { data: entryStage } = await supabase
                .from('kanban_stages')
                .select('id')
                .eq('funnel_id', selectedFunnelId)
                .eq('title', 'ENTRADA DE LEAD')
                .single();

              if (entryStage) {
                // Atualizar o lead com o estágio correto
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, selectedFunnelId]);

  // Função para mover lead existente para o funil
  const addExistingLeadToFunnel = async (leadId: string) => {
    if (!selectedFunnelId) {
      toast.error("Nenhum funil selecionado");
      return;
    }

    try {
      // Buscar o estágio "ENTRADA DE LEAD"
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

      // Atualizar o lead
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
