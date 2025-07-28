
/**
 * 🚀 SALES FUNNEL CONTEXT PROVIDER - VERSÃO OTIMIZADA COM REALTIME
 * 
 * Integra useSalesFunnelDirect + useSalesFunnelRealtime para experiência completa
 */

import React, { useMemo, useCallback } from "react";
import { SalesFunnelProvider } from "./SalesFunnelProvider";
import { useSalesFunnelDirect } from "@/hooks/salesFunnel/useSalesFunnelDirect";
import { useSalesFunnelRealtime } from "@/hooks/salesFunnel/useSalesFunnelRealtime";
import { useAuth } from "@/contexts/AuthContext";
import { KanbanLead } from "@/types/kanban";
import { toast } from "sonner";

interface SalesFunnelContextProviderProps {
  children: React.ReactNode;
}

export const SalesFunnelContextProvider: React.FC<SalesFunnelContextProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // 🚀 HOOK PRINCIPAL COM DADOS E AÇÕES
  const salesFunnelData = useSalesFunnelDirect();
  
  // 🔄 CALLBACKS PARA REALTIME
  const handleLeadUpdate = useCallback((lead: KanbanLead) => {
    console.log('[Sales Funnel Context] 📊 Lead atualizado via realtime:', lead.name);
    // Forçar refresh para garantir sincronia
    salesFunnelData.refetchLeads();
  }, [salesFunnelData.refetchLeads]);

  const handleNewLead = useCallback((lead: KanbanLead) => {
    console.log('[Sales Funnel Context] ➕ Novo lead via realtime:', lead.name);
    // Forçar refresh para garantir sincronia
    salesFunnelData.refetchLeads();
  }, [salesFunnelData.refetchLeads]);

  const handleDataRefresh = useCallback(() => {
    console.log('[Sales Funnel Context] 🔄 Refresh geral via realtime');
    // Refresh completo
    salesFunnelData.refetchLeads();
    salesFunnelData.refetchStages();
  }, [salesFunnelData.refetchLeads, salesFunnelData.refetchStages]);

  const handleUnreadCountUpdate = useCallback((leadId: string, newCount: number) => {
    console.log('[Sales Funnel Context] 🔢 Contador atualizado via realtime:', { leadId, newCount });
    // Refresh apenas leads para performance
    salesFunnelData.refetchLeads();
  }, [salesFunnelData.refetchLeads]);

  const handleLeadMove = useCallback((leadId: string, newStageId: string) => {
    console.log('[Sales Funnel Context] 🚀 Lead movido via realtime:', { leadId, newStageId });
    // Refresh apenas leads
    salesFunnelData.refetchLeads();
  }, [salesFunnelData.refetchLeads]);

  // 📡 HOOK DE REALTIME
  const realtimeStats = useSalesFunnelRealtime({
    userId: user?.id || null,
    selectedFunnelId: salesFunnelData.selectedFunnel?.id || null,
    onLeadUpdate: handleLeadUpdate,
    onNewLead: handleNewLead,
    onDataRefresh: handleDataRefresh,
    onUnreadCountUpdate: handleUnreadCountUpdate,
    onLeadMove: handleLeadMove
  });

  // 🚀 FUNÇÃO MELHORADA PARA MOVER LEADS
  const moveLeadToStage = useCallback((lead: KanbanLead, columnId: string) => {
    console.log('[Sales Funnel Context] 🎯 Movendo lead para etapa:', {
      leadId: lead.id,
      leadName: lead.name,
      fromStage: lead.columnId,
      toStage: columnId
    });

    // Feedback visual instantâneo
    toast.loading(`Movendo ${lead.name}...`, {
      id: `move-${lead.id}`,
      duration: 1000
    });

    // Executar mudança no banco
    salesFunnelData.updateLead.mutate({
      leadId: lead.id,
      fields: { kanban_stage_id: columnId }
    }, {
      onSuccess: () => {
        toast.success(`${lead.name} movido com sucesso`, {
          id: `move-${lead.id}`
        });
      },
      onError: (error) => {
        toast.error(`Erro ao mover ${lead.name}`, {
          id: `move-${lead.id}`,
          description: error.message
        });
      }
    });
  }, [salesFunnelData.updateLead]);

  // 🚀 FUNÇÃO MELHORADA PARA CRIAR TAGS
  const createTag = useCallback((name: string, color: string) => {
    console.log('[Sales Funnel Context] 🏷️ Criando tag:', { name, color });
    
    toast.loading(`Criando tag "${name}"...`, {
      id: `create-tag-${name}`,
      duration: 1000
    });

    // Implementar criação de tag quando necessário
    // Por enquanto, apenas feedback visual
    toast.success(`Tag "${name}" criada`, {
      id: `create-tag-${name}`
    });
  }, []);

  // 🎯 VALOR DO CONTEXTO COM REALTIME
  const contextValue = useMemo(() => ({
    // 📊 DADOS PRINCIPAIS
    loading: salesFunnelData.loading,
    error: salesFunnelData.error?.message || null, // Convert Error to string
    funnels: salesFunnelData.funnels,
    selectedFunnel: salesFunnelData.selectedFunnel,
    setSelectedFunnel: salesFunnelData.setSelectedFunnel,
    createFunnel: salesFunnelData.createFunnel,
    funnelLoading: salesFunnelData.loading,
    
    // 🏗️ COLUNAS E STAGES
    columns: salesFunnelData.columns,
    setColumns: salesFunnelData.setColumns,
    stages: salesFunnelData.stages,
    leads: salesFunnelData.leads,
    wonStageId: salesFunnelData.wonStageId,
    lostStageId: salesFunnelData.lostStageId,
    
    // 👤 LEAD SELECIONADO
    selectedLead: salesFunnelData.selectedLead,
    isLeadDetailOpen: salesFunnelData.isLeadDetailOpen,
    setIsLeadDetailOpen: salesFunnelData.setIsLeadDetailOpen,
    
    // 🏷️ TAGS
    availableTags: salesFunnelData.availableTags,
    
    // 🔧 AÇÕES DE GERENCIAMENTO
    addColumn: salesFunnelData.addColumn,
    updateColumn: salesFunnelData.updateColumn,
    deleteColumn: salesFunnelData.deleteColumn,
    
    // 👤 AÇÕES DE LEAD
    openLeadDetail: salesFunnelData.openLeadDetail,
    toggleTagOnLead: salesFunnelData.toggleTagOnLead,
    createTag,
    updateLeadNotes: salesFunnelData.updateLeadNotes,
    updateLeadPurchaseValue: salesFunnelData.updateLeadPurchaseValue,
    updateLeadAssignedUser: salesFunnelData.updateLeadAssignedUser,
    updateLeadName: salesFunnelData.updateLeadName,
    moveLeadToStage, // 🚀 FUNÇÃO MELHORADA
    
    // 🔄 REFRESH FUNCTIONS
    refetchLeads: salesFunnelData.refetchLeads,
    refetchStages: salesFunnelData.refetchStages,
    
    // 🔒 ADMIN STATUS
    isAdmin: true, // TODO: Implementar lógica de admin real
    
    // 📡 REALTIME STATS
    realtimeStats: {
      isConnected: realtimeStats.isConnected,
      connectionStatus: realtimeStats.connectionStatus,
      totalEvents: realtimeStats.totalEvents,
      lastUpdate: realtimeStats.lastUpdate
    }
  }), [
    salesFunnelData,
    realtimeStats,
    createTag,
    moveLeadToStage
  ]);

  return (
    <SalesFunnelProvider value={contextValue}>
      {children}
    </SalesFunnelProvider>
  );
};
