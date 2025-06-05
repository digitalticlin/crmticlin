
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
    isAdmin
  } = useSalesFunnelContext();

  // Obter leads das colunas Ganho e Perdido para os filtros
  const wonLostLeads = columns
    .filter(col => col.title === "GANHO" || col.title === "PERDIDO")
    .flatMap(col => col.leads);

  // Hook para filtros na página Ganhos e Perdidos
  const wonLostFilters = useWonLostFilters(wonLostLeads, availableTags);

  // Filtrar colunas para mostrar apenas Ganhos e Perdidos na aba won-lost
  const displayColumns = activeTab === "won-lost" 
    ? columns
        .filter(col => col.title === "GANHO" || col.title === "PERDIDO")
        .map(col => ({
          ...col,
          leads: wonLostFilters.filteredLeads.filter(lead => lead.columnId === col.id)
        }))
    : columns;

  const handleOpenChat = (lead: KanbanLead) => {
    navigate(`/whatsapp-chat?leadId=${lead.id}`);
  };

  const handleMoveToWonLost = async (lead: KanbanLead, status: "won" | "lost") => {
    const targetColumn = columns.find(col => 
      status === "won" ? col.title === "GANHO" : col.title === "PERDIDO"
    );
    
    if (targetColumn) {
      await moveLeadToStage(lead, targetColumn.id);
      toast.success(`Lead movido para ${status === "won" ? "Ganhos" : "Perdidos"}`);
    }
  };

  const returnLeadToFunnel = async (lead: KanbanLead) => {
    const targetColumn = columns.find(col => col.title === "ENTRADA DE LEAD");
    
    if (targetColumn) {
      await moveLeadToStage(lead, targetColumn.id);
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
        wonLeads={columns.find(col => col.title === "GANHO")?.leads.length || 0}
        lostLeads={columns.find(col => col.title === "PERDIDO")?.leads.length || 0}
        activeTab={activeTab}
      />

      {/* Barra de Controles Moderna */}
      <ModernFunnelControlBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddColumn={() => addColumn("Nova etapa")}
        onManageTags={() => toast.info("Gerenciar etiquetas (em breve!)")}
        onAddLead={() => toast.info("Adicionar lead (em breve!)")}
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
