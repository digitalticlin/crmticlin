
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { KanbanStage } from "@/types/funnel";
import { useCompanyData } from "../useCompanyData";

export const useStageManagement = (
  funnelId?: string, 
  stages: KanbanStage[] = [], 
  setColumns?: (fn: (prev: KanbanColumn[]) => KanbanColumn[]) => void,
  refetchStages?: () => void,
  refetchLeads?: () => void
) => {
  const { companyId } = useCompanyData();

  // Função para criar deal no histórico
  const createDeal = async (lead: KanbanLead, status: "won" | "lost", note?: string) => {
    try {
      const { error } = await supabase
        .from("deals")
        .insert({
          lead_id: lead.id,
          status,
          value: lead.purchaseValue || 0,
          date: new Date().toISOString(),
          note: note || null
        });

      if (error) throw error;
      console.log(`Deal ${status} criado para lead ${lead.id}`);
    } catch (error) {
      console.error("Erro ao criar deal:", error);
    }
  };

  // Função para mover lead entre estágios
  const moveLeadToStage = async (lead: KanbanLead, newColumnId: string, dealNote?: string) => {
    if (!funnelId) {
      toast.error("Funil não selecionado");
      return;
    }

    try {
      console.log(`Movendo lead ${lead.id} de ${lead.columnId} para ${newColumnId}`);
      
      // Verificar se está movendo para GANHO ou PERDIDO
      const targetStage = stages.find(s => s.id === newColumnId);
      const sourceStage = stages.find(s => s.id === lead.columnId);
      const isMovingToWonLost = targetStage && (targetStage.is_won || targetStage.is_lost);
      const isMovingFromWonLost = sourceStage && (sourceStage.is_won || sourceStage.is_lost);

      // Atualizar no banco - SEMPRE atualizar o kanban_stage_id
      const { error } = await supabase
        .from("leads")
        .update({ 
          kanban_stage_id: newColumnId,
          funnel_id: funnelId 
        })
        .eq("id", lead.id);

      if (error) throw error;

      console.log(`Lead ${lead.id} atualizado no banco para estágio ${newColumnId}`);

      // Criar deal se movendo para GANHO ou PERDIDO
      if (isMovingToWonLost && targetStage && !isMovingFromWonLost) {
        const dealStatus = targetStage.is_won ? "won" : "lost";
        await createDeal(lead, dealStatus, dealNote);
        console.log(`Deal ${dealStatus} criado para lead ${lead.id}`);
      }

      // Atualizar estado local se setColumns estiver disponível
      if (setColumns) {
        setColumns(prevColumns => 
          prevColumns.map(col => ({
            ...col,
            leads: col.id === lead.columnId
              ? col.leads.filter(l => l.id !== lead.id)
              : col.id === newColumnId
              ? [{ ...lead, columnId: newColumnId }, ...col.leads]
              : col.leads
          }))
        );
      }

      // Refetch dos dados para garantir sincronização
      if (refetchLeads) await refetchLeads();
      if (refetchStages) await refetchStages();

      // Toast de sucesso baseado no tipo de movimento
      if (isMovingFromWonLost && !isMovingToWonLost) {
        toast.success("Lead retornado ao funil com sucesso");
      } else if (isMovingToWonLost) {
        toast.success(`Lead movido para ${targetStage.is_won ? "Ganhos" : "Perdidos"}`);
      } else {
        toast.success("Lead movido com sucesso");
      }

    } catch (error) {
      console.error("Erro ao mover lead:", error);
      toast.error("Erro ao mover lead");
    }
  };

  // Função para adicionar nova coluna (estágio)
  const addColumn = async (title: string, color: string = "#e0e0e0") => {
    if (!funnelId) {
      toast.error("Funil não selecionado");
      return;
    }

    try {
      const maxOrder = Math.max(...stages.map(s => s.order_position), 0);
      
      const { error } = await supabase
        .from("kanban_stages")
        .insert({
          title,
          color,
          company_id: companyId,
          funnel_id: funnelId,
          order_position: maxOrder + 1,
          is_fixed: false,
          is_won: false,
          is_lost: false
        });

      if (error) throw error;

      if (refetchStages) await refetchStages();
      toast.success("Estágio adicionado com sucesso");
    } catch (error) {
      console.error("Erro ao adicionar estágio:", error);
      toast.error("Erro ao adicionar estágio");
    }
  };

  // Função para atualizar coluna (estágio)
  const updateColumn = async (updatedColumn: KanbanColumn) => {
    try {
      const { error } = await supabase
        .from("kanban_stages")
        .update({
          title: updatedColumn.title,
          color: updatedColumn.color
        })
        .eq("id", updatedColumn.id);

      if (error) throw error;

      if (refetchStages) await refetchStages();
      toast.success("Estágio atualizado com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar estágio:", error);
      toast.error("Erro ao atualizar estágio");
    }
  };

  // Função para deletar coluna (estágio)
  const deleteColumn = async (columnId: string) => {
    try {
      // Primeiro, mover todos os leads para o primeiro estágio disponível
      const firstStage = stages.find(s => !s.is_won && !s.is_lost);
      
      if (firstStage && firstStage.id !== columnId) {
        await supabase
          .from("leads")
          .update({ kanban_stage_id: firstStage.id })
          .eq("kanban_stage_id", columnId);
      }

      // Depois deletar o estágio
      const { error } = await supabase
        .from("kanban_stages")
        .delete()
        .eq("id", columnId);

      if (error) throw error;

      if (refetchStages) await refetchStages();
      if (refetchLeads) await refetchLeads();
      toast.success("Estágio removido com sucesso");
    } catch (error) {
      console.error("Erro ao remover estágio:", error);
      toast.error("Erro ao remover estágio");
    }
  };

  return {
    moveLeadToStage,
    addColumn,
    updateColumn,
    deleteColumn
  };
};
