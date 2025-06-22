import { useState } from "react";
import { KanbanLead } from "@/types/kanban";
import { useWonLostFilters } from "@/hooks/salesFunnel/useWonLostFilters";
import { SalesFunnelTabs } from "./SalesFunnelTabs";
import { SalesFunnelModals } from "./SalesFunnelModals";
import { SalesFunnelActions } from "./SalesFunnelActions";
import { useSalesFunnelContext } from "./SalesFunnelProvider";

export const SalesFunnelContent = () => {
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isDealNoteModalOpen, setIsDealNoteModalOpen] = useState(false);
  const [leadToMove, setLeadToMove] = useState<KanbanLead | null>(null);
  const [pendingDealMove, setPendingDealMove] = useState<{lead: KanbanLead, status: "won" | "lost"} | null>(null);
  
  // Usar try/catch para capturar erros de contexto
  try {
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

    console.log('[SalesFunnelContent] ✅ Contexto carregado com sucesso', {
      funnelName: selectedFunnel?.name,
      stagesCount: stages?.length || 0,
      leadsCount: leads?.length || 0
    });

    // Buscar leads das etapas GANHO e PERDIDO diretamente dos leads totais
    const wonLostLeads = leads?.filter(lead => {
      const leadStage = stages?.find(stage => stage.id === lead.columnId);
      return leadStage && (leadStage.title === "GANHO" || leadStage.title === "PERDIDO");
    }) || [];

    // Hook para filtros na página Ganhos e Perdidos
    const wonLostFilters = useWonLostFilters(wonLostLeads, availableTags);

    // Usar o hook de ações
    const actions = SalesFunnelActions({
      stages: stages || [],
      moveLeadToStage,
      refetchLeads,
      refetchStages,
      onStageModalOpen: (lead: KanbanLead) => {
        setLeadToMove(lead);
        setIsStageModalOpen(true);
      },
      onDealNoteModalOpen: (move: {lead: KanbanLead, status: "won" | "lost"}) => {
        setPendingDealMove(move);
        setIsDealNoteModalOpen(true);
      }
    });

    const handleDealNoteConfirm = async (note: string, value: number) => {
      if (pendingDealMove) {
        // Para ganhos: atualizar o valor do lead e criar deal
        // Para perdas: apenas criar deal, manter valor original do lead
        if (pendingDealMove.status === "won") {
          // Atualizar o valor de compra do lead apenas para ganhos
          if (pendingDealMove.lead.id && value !== pendingDealMove.lead.purchaseValue) {
            await updateLeadPurchaseValue(value);
          }
          // Criar deal e mover para ganho com o valor atualizado
          await actions.handleDealNoteConfirm(note, { 
            ...pendingDealMove, 
            lead: { ...pendingDealMove.lead, purchaseValue: value } 
          });
        } else {
          // Para perdas, usar o valor do modal mas não atualizar o lead
          await actions.handleDealNoteConfirm(note, pendingDealMove);
        }
      }
      setIsDealNoteModalOpen(false);
      setPendingDealMove(null);
    };

    const handleCreateFunnel = async (name: string, description?: string): Promise<void> => {
      await createFunnel(name, description);
    };

    // Wrapper function to handle the notes update with leadId
    const handleUpdateLeadNotes = async (notes: string) => {
      if (selectedLead?.id) {
        await updateLeadNotes(notes);
      }
    };

    return (
      <>
        <SalesFunnelTabs
          funnels={funnels}
          selectedFunnel={selectedFunnel!}
          setSelectedFunnel={setSelectedFunnel}
          createFunnel={handleCreateFunnel}
          columns={columns}
          setColumns={setColumns}
          stages={stages || []}
          leads={leads || []}
          availableTags={availableTags}
          wonStageId={wonStageId}
          lostStageId={lostStageId}
          isAdmin={isAdmin}
          addColumn={addColumn}
          updateColumn={updateColumn}
          deleteColumn={deleteColumn}
          openLeadDetail={openLeadDetail}
          onOpenChat={actions.handleOpenChat}
          onMoveToWonLost={actions.handleMoveToWonLost}
          onReturnToFunnel={actions.handleReturnToFunnel}
          wonLostFilters={{
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
          }}
        />

        <SalesFunnelModals
          isStageModalOpen={isStageModalOpen}
          setIsStageModalOpen={setIsStageModalOpen}
          leadToMove={leadToMove}
          setLeadToMove={setLeadToMove}
          stages={stages || []}
          onStageSelection={actions.handleStageSelection}
          isDealNoteModalOpen={isDealNoteModalOpen}
          setIsDealNoteModalOpen={setIsDealNoteModalOpen}
          pendingDealMove={pendingDealMove}
          setPendingDealMove={setPendingDealMove}
          onDealNoteConfirm={handleDealNoteConfirm}
          selectedLead={selectedLead}
          isLeadDetailOpen={isLeadDetailOpen}
          setIsLeadDetailOpen={setIsLeadDetailOpen}
          availableTags={availableTags}
          onToggleTag={(tagId) => selectedLead && toggleTagOnLead(selectedLead.id, tagId)}
          onUpdateNotes={handleUpdateLeadNotes}
          onCreateTag={createTag}
          onUpdatePurchaseValue={updateLeadPurchaseValue}
          onUpdateAssignedUser={updateLeadAssignedUser}
          onUpdateName={updateLeadName}
        />
      </>
    );
  } catch (error) {
    console.error('[SalesFunnelContent] ❌ Erro ao carregar contexto:', error);
    // Fallback UI para quando o contexto não está disponível
    return (
      <div className="p-8 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl">
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Erro ao carregar funil de vendas
          </h3>
          <p className="text-gray-600 mb-4">
            Não foi possível carregar os dados do funil. Por favor, tente novamente.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-ticlin text-white rounded-lg hover:bg-ticlin/90 transition-colors"
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }
};
