import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSalesFunnelContext } from "./SalesFunnelProvider";
import { KanbanBoard } from "../KanbanBoard";
import { FunnelLoadingState } from "./FunnelLoadingState";
import { FunnelEmptyState } from "./FunnelEmptyState";
import { ModernFunnelHeader } from "./ModernFunnelHeader";
import { ModernFunnelControlBar } from "./ModernFunnelControlBar";
import { SalesFunnelModals } from "./SalesFunnelModals";
import { TagManagementModal } from "./modals/TagManagementModal";
import { FunnelConfigModal } from "./modals/FunnelConfigModal";
import { WonLostFilters } from "./WonLostFilters";
import { WonLostBoard } from "./WonLostBoard";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KanbanLead } from "@/types/kanban";
import { RealClientDetails } from "@/components/clients/RealClientDetails";
import { ClientData } from "@/hooks/clients/types";
import { useAuth } from "@/contexts/AuthContext";

export function SalesFunnelContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
  const [isTagManagementModalOpen, setIsTagManagementModalOpen] = useState(false);
  const [isFunnelConfigModalOpen, setIsFunnelConfigModalOpen] = useState(false);

  // Estados para filtros da aba Ganhos e Perdidos
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState("");

  // Identificar estágios ganho/perdido usando useMemo
  const { wonStageId, lostStageId } = useMemo(() => ({
    wonStageId: stages?.find(s => s.is_won)?.id,
    lostStageId: stages?.find(s => s.is_lost)?.id
  }), [stages]);

  // Calcular estatísticas para o header usando useMemo
  const stats = useMemo(() => ({
    totalLeads: leads.length,
    wonLeads: leads.filter(l => l.columnId === wonStageId).length,
    lostLeads: leads.filter(l => l.columnId === lostStageId).length
  }), [leads, wonStageId, lostStageId]);

  // Estado global para tags
  const [availableTags, setAvailableTags] = useState([]);

  // Função para carregar todas as tags disponíveis
  const fetchAvailableTags = useCallback(async () => {
    try {
      const { data: tags, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableTags(tags);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
      toast.error('Erro ao carregar tags disponíveis');
    }
  }, []);

  // Carregar tags ao montar o componente
  useEffect(() => {
    fetchAvailableTags();
  }, [fetchAvailableTags]);

  // Handlers para as ações do controle bar
  const handleAddColumn = useCallback(() => {
    console.log('[SalesFunnelContent] 🔧 Abrindo modal de configuração do funil');
    setIsFunnelConfigModalOpen(true);
  }, []);

  const handleManageTags = useCallback(() => {
    console.log('[SalesFunnelContent] 🏷️ Abrindo modal de gerenciar tags');
    setIsTagManagementModalOpen(true);
  }, []);

  const handleCreateLead = useCallback(async (clientData: Partial<ClientData>) => {
    try {
      if (!selectedFunnel?.id || !stages?.length || !user?.id) {
        toast.error("Funil não selecionado ou sem etapas");
        return;
      }

      const { error: leadError } = await supabase
        .from("leads")
        .insert([{
          name: clientData.name,
          phone: clientData.phone,
          email: clientData.email,
          company: clientData.company,
          notes: clientData.notes,
          funnel_id: selectedFunnel.id,
          kanban_stage_id: stages[0].id,
          created_by_user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (leadError) throw leadError;

      toast.success("Lead criado com sucesso!");
      setIsCreateClientModalOpen(false);
      refetchLeads();
    } catch (error) {
      console.error("Erro ao criar lead:", error);
      toast.error("Erro ao criar lead");
    }
  }, [selectedFunnel?.id, stages, refetchLeads, user?.id]);

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

  // 🚀 NOVA FUNÇÃO: Navegar para o WhatsApp Chat com o lead específico
  const handleOpenChat = useCallback((lead: KanbanLead) => {
    console.log('[SalesFunnelContent] 💬 Abrindo chat do WhatsApp para lead:', {
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone
    });

    // Navegar para WhatsApp Chat com o leadId na URL
    navigate(`/whatsapp-chat?leadId=${lead.id}`);
    
    toast.success(`Abrindo chat com ${lead.name}`, {
      description: "Redirecionando para o WhatsApp..."
    });
  }, [navigate]);

  // Renderização condicional com base no loading e error
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
      <ModernFunnelHeader 
        selectedFunnel={selectedFunnel}
        totalLeads={stats.totalLeads}
        wonLeads={stats.wonLeads}
        lostLeads={stats.lostLeads}
        activeTab={activeTab}
      />
      
      {/* Card de Controle com Abas e Botões - com espaçamento adequado */}
      <div className="px-6 pb-4 pt-6">
        <ModernFunnelControlBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onAddColumn={handleAddColumn}
          onManageTags={handleManageTags}
          onAddLead={() => setIsCreateClientModalOpen(true)}
          onEditFunnel={() => setIsFunnelConfigModalOpen(true)}
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
            onOpenChat={handleOpenChat}
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
              availableTags={availableTags}
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
              onOpenChat={handleOpenChat}
              wonStageId={wonStageId}
              lostStageId={lostStageId}
              searchTerm={searchTerm}
              selectedTags={selectedTags}
              selectedUser={selectedUser}
            />
          </div>
        )}
      </div>

      {/* Modais */}
      <RealClientDetails
        client={null}
        isOpen={isCreateClientModalOpen}
        isCreateMode={true}
        onOpenChange={setIsCreateClientModalOpen}
        onCreateClient={handleCreateLead}
      />

      <TagManagementModal
        isOpen={isTagManagementModalOpen}
        onClose={() => setIsTagManagementModalOpen(false)}
        availableTags={availableTags}
        onTagsChange={fetchAvailableTags}
      />

      <FunnelConfigModal
        isOpen={isFunnelConfigModalOpen}
        onClose={() => setIsFunnelConfigModalOpen(false)}
      />

      {/* Modais principais do lead */}
      <SalesFunnelModals
        selectedLead={selectedLead}
        isLeadDetailOpen={isLeadDetailOpen}
        setIsLeadDetailOpen={setIsLeadDetailOpen}
        onUpdateNotes={updateLeadNotes}
        onUpdatePurchaseValue={updateLeadPurchaseValue}
        onUpdateAssignedUser={updateLeadAssignedUser}
        onUpdateName={updateLeadName}
        onToggleTag={(tagId: string) => selectedLead && toggleTagOnLead(selectedLead.id, tagId)}
        refetchLeads={refetchLeads}
        refetchStages={refetchStages}
        availableTags={availableTags}
      />
    </div>
  );
}
