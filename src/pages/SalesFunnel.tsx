
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useRealSalesFunnel } from "@/hooks/salesFunnel/useRealSalesFunnel";
import { useNewLeadIntegration } from "@/hooks/salesFunnel/useNewLeadIntegration";
import { useWonLostFilters } from "@/hooks/salesFunnel/useWonLostFilters";
import { KanbanBoard } from "@/components/sales/KanbanBoard";
import { LeadDetailSidebar } from "@/components/sales/LeadDetailSidebar";
import { toast } from "sonner";
import { KanbanLead } from "@/types/kanban";
import { useNavigate } from "react-router-dom";
import { ModernFunnelHeader } from "@/components/sales/funnel/ModernFunnelHeader";
import { ModernFunnelControlBar } from "@/components/sales/funnel/ModernFunnelControlBar";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useUserRole } from "@/hooks/useUserRole";

export default function SalesFunnel() {
  const [activeTab, setActiveTab] = useState("funnel");
  const navigate = useNavigate();
  const { companyId } = useCompanyData();
  const { isAdmin } = useUserRole();
  
  const {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    loading: funnelLoading
  } = useFunnelManagement(companyId);

  const {
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
    moveLeadToStage
  } = useRealSalesFunnel(selectedFunnel?.id);

  useNewLeadIntegration(selectedFunnel?.id);

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

  if (funnelLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ticlin"></div>
              <p className="text-lg font-medium text-gray-700">Carregando funis...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!selectedFunnel) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-12 shadow-2xl max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-ticlin/20 to-ticlin/40 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-ticlin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Nenhum Funil Encontrado</h3>
              <p className="text-gray-600 mb-6">
                {isAdmin ? "Crie seu primeiro funil para começar a gerenciar leads" : "Nenhum funil disponível para você"}
              </p>
            </div>
            
            {isAdmin && (
              <button
                onClick={() => handleCreateFunnel("Funil Principal", "Funil principal de vendas")}
                className="bg-gradient-to-r from-ticlin to-ticlin-dark text-black font-semibold py-3 px-6 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Criar Primeiro Funil
              </button>
            )}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header Moderno */}
        <ModernFunnelHeader 
          selectedFunnel={selectedFunnel}
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
        
        {/* Board do Kanban */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
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
        </div>
      </div>
      
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
    </PageLayout>
  );
}
