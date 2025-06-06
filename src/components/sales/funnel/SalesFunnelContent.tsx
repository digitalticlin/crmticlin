
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { KanbanLead } from "@/types/kanban";
import { useWonLostFilters } from "@/hooks/salesFunnel/useWonLostFilters";
import { KanbanBoard } from "@/components/sales/KanbanBoard";
import { LeadDetailSidebar } from "@/components/sales/LeadDetailSidebar";
import { ModernFunnelHeader } from "@/components/sales/funnel/ModernFunnelHeader";
import { ModernFunnelControlBar } from "@/components/sales/funnel/ModernFunnelControlBar";
import { SelectStageModal } from "@/components/sales/funnel/modals/SelectStageModal";
import { DealNoteModal } from "@/components/sales/funnel/modals/DealNoteModal";
import { useSalesFunnelContext } from "./SalesFunnelProvider";

export const SalesFunnelContent = () => {
  const [activeTab, setActiveTab] = useState("funnel");
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isDealNoteModalOpen, setIsDealNoteModalOpen] = useState(false);
  const [leadToMove, setLeadToMove] = useState<KanbanLead | null>(null);
  const [pendingDealMove, setPendingDealMove] = useState<{lead: KanbanLead, status: "won" | "lost"} | null>(null);
  const navigate = useNavigate();
  
  const {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    stages,
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
    isAdmin,
    wonStageId,
    lostStageId,
    leads,
    refetchLeads,
    refetchStages
  } = useSalesFunnelContext();

  // Buscar leads das etapas GANHO e PERDIDO diretamente dos leads totais
  const wonLostLeads = leads?.filter(lead => {
    const leadStage = stages?.find(stage => stage.id === lead.columnId);
    return leadStage && (leadStage.title === "GANHO" || leadStage.title === "PERDIDO");
  }) || [];

  // Hook para filtros na página Ganhos e Perdidos
  const wonLostFilters = useWonLostFilters(wonLostLeads, availableTags);

  // Filtrar colunas para mostrar apenas Ganhos e Perdidos na aba won-lost
  const displayColumns = activeTab === "won-lost" 
    ? stages
        ?.filter(stage => stage.title === "GANHO" || stage.title === "PERDIDO")
        .map(stage => {
          // Buscar leads reais dessa stage diretamente dos leads totais
          const stageLeads = leads?.filter(lead => lead.columnId === stage.id) || [];
          
          return {
            id: stage.id,
            title: stage.title,
            leads: stageLeads,
            color: stage.color || "#e0e0e0",
            isFixed: stage.is_fixed || false,
            isHidden: false
          };
        }) || []
    : columns;

  const handleOpenChat = (lead: KanbanLead) => {
    navigate(`/whatsapp-chat?leadId=${lead.id}`);
  };

  const handleMoveToWonLost = async (lead: KanbanLead, status: "won" | "lost") => {
    setPendingDealMove({ lead, status });
    setIsDealNoteModalOpen(true);
  };

  const handleDealNoteConfirm = async (note: string) => {
    if (!pendingDealMove) return;

    const { lead, status } = pendingDealMove;
    const targetStage = stages?.find(stage => 
      status === "won" ? stage.is_won : stage.is_lost
    );
    
    if (targetStage) {
      await moveLeadToStage(lead, targetStage.id, note);
      await refetchLeads();
      toast.success(`Lead movido para ${status === "won" ? "Ganhos" : "Perdidos"}`);
    }

    setIsDealNoteModalOpen(false);
    setPendingDealMove(null);
  };

  const handleReturnToFunnel = (lead: KanbanLead) => {
    setLeadToMove(lead);
    setIsStageModalOpen(true);
  };

  const handleStageSelection = async (lead: KanbanLead, stageId: string) => {
    await moveLeadToStage(lead, stageId);
    await refetchLeads();
    await refetchStages();
    toast.success("Lead retornado para o funil");
  };

  const handleCreateFunnel = async (name: string, description?: string): Promise<void> => {
    await createFunnel(name, description);
  };

  const handleColumnsChange = (newColumns: any[]) => {
    console.log("Aplicando atualização otimista das colunas:", newColumns);
    setColumns(newColumns);
  };

  return (
    <div className="space-y-6">
      {/* Header Moderno */}
      <ModernFunnelHeader 
        selectedFunnel={selectedFunnel!}
        totalLeads={columns.reduce((acc, col) => acc + col.leads.length, 0)}
        wonLeads={wonLostLeads.filter(lead => {
          const leadStage = stages?.find(stage => stage.id === lead.columnId);
          return leadStage?.title === "GANHO";
        }).length}
        lostLeads={wonLostLeads.filter(lead => {
          const leadStage = stages?.find(stage => stage.id === lead.columnId);
          return leadStage?.title === "PERDIDO";
        }).length}
        activeTab={activeTab}
      />

      {/* Barra de Controles Moderna */}
      <ModernFunnelControlBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddColumn={() => addColumn("Nova etapa")}
        onManageTags={() => {}}
        onAddLead={() => {}}
        funnels={funnels}
        selectedFunnel={selectedFunnel}
        onSelectFunnel={setSelectedFunnel}
        onCreateFunnel={handleCreateFunnel}
        isAdmin={isAdmin}
        wonLostFilters={activeTab === "won-lost" ? {
          searchTerm: wonLostFilters.searchTerm,
          setSearchTerm: wonLostFilters.setSearchTerm,
          selectedTags: wonLostFilters.selectedTags,
          setSelectedTags: wonLostFilters.setSelectedTags,
          selectedUser: wonLostFilters.selectedUser,
          setSelectedUser: wonLostFilters.setSelectedUser,
          availableTags,
          availableUsers: wonLostFilters.availableUsers,
          onClearFilters: wonLostFilters.clearAllFilters,
          resultsCount: wonLostFilters.resultsCount
        } : undefined}
      />
      
      {/* Board do Kanban - com atualização otimista */}
      <KanbanBoard
        columns={displayColumns}
        onColumnsChange={handleColumnsChange}
        onOpenLeadDetail={openLeadDetail}
        onColumnUpdate={activeTab === "funnel" ? updateColumn : undefined}
        onColumnDelete={activeTab === "funnel" ? deleteColumn : undefined}
        onOpenChat={handleOpenChat}
        onMoveToWonLost={handleMoveToWonLost}
        onReturnToFunnel={handleReturnToFunnel}
        isWonLostView={activeTab === "won-lost"}
        wonStageId={wonStageId}
        lostStageId={lostStageId}
      />

      {/* Modal de Seleção de Etapa */}
      <SelectStageModal
        isOpen={isStageModalOpen}
        onClose={() => {
          setIsStageModalOpen(false);
          setLeadToMove(null);
        }}
        lead={leadToMove}
        stages={stages || []}
        onSelectStage={handleStageSelection}
      />

      {/* Modal de Observação do Deal */}
      <DealNoteModal
        isOpen={isDealNoteModalOpen}
        onClose={() => {
          setIsDealNoteModalOpen(false);
          setPendingDealMove(null);
        }}
        onConfirm={handleDealNoteConfirm}
        dealType={pendingDealMove?.status || "won"}
        leadName={pendingDealMove?.lead.name || ""}
      />

      {/* Sidebar de Detalhes */}
      <LeadDetailSidebar
        isOpen={isLeadDetailOpen}
        onOpenChange={setIsLeadDetailOpen}
        selectedLead={selectedLead}
        availableTags={availableTags}
        onToggleTag={(tagId) => selectedLead && toggleTagOnLead(selectedLead.id, tagId)}
        onUpdateNotes={updateLeadNotes}
        onCreateTag={createTag}
        onUpdatePurchaseValue={updateLeadPurchaseValue}
        onUpdateAssignedUser={updateLeadAssignedUser}
        onUpdateName={updateLeadName}
      />
    </div>
  );
};
