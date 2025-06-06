import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { KanbanLead } from "@/types/kanban";
import { useWonLostFilters } from "@/hooks/salesFunnel/useWonLostFilters";
import { KanbanBoard } from "@/components/sales/KanbanBoard";
import { LeadDetailSidebar } from "@/components/sales/LeadDetailSidebar";
import { ModernFunnelHeader } from "@/components/sales/funnel/ModernFunnelHeader";
import { ModernFunnelControlBar } from "@/components/sales/funnel/ModernFunnelControlBar";
import { useSalesFunnelContext } from "./SalesFunnelProvider";

export const SalesFunnelContent = () => {
  const [activeTab, setActiveTab] = useState("funnel");
  const navigate = useNavigate();
  
  const {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    columns,
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
    lostStageId
  } = useSalesFunnelContext();

  // Obter leads das colunas Ganho e Perdido para os filtros
  const wonLostLeads = stages
    ?.filter(stage => stage.title === "GANHO" || stage.title === "PERDIDO")
    .flatMap(stage => {
      // Buscar leads dessa stage no contexto completo
      return []; // TODO: implementar busca dos leads de ganho/perdido
    }) || [];

  // Hook para filtros na página Ganhos e Perdidos
  const wonLostFilters = useWonLostFilters(wonLostLeads, availableTags);

  // Filtrar colunas para mostrar apenas Ganhos e Perdidos na aba won-lost
  const displayColumns = activeTab === "won-lost" 
    ? stages
        ?.filter(stage => stage.title === "GANHO" || stage.title === "PERDIDO")
        .map(stage => ({
          id: stage.id,
          title: stage.title,
          leads: [], // TODO: buscar leads dessas stages
          color: stage.color || "#e0e0e0",
          isFixed: stage.is_fixed || false,
          isHidden: false
        })) || []
    : columns;

  const handleOpenChat = (lead: KanbanLead) => {
    navigate(`/whatsapp-chat?leadId=${lead.id}`);
  };

  const handleMoveToWonLost = async (lead: KanbanLead, status: "won" | "lost") => {
    const targetStage = stages?.find(stage => 
      status === "won" ? stage.is_won : stage.is_lost
    );
    
    if (targetStage) {
      await moveLeadToStage(lead, targetStage.id);
      toast.success(`Lead movido para ${status === "won" ? "Ganhos" : "Perdidos"}`);
    }
  };

  const returnLeadToFunnel = async (lead: KanbanLead) => {
    const targetStage = stages?.find(stage => stage.title === "ENTRADA DE LEAD");
    
    if (targetStage) {
      await moveLeadToStage(lead, targetStage.id);
      toast.success("Lead retornado para o funil");
    }
  };

  const handleCreateFunnel = async (name: string, description?: string): Promise<void> => {
    await createFunnel(name, description);
  };

  return (
    <div className="space-y-6">
      {/* Header Moderno */}
      <ModernFunnelHeader 
        selectedFunnel={selectedFunnel!}
        totalLeads={columns.reduce((acc, col) => acc + col.leads.length, 0)}
        wonLeads={0}
        lostLeads={0}
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
      
      {/* Board do Kanban - sem card de fundo */}
      <KanbanBoard
        columns={displayColumns}
        onColumnsChange={() => {}}
        onOpenLeadDetail={openLeadDetail}
        onColumnUpdate={activeTab === "funnel" ? updateColumn : undefined}
        onColumnDelete={activeTab === "funnel" ? deleteColumn : undefined}
        onOpenChat={handleOpenChat}
        onMoveToWonLost={handleMoveToWonLost}
        onReturnToFunnel={returnLeadToFunnel}
        isWonLostView={activeTab === "won-lost"}
        wonStageId={wonStageId}
        lostStageId={lostStageId}
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
