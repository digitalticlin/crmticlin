import { ReactNode, useEffect, useState } from "react";
import { SalesFunnelProvider } from "./SalesFunnelProvider";
import { useSalesFunnelOptimized } from "@/hooks/salesFunnel/useSalesFunnelOptimized";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SalesFunnelContextProviderProps {
  children: ReactNode;
}

export const SalesFunnelContextProvider = ({ children }: SalesFunnelContextProviderProps) => {
  const { user } = useAuth();
  const salesFunnelData = useSalesFunnelOptimized();
  const { isAdmin } = useUserRole();
  const [isInitialized, setIsInitialized] = useState(false);

  console.log('[SalesFunnelContextProvider] 📊 Estado atual (OTIMIZADO):', {
    loading: salesFunnelData.loading,
    funnelsCount: salesFunnelData.funnels?.length || 0,
    selectedFunnel: salesFunnelData.selectedFunnel?.name || 'None',
    stagesCount: salesFunnelData.stages?.length || 0,
    leadsCount: salesFunnelData.leads?.length || 0,
    columnsCount: salesFunnelData.columns?.length || 0,
    isInitialized
  });

  // Auto-selecionar primeiro funil se necessário
  useEffect(() => {
    if (!salesFunnelData.loading && 
        !salesFunnelData.selectedFunnel && 
        salesFunnelData.funnels && 
        salesFunnelData.funnels.length > 0) {
      console.log('[SalesFunnelContextProvider] 🔄 Auto-selecionando primeiro funil');
      salesFunnelData.setSelectedFunnel(salesFunnelData.funnels[0]);
    }
    
    // Marcar como inicializado após primeiro load
    if (!salesFunnelData.loading && !isInitialized) {
      setIsInitialized(true);
    }
  }, [
    salesFunnelData.loading,
    salesFunnelData.selectedFunnel,
    salesFunnelData.funnels,
    salesFunnelData.setSelectedFunnel,
    isInitialized
  ]);

  // 🚀 IMPLEMENTAÇÃO REAL: Adicionar nova etapa no banco de dados
  const addColumnWrapper = async (title: string, color: string = "#3b82f6"): Promise<void> => {
    console.log('[SalesFunnelContextProvider] ➕ Criando nova etapa:', { title, color });
    
    if (!user?.id || !salesFunnelData.selectedFunnel?.id) {
      toast.error("Usuário ou funil não selecionado");
      return;
    }

    try {
      // Calcular próxima posição (maior posição + 1)
      const maxPosition = Math.max(
        ...(salesFunnelData.stages?.map(s => s.order_position || 0) || [0])
      );
      const nextPosition = maxPosition + 1;

      // Inserir nova etapa no banco
      const { data: newStage, error } = await supabase
        .from('kanban_stages')
        .insert([{
          title: title.trim(),
          color: color,
          order_position: nextPosition,
          funnel_id: salesFunnelData.selectedFunnel.id,
          created_by_user_id: user.id,
          is_fixed: false,
          is_won: false,
          is_lost: false
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('[SalesFunnelContextProvider] ✅ Etapa criada:', newStage);
      
      toast.success(`Etapa "${title}" criada com sucesso!`, {
        description: "A nova etapa já está disponível no funil"
      });

      // Refrescar dados
      if (salesFunnelData.refetchStages) {
        await salesFunnelData.refetchStages();
      }

    } catch (error: any) {
      console.error('[SalesFunnelContextProvider] ❌ Erro ao criar etapa:', error);
      toast.error("Erro ao criar etapa", {
        description: error.message || "Tente novamente"
      });
      throw error;
    }
  };

  // 🚀 IMPLEMENTAÇÃO REAL: Atualizar etapa existente no banco de dados
  const updateColumnWrapper = async (column: any): Promise<void> => {
    console.log('[SalesFunnelContextProvider] ✏️ Atualizando etapa:', { 
      id: column.id,
      title: column.title, 
      color: column.color 
    });
    
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      // Atualizar etapa no banco
      const { error } = await supabase
        .from('kanban_stages')
        .update({
          title: column.title.trim(),
          color: column.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', column.id)
        .eq('created_by_user_id', user.id); // Segurança adicional

      if (error) throw error;

      console.log('[SalesFunnelContextProvider] ✅ Etapa atualizada:', column.title);
      
      toast.success(`Etapa "${column.title}" atualizada com sucesso!`, {
        description: "As alterações foram salvas"
      });

      // Refrescar dados
      if (salesFunnelData.refetchStages) {
        await salesFunnelData.refetchStages();
      }

    } catch (error: any) {
      console.error('[SalesFunnelContextProvider] ❌ Erro ao atualizar etapa:', error);
      toast.error("Erro ao atualizar etapa", {
        description: error.message || "Tente novamente"
      });
      throw error;
    }
  };

  // 🚀 IMPLEMENTAÇÃO REAL: Excluir etapa do banco de dados
  const deleteColumnWrapper = async (columnId: string): Promise<void> => {
    console.log('[SalesFunnelContextProvider] 🗑️ Excluindo etapa:', columnId);
    
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      // Verificar se a etapa tem leads associados
      const { data: leadsCount, error: countError } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('kanban_stage_id', columnId);

      if (countError) throw countError;

      if (leadsCount && leadsCount.length > 0) {
        toast.error("Não é possível excluir etapa com leads", {
          description: `Esta etapa possui ${leadsCount.length} lead(s). Mova-os primeiro.`
        });
        return;
      }

      // Excluir etapa do banco
      const { error } = await supabase
        .from('kanban_stages')
        .delete()
        .eq('id', columnId)
        .eq('created_by_user_id', user.id); // Segurança adicional

      if (error) throw error;

      console.log('[SalesFunnelContextProvider] ✅ Etapa excluída:', columnId);
      
      toast.success("Etapa excluída com sucesso!", {
        description: "A etapa foi removida do funil"
      });

      // Refrescar dados
      if (salesFunnelData.refetchStages) {
        await salesFunnelData.refetchStages();
      }

    } catch (error: any) {
      console.error('[SalesFunnelContextProvider] ❌ Erro ao excluir etapa:', error);
      toast.error("Erro ao excluir etapa", {
        description: error.message || "Tente novamente"
      });
      throw error;
    }
  };

  const createTagWrapper = (name: string, color: string) => {
    console.log('[SalesFunnelContextProvider] 🏷️ Criando tag:', name, color);
    // Por agora apenas log - pode implementar depois
  };

  const moveLeadToStageWrapper = (lead: any, columnId: string) => {
    console.log('[SalesFunnelContextProvider] 🔄 Movendo lead:', lead.name, 'para', columnId);
    // Por agora apenas log - pode implementar depois
  };

  // SEMPRE fornecer um contexto válido - nunca retornar early
  const contextValue = {
    // Estado de carregamento
    loading: salesFunnelData.loading || false,
    error: salesFunnelData.error || null,
    
    // Funnel data - sempre disponível com fallbacks
    funnels: salesFunnelData.funnels || [],
    selectedFunnel: salesFunnelData.selectedFunnel || null,
    setSelectedFunnel: salesFunnelData.setSelectedFunnel,
    createFunnel: salesFunnelData.createFunnel,
    funnelLoading: salesFunnelData.loading || false,
    
    // Dados com fallbacks seguros - Transform raw database leads to KanbanLead format
    columns: (salesFunnelData.columns || []).map(column => ({
      ...column,
      ai_enabled: column.ai_enabled !== false // Garantir que ai_enabled está presente
    })),
    setColumns: salesFunnelData.setColumns || (() => {}),
    selectedLead: salesFunnelData.selectedLead || null,
    isLeadDetailOpen: salesFunnelData.isLeadDetailOpen || false,
    setIsLeadDetailOpen: salesFunnelData.setIsLeadDetailOpen || (() => {}),
    availableTags: salesFunnelData.availableTags || [],
    stages: salesFunnelData.stages || [],
    leads: (salesFunnelData.leads || []).map(lead => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email || undefined,
      company: lead.company || undefined,
      lastMessage: lead.last_message || "Sem mensagens",
      lastMessageTime: lead.last_message_time ? new Date(lead.last_message_time).toISOString() : new Date().toISOString(),
      tags: [],
      notes: lead.notes || undefined,
      columnId: lead.kanban_stage_id || undefined,
      purchaseValue: lead.purchase_value ? Number(lead.purchase_value) : undefined,
      assignedUser: lead.owner_id || undefined,
      unreadCount: lead.unread_count || 0,
      avatar: undefined,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      company_id: undefined,
      whatsapp_number_id: lead.whatsapp_number_id || undefined,
      funnel_id: lead.funnel_id,
      kanban_stage_id: lead.kanban_stage_id || undefined,
      owner_id: lead.owner_id || undefined
    })),
    
    // Ações sempre disponíveis (com retorno Promise<void> correto)
    addColumn: addColumnWrapper,
    updateColumn: updateColumnWrapper,
    deleteColumn: deleteColumnWrapper,
    openLeadDetail: salesFunnelData.openLeadDetail || (() => {}),
    toggleTagOnLead: salesFunnelData.toggleTagOnLead || (() => {}),
    createTag: createTagWrapper,
    updateLeadNotes: salesFunnelData.updateLeadNotes || (() => {}),
    updateLeadPurchaseValue: salesFunnelData.updateLeadPurchaseValue || (() => {}),
    updateLeadAssignedUser: salesFunnelData.updateLeadAssignedUser || (() => {}),
    updateLeadName: salesFunnelData.updateLeadName || (() => {}),
    moveLeadToStage: moveLeadToStageWrapper,
    isAdmin: isAdmin || false,
    wonStageId: salesFunnelData.wonStageId,
    lostStageId: salesFunnelData.lostStageId,
    refetchLeads: salesFunnelData.refetchLeads || (async () => {}),
    refetchStages: salesFunnelData.refetchStages || (async () => {})
  };

  console.log('[SalesFunnelContextProvider] ✅ Fornecendo contexto OTIMIZADO estável');

  return (
    <SalesFunnelProvider value={contextValue}>
      {children}
    </SalesFunnelProvider>
  );
};
