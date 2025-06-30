
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
    openLeadDetail,
    onUpdateNotes,
    onUpdatePurchaseValue,
    onUpdateAssignedUser,
    onUpdateName,
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

  // Calcular estatísticas para o header
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.columnId === stages.find(s => s.is_won)?.id).length;
  const lostLeads = leads.filter(l => l.columnId === stages.find(s => s.is_lost)?.id).length;

  return (
    <div className="flex flex-col h-full">
      <ModernFunnelHeader 
        selectedFunnel={selectedFunnel}
        totalLeads={totalLeads}
        wonLeads={wonLeads}
        lostLeads={lostLeads}
        activeTab="funnel"
      />
      
      {/* Monitor de Saúde dos Leads */}
      <div className="px-6 mb-4">
        <LeadStageHealthMonitor funnelId={selectedFunnel.id} />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          columns={columns}
          onColumnsChange={setColumns}
          onOpenLeadDetail={openLeadDetail}
        />
      </div>

      <SalesFunnelModals
        selectedLead={selectedLead}
        isLeadDetailOpen={isLeadDetailOpen}
        setIsLeadDetailOpen={setIsLeadDetailOpen}
        onUpdateNotes={onUpdateNotes}
        onUpdatePurchaseValue={onUpdatePurchaseValue}
        onUpdateAssignedUser={onUpdateAssignedUser}
        onUpdateName={onUpdateName}
        refetchLeads={refetchLeads}
        refetchStages={refetchStages}
      />
    </div>
  );
}
