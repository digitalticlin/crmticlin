import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSalesFunnelContext } from "./SalesFunnelProvider";
import { SalesFunnelHeader } from "./SalesFunnelHeader";
import { SalesFunnelControls } from "./SalesFunnelControls";
import { KanbanBoard } from "../KanbanBoard";
import { LeadDetail } from "../LeadDetail";
import { WonLostView } from "../WonLostView";
import { KanbanLead } from "@/types/kanban";
import { toast } from "sonner";
import { SalesFunnelSyncIndicator } from "./SalesFunnelSyncIndicator";
import { SalesFunnelToastManager } from "./SalesFunnelToastManager";

export const SalesFunnelContent = () => {
  const navigate = useNavigate();
  const {
    // Estado de carregamento
    loading,
    error,
    funnelLoading,

    // Dados do funil
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,

    // Dados das colunas e leads
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    stages,
    leads,
    wonStageId,
    lostStageId,

    // Ações
    addColumn,
    updateColumn,
    deleteColumn,
    openLeadDetail,
    toggleTagOnLead,
    createTag,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    moveLeadToStage,

    // Refresh functions
    refetchLeads,
    refetchStages,

    // 📡 REALTIME STATS
    realtimeStats
  } = useSalesFunnelContext();

  // Estado local para view
  const [isWonLostView, setIsWonLostView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 🚀 FUNÇÃO CORRIGIDA: Aceitar leadId em vez de lead completo
  const handleOpenChat = useCallback((leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
      toast.error("Lead não encontrado");
      return;
    }

    console.log('[SalesFunnelContent] 💬 Abrindo chat do WhatsApp para lead:', {
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone
    });

    // Navegar para WhatsApp Chat com leadId
    navigate(`/whatsapp-chat?leadId=${lead.id}`);

    toast.success(`Abrindo chat com ${lead.name}`, {
      description: "Redirecionando para o WhatsApp..."
    });
  }, [navigate, leads]);

  // Função auxiliar para uso em outros componentes que ainda passam KanbanLead
  const handleOpenChatWithLead = useCallback((lead: KanbanLead) => {
    handleOpenChat(lead.id);
  }, [handleOpenChat]);

  // 🚀 HANDLER PARA MOVER LEADS WON/LOST
  const handleMoveToWonLost = useCallback((lead: KanbanLead, status: "won" | "lost") => {
    const targetStageId = status === "won" ? wonStageId : lostStageId;
    
    if (!targetStageId) {
      toast.error(`Etapa de ${status === "won" ? "ganho" : "perda"} não encontrada`);
      return;
    }

    console.log('[SalesFunnelContent] 🎯 Movendo lead para Won/Lost:', {
      leadId: lead.id,
      leadName: lead.name,
      status,
      targetStageId
    });

    // Usar função do contexto com feedback visual
    moveLeadToStage(lead, targetStageId);
  }, [wonStageId, lostStageId, moveLeadToStage]);

  // 🔄 HANDLER PARA RETORNAR AO FUNIL
  const handleReturnToFunnel = useCallback((lead: KanbanLead) => {
    console.log('[SalesFunnelContent] 🔄 Retornando lead ao funil:', {
      leadId: lead.id,
      leadName: lead.name,
      currentStageId: lead.columnId
    });

    // Encontrar primeira etapa não-won/lost
    const firstStage = stages.find(stage => !stage.is_won && !stage.is_lost);
    
    if (!firstStage) {
      toast.error("Nenhuma etapa válida encontrada para retorno");
      return;
    }

    // Usar função do contexto
    moveLeadToStage(lead, firstStage.id);
  }, [stages, moveLeadToStage]);

  // 🔄 HANDLER PARA MUDANÇA DE COLUNAS
  const handleColumnsChange = useCallback((newColumns: typeof columns) => {
    console.log('[SalesFunnelContent] 🔄 Colunas alteradas:', {
      oldCount: columns.length,
      newCount: newColumns.length
    });

    setColumns(newColumns);

    // Detectar mudanças de posição de leads
    const leadMoves = [];
    newColumns.forEach(newColumn => {
      const oldColumn = columns.find(col => col.id === newColumn.id);
      if (oldColumn) {
        newColumn.leads.forEach(lead => {
          const wasInOldColumn = oldColumn.leads.find(oldLead => oldLead.id === lead.id);
          if (!wasInOldColumn) {
            leadMoves.push({ lead, newStageId: newColumn.id });
          }
        });
      }
    });

    // Executar mudanças no banco
    leadMoves.forEach(({ lead, newStageId }) => {
      moveLeadToStage(lead, newStageId);
    });
  }, [columns, setColumns, moveLeadToStage]);

  // 🔄 SYNC AUTOMÁTICO COM WHATSAPP
  useEffect(() => {
    // Sincronizar contadores de mensagens não lidas
    if (stages.length > 0 && leads.length > 0) {
      console.log('[SalesFunnelContent] 🔄 Sincronizando contadores com WhatsApp');
      // Implementar sincronização quando necessário
    }
  }, [stages, refetchLeads, refetchStages]);

  // Renderização condicional com base no loading e error
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando funil de vendas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar funil de vendas</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📡 TOAST MANAGER */}
      <SalesFunnelToastManager enabled={true} />

      {/* 📡 INDICADOR DE SINCRONIZAÇÃO */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <SalesFunnelHeader
            funnels={funnels}
            selectedFunnel={selectedFunnel}
            onFunnelChange={setSelectedFunnel}
            onCreateFunnel={createFunnel}
            isLoading={funnelLoading}
          />
        </div>
        
        <SalesFunnelSyncIndicator
          isConnected={realtimeStats.isConnected}
          connectionStatus={realtimeStats.connectionStatus}
          totalEvents={realtimeStats.totalEvents}
          lastUpdate={realtimeStats.lastUpdate}
          className="ml-auto"
        />
      </div>

      {/* 🎛️ CONTROLES */}
      <SalesFunnelControls
        isWonLostView={isWonLostView}
        onToggleWonLostView={setIsWonLostView}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddColumn={addColumn}
        leadsCount={leads.length}
        columnsCount={columns.length}
      />

      {/* 📊 KANBAN BOARD OU WON/LOST VIEW */}
      {!isWonLostView ? (
        <KanbanBoard
          columns={columns}
          onColumnsChange={handleColumnsChange}
          onOpenLeadDetail={openLeadDetail}
          onColumnUpdate={updateColumn}
          onColumnDelete={deleteColumn}
          onOpenChat={handleOpenChatWithLead}
          onMoveToWonLost={handleMoveToWonLost}
          wonStageId={wonStageId}
          lostStageId={lostStageId}
        />
      ) : (
        <WonLostView
          columns={columns}
          stages={stages}
          leads={leads}
          onOpenLeadDetail={openLeadDetail}
          onReturnToFunnel={handleReturnToFunnel}
          onOpenChat={handleOpenChatWithLead}
          wonStageId={wonStageId}
          lostStageId={lostStageId}
          searchTerm={searchTerm}
        />
      )}

      {/* 📋 LEAD DETAIL MODAL */}
      {isLeadDetailOpen && selectedLead && (
        <LeadDetail
          lead={selectedLead}
          isOpen={isLeadDetailOpen}
          onClose={() => setIsLeadDetailOpen(false)}
          onToggleTag={toggleTagOnLead}
          onCreateTag={createTag}
          onUpdateNotes={updateLeadNotes}
          onUpdatePurchaseValue={updateLeadPurchaseValue}
          onUpdateAssignedUser={updateLeadAssignedUser}
          onUpdateName={updateLeadName}
          availableTags={availableTags}
        />
      )}
    </div>
  );
};
