
import { useState } from "react";
import { useSalesFunnelContext } from "./SalesFunnelProvider";
import { KanbanBoard } from "../KanbanBoard";
import { FunnelLoadingState } from "./FunnelLoadingState";
import { FunnelEmptyState } from "./FunnelEmptyState";
import { ModernFunnelHeader } from "./ModernFunnelHeader";
import { ModernFunnelControlBar } from "./ModernFunnelControlBar";
import { SalesFunnelModals } from "./SalesFunnelModals";
import { useUserRole } from "@/hooks/useUserRole";

export function SalesFunnelContent() {
  const {
    loading,
    error,
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    stages,
    leads,
    openLeadDetail,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    toggleTagOnLead,
    refetchLeads,
    refetchStages
  } = useSalesFunnelContext();

  const { isAdmin } = useUserRole();
  const [activeTab, setActiveTab] = useState("funnel");

  console.log('[SalesFunnelContent] 🎯 Renderizando com dados:', {
    loading,
    error,
    selectedFunnelId: selectedFunnel?.id,
    columnsCount: columns.length,
    leadsCount: leads.length,
    stagesCount: stages.length,
    activeTab
  });

  if (loading) {
    return <FunnelLoadingState />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">❌ {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!selectedFunnel) {
    return <FunnelEmptyState />;
  }

  // Calcular estatísticas para o header
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.columnId === stages.find(s => s.is_won)?.id).length;
  const lostLeads = leads.filter(l => l.columnId === stages.find(s => s.is_lost)?.id).length;

  // Handlers para as ações do controle bar
  const handleAddColumn = () => {
    console.log('[SalesFunnelContent] 🔧 Adicionar coluna solicitado');
    // TODO: Implementar modal de adicionar coluna
  };

  const handleManageTags = () => {
    console.log('[SalesFunnelContent] 🏷️ Gerenciar tags solicitado');
    // TODO: Implementar modal de gerenciar tags
  };

  const handleAddLead = () => {
    console.log('[SalesFunnelContent] 👤 Adicionar lead solicitado');
    // TODO: Implementar modal de adicionar lead
  };

  return (
    <div className="flex flex-col h-full">
      <ModernFunnelHeader 
        selectedFunnel={selectedFunnel}
        totalLeads={totalLeads}
        wonLeads={wonLeads}
        lostLeads={lostLeads}
        activeTab={activeTab}
      />
      
      {/* Card de Controle com Abas e Botões */}
      <div className="px-6 pb-4">
        <ModernFunnelControlBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onAddColumn={handleAddColumn}
          onManageTags={handleManageTags}
          onAddLead={handleAddLead}
          funnels={funnels}
          selectedFunnel={selectedFunnel}
          onSelectFunnel={setSelectedFunnel}
          onCreateFunnel={createFunnel}
          isAdmin={isAdmin}
        />
      </div>
      
      <div className="flex-1 overflow-hidden px-6">
        {activeTab === "funnel" ? (
          <KanbanBoard
            columns={columns}
            onColumnsChange={setColumns}
            onOpenLeadDetail={openLeadDetail}
          />
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Visualização Ganhos e Perdidos
              </h3>
              <p className="text-gray-600">
                Esta funcionalidade será implementada em breve
              </p>
            </div>
          </div>
        )}
      </div>

      <SalesFunnelModals
        selectedLead={selectedLead}
        isLeadDetailOpen={isLeadDetailOpen}
        setIsLeadDetailOpen={setIsLeadDetailOpen}
        onUpdateNotes={updateLeadNotes}
        onUpdatePurchaseValue={updateLeadPurchaseValue}
        onUpdateAssignedUser={updateLeadAssignedUser}
        onUpdateName={updateLeadName}
        refetchLeads={refetchLeads}
        refetchStages={refetchStages}
      />
    </div>
  );
}
