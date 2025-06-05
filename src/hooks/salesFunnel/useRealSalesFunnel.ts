import { useState, useEffect } from "react";
import { useCompanyData } from "../useCompanyData";
import { useStageDatabase } from "./useStageDatabase";
import { useLeadsDatabase } from "./useLeadsDatabase";
import { useTagDatabase } from "./useTagDatabase";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRealSalesFunnel = (funnelId?: string) => {
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);

  const { companyId } = useCompanyData();
  const { stages, refetchStages } = useStageDatabase(funnelId);
  const { leads, refetchLeads, updateLead, addTagToLead, removeTagFromLead } = useLeadsDatabase(funnelId);
  const { tags, createTag } = useTagDatabase(companyId);

  // Converter stages e leads do banco para formato de colunas do Kanban
  useEffect(() => {
    if (!stages.length || !funnelId) {
      setColumns([]);
      return;
    }

    const newColumns: KanbanColumn[] = stages.map(stage => {
      const stageLeads = leads.filter(lead => lead.columnId === stage.id);
      
      return {
        id: stage.id,
        title: stage.title,
        leads: stageLeads,
        color: stage.color || "#e0e0e0",
        isFixed: stage.is_fixed || false,
        isHidden: false
      };
    });

    setColumns(newColumns);
  }, [stages, leads, funnelId]);

  // Função para abrir detalhes do lead
  const openLeadDetail = (lead: KanbanLead) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  };

  // Função para mover lead entre estágios
  const moveLeadToStage = async (lead: KanbanLead, newColumnId: string) => {
    if (!funnelId) {
      toast.error("Funil não selecionado");
      return;
    }

    try {
      // Atualizar no banco
      const { error } = await supabase
        .from("leads")
        .update({ 
          kanban_stage_id: newColumnId,
          funnel_id: funnelId 
        })
        .eq("id", lead.id);

      if (error) throw error;

      // Atualizar estado local
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

      toast.success("Lead movido com sucesso");
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

      await refetchStages();
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

      await refetchStages();
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

      await refetchStages();
      await refetchLeads();
      toast.success("Estágio removido com sucesso");
    } catch (error) {
      console.error("Erro ao remover estágio:", error);
      toast.error("Erro ao remover estágio");
    }
  };

  // Função para gerenciar tags do lead
  const toggleTagOnLead = async (leadId: string, tagId: string) => {
    if (!selectedLead) return;

    const hasTag = selectedLead.tags.some(tag => tag.id === tagId);

    try {
      if (hasTag) {
        await removeTagFromLead({ leadId, tagId });
      } else {
        await addTagToLead({ leadId, tagId });
      }

      // Atualizar lead selecionado
      const updatedLead = {
        ...selectedLead,
        tags: hasTag 
          ? selectedLead.tags.filter(tag => tag.id !== tagId)
          : [...selectedLead.tags, tags.find(tag => tag.id === tagId)!]
      };
      
      setSelectedLead(updatedLead);
      await refetchLeads();
    } catch (error) {
      console.error("Erro ao gerenciar tag:", error);
      toast.error("Erro ao atualizar tag");
    }
  };

  // Funções para atualizar dados do lead
  const updateLeadNotes = async (notes: string) => {
    if (!selectedLead) return;
    
    try {
      await updateLead({ leadId: selectedLead.id, fields: { notes } });
      setSelectedLead({ ...selectedLead, notes });
    } catch (error) {
      toast.error("Erro ao atualizar observações");
    }
  };

  const updateLeadPurchaseValue = async (purchaseValue: number | undefined) => {
    if (!selectedLead) return;
    
    try {
      await updateLead({ leadId: selectedLead.id, fields: { purchaseValue } });
      setSelectedLead({ ...selectedLead, purchaseValue });
    } catch (error) {
      toast.error("Erro ao atualizar valor de compra");
    }
  };

  const updateLeadAssignedUser = async (assignedUser: string) => {
    if (!selectedLead) return;
    
    try {
      await updateLead({ leadId: selectedLead.id, fields: { assignedUser } });
      setSelectedLead({ ...selectedLead, assignedUser });
    } catch (error) {
      toast.error("Erro ao atualizar usuário responsável");
    }
  };

  const updateLeadName = async (name: string) => {
    if (!selectedLead) return;
    
    try {
      await updateLead({ leadId: selectedLead.id, fields: { name } });
      setSelectedLead({ ...selectedLead, name });
    } catch (error) {
      toast.error("Erro ao atualizar nome");
    }
  };

  // Função para receber novo lead (usado quando vem do chat)
  const receiveNewLead = async (leadData: Partial<KanbanLead>) => {
    if (!funnelId) return;

    const entryStage = stages.find(s => s.title === "ENTRADA DE LEAD");
    if (!entryStage) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({
          kanban_stage_id: entryStage.id,
          funnel_id: funnelId
        })
        .eq("id", leadData.id);

      if (error) throw error;

      await refetchLeads();
      toast.success("Novo lead adicionado ao funil");
    } catch (error) {
      console.error("Erro ao adicionar lead ao funil:", error);
    }
  };

  return {
    // Estado
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    
    // Dados do funil
    stages,
    leads,
    availableTags: tags,
    
    // Ações do funil
    addColumn,
    updateColumn,
    deleteColumn,
    moveLeadToStage,
    
    // Ações do lead
    openLeadDetail,
    toggleTagOnLead,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    receiveNewLead,
    
    // Ações de tag
    createTag,
    
    // Funções de refresh
    refetchStages,
    refetchLeads
  };
};
