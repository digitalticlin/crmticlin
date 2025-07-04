
import { useState, useCallback, useMemo } from "react";
import { useSalesFunnelContext } from "./SalesFunnelProvider";
import { KanbanBoard } from "../KanbanBoard";
import { FunnelLoadingState } from "./FunnelLoadingState";
import { FunnelEmptyState } from "./FunnelEmptyState";
import { ModernFunnelHeader } from "./ModernFunnelHeader";
import { ModernFunnelControlBar } from "./ModernFunnelControlBar";
import { SalesFunnelModals } from "./SalesFunnelModals";
import { CreateLeadModal } from "./modals/CreateLeadModal";
import { TagManagementModal } from "./modals/TagManagementModal";
import { FunnelConfigModal } from "./modals/FunnelConfigModal";
import { WonLostFilters } from "./WonLostFilters";
import { WonLostBoard } from "./WonLostBoard";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KanbanLead } from "@/types/kanban";

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
  
  // Estados para controlar os modais
  const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false);
  const [isTagManagementModalOpen, setIsTagManagementModalOpen] = useState(false);
  const [isFunnelConfigModalOpen, setIsFunnelConfigModalOpen] = useState(false);

  // Estados para filtros da aba Ganhos e Perdidos
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState("");

  // Identificar estágios ganho/perdido
  const wonStageId = stages?.find(s => s.is_won)?.id;
  const lostStageId = stages?.find(s => s.is_lost)?.id;

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
  const wonLeads = leads.filter(l => l.columnId === wonStageId).length;
  const lostLeads = leads.filter(l => l.columnId === lostStageId).length;

  // Handlers para as ações do controle bar
  const handleAddColumn = () => {
    console.log('[SalesFunnelContent] 🔧 Abrindo modal de configuração do funil');
    setIsFunnelConfigModalOpen(true);
  };

  const handleManageTags = () => {
    console.log('[SalesFunnelContent] 🏷️ Abrindo modal de gerenciar tags');
    setIsTagManagementModalOpen(true);
  };

  const handleAddLead = () => {
    console.log('[SalesFunnelContent] 👤 Abrindo modal de adicionar lead');
    setIsCreateLeadModalOpen(true);
  };

  const handleEditFunnel = () => {
    console.log('[SalesFunnelContent] ⚙️ Abrindo modal de configuração do funil');
    setIsFunnelConfigModalOpen(true);
  };

  // Ações dos leads com refresh automático
  const handleMoveToWonLost = useCallback(async (lead: KanbanLead, status: "won" | "lost") => {
    const stageId = status === "won" ? wonStageId : lostStageId;
    if (!stageId || !lead.id) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ kanban_stage_id: stageId })
        .eq("id", lead.id);

      if (error) throw error;
      
      toast.success(`Lead marcado como ${status === "won" ? "ganho" : "perdido"}!`);
      
      // Refresh automático
      await refetchLeads();
      await refetchStages();
      
      console.log(`[SalesFunnelContent] ✅ Lead ${lead.id} movido para ${status}`);
    } catch (error) {
      console.error(`Erro ao mover lead para ${status}:`, error);
      toast.error(`Erro ao marcar como ${status === "won" ? "ganho" : "perdido"}`);
    }
  }, [wonStageId, lostStageId, refetchLeads, refetchStages]);

  const handleReturnToFunnel = useCallback(async (lead: KanbanLead) => {
    // Encontrar o primeiro estágio normal (não ganho nem perdido)
    const firstNormalStage = stages?.find(s => !s.is_won && !s.is_lost);
    if (!firstNormalStage || !lead.id) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ kanban_stage_id: firstNormalStage.id })
        .eq("id", lead.id);

      if (error) throw error;
      
      toast.success("Lead retornou ao funil!");
      
      // Refresh automático
      await refetchLeads();
      await refetchStages();
      
      console.log(`[SalesFunnelContent] ↩️ Lead ${lead.id} retornou ao funil`);
    } catch (error) {
      console.error("Erro ao retornar lead ao funil:", error);
      toast.error("Erro ao retornar lead ao funil");
    }
  }, [stages, refetchLeads, refetchStages]);

  return (
    <div className="flex flex-col h-full">
      <ModernFunnelHeader 
        selectedFunnel={selectedFunnel}
        totalLeads={totalLeads}
        wonLeads={wonLeads}
        lostLeads={lostLeads}
        activeTab={activeTab}
      />
      
      {/* Card de Controle com Abas e Botões - com espaçamento adequado */}
      <div className="px-6 pb-4 pt-6">
        <ModernFunnelControlBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onAddColumn={handleAddColumn}
          onManageTags={handleManageTags}
          onAddLead={handleAddLead}
          onEditFunnel={handleEditFunnel}
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
            onMoveToWonLost={handleMoveToWonLost}
            wonStageId={wonStageId}
            lostStageId={lostStageId}
          />
        ) : (
          <div className="space-y-4">
            {/* Filtros para Ganhos e Perdidos */}
            <WonLostFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              availableTags={[]} // TODO: Implementar tags
              availableUsers={[]} // TODO: Implementar usuários
              onClearFilters={() => {
                setSearchTerm("");
                setSelectedTags([]);
                setSelectedUser("");
              }}
              resultsCount={leads.filter(l => l.columnId === wonStageId || l.columnId === lostStageId).length}
            />
            
            {/* Board otimizado para Ganhos e Perdidos */}
            <WonLostBoard
              stages={stages}
              leads={leads}
              onOpenLeadDetail={openLeadDetail}
              onReturnToFunnel={handleReturnToFunnel}
              wonStageId={wonStageId}
              lostStageId={lostStageId}
              searchTerm={searchTerm}
              selectedTags={selectedTags}
              selectedUser={selectedUser}
            />
          </div>
        )}
      </div>

      {/* Modais principais do lead */}
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

      {/* Modais de ações do control bar */}
      <CreateLeadModal
        isOpen={isCreateLeadModalOpen}
        onClose={() => setIsCreateLeadModalOpen(false)}
      />

      <TagManagementModal
        isOpen={isTagManagementModalOpen}
        onClose={() => setIsTagManagementModalOpen(false)}
      />

      <FunnelConfigModal
        isOpen={isFunnelConfigModalOpen}
        onClose={() => setIsFunnelConfigModalOpen(false)}
      />
    </div>
  );
}
