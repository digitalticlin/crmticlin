import { useSalesFunnelContext } from "./SalesFunnelProvider";
import { KanbanBoard } from "../KanbanBoard";
import { FunnelLoadingState } from "./FunnelLoadingState";
import { FunnelEmptyState } from "./FunnelEmptyState";
import { ModernFunnelHeader } from "./ModernFunnelHeader";
import { SalesFunnelModals } from "./SalesFunnelModals";
import { LeadStageHealthMonitor } from "./LeadStageHealthMonitor";

export function SalesFunnelContent() {
  const {
    loading,
    error,
    selectedFunnel,
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    stages,
    leads,
    availableTags,
    openLeadDetail,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    toggleTagOnLead,
    refetchLeads,
    refetchStages
  } = useSalesFunnelContext();

  console.log('[SalesFunnelContent] 🎯 Renderizando com dados:', {
    loading,
    error,
    selectedFunnelId: selectedFunnel?.id,
    columnsCount: columns.length,
    leadsCount: leads.length,
    stagesCount: stages.length
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

  return (
    <div className="flex flex-col h-full">
      <ModernFunnelHeader />
      
      {/* Monitor de Saúde dos Leads */}
      <div className="px-6 mb-4">
        <LeadStageHealthMonitor funnelId={selectedFunnel.id} />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          columns={columns}
          onColumnsChange={setColumns}
          onLeadClick={openLeadDetail}
          availableTags={availableTags}
          onToggleTag={toggleTagOnLead}
        />
      </div>

      <SalesFunnelModals
        selectedLead={selectedLead}
        isLeadDetailOpen={isLeadDetailOpen}
        setIsLeadDetailOpen={setIsLeadDetailOpen}
        updateLeadNotes={updateLeadNotes}
        updateLeadPurchaseValue={updateLeadPurchaseValue}
        updateLeadAssignedUser={updateLeadAssignedUser}
        updateLeadName={updateLeadName}
        refetchLeads={refetchLeads}
        refetchStages={refetchStages}
      />
    </div>
  );
}
