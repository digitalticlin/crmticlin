
import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSalesFunnelDirect } from "@/hooks/salesFunnel/useSalesFunnelDirect";
import { KanbanBoard } from "../KanbanBoard";
import { FunnelLoadingState } from "./FunnelLoadingState";
import { FunnelEmptyState } from "./FunnelEmptyState";
import { ModernFunnelControlBar } from "./ModernFunnelControlBar";
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
import { useMassSelection } from "@/hooks/useMassSelection";
import { MassSelectionToolbar } from "../mass-selection/MassSelectionToolbar";
import { MassDeleteModal } from "../mass-selection/modals/MassDeleteModal";
import { MassMoveModal } from "../mass-selection/modals/MassMoveModal";
import { MassTagModal } from "../mass-selection/modals/MassTagModal";
import { MassAssignUserModal } from "../mass-selection/modals/MassAssignUserModal";
import { MassActionWrapper } from "../mass-selection/MassActionWrapper";

export function SalesFunnelContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // ✅ Hook isolado para seleção em massa (sem Provider) - FUNCIONANDO
  const massSelection = useMassSelection();
  
  // 🚀 HOOKS ISOLADOS - ESCALÁVEL PARA MILHARES DE USUÁRIOS
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
    moveLeadToStage,
    refetchLeads,
    refetchStages,
    addColumn,
    updateColumn,
    deleteColumn,
    availableTags,
    wonStageId,
    lostStageId
  } = useSalesFunnelDirect();

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

  // Estados para modais de seleção em massa
  const [massDeleteModalOpen, setMassDeleteModalOpen] = useState(false);
  const [massMoveModalOpen, setMassMoveModalOpen] = useState(false);
  const [massTagModalOpen, setMassTagModalOpen] = useState(false);
  const [massAssignUserModalOpen, setMassAssignUserModalOpen] = useState(false);

  // 🚀 wonStageId e lostStageId já vêm do hook isolado

  // Calcular estatísticas para o header usando useMemo
  const stats = useMemo(() => ({
    totalLeads: leads.length,
    wonLeads: leads.filter(l => l.kanban_stage_id === wonStageId).length,
    lostLeads: leads.filter(l => l.kanban_stage_id === lostStageId).length
  }), [leads, wonStageId, lostStageId]);

  // 🚀 availableTags já vem do hook isolado - removido estado duplicado

  // Usuários disponíveis derivados dos leads atuais (para filtro "Responsável")
  const availableUsers = useMemo(() => {
    const unique = new Set<string>();
    leads.forEach((l) => unique.add(l.owner_id || ""));
    return Array.from(unique);
  }, [leads]);

  // Função para filtrar leads baseado nos filtros ativos
  const filterLeads = useCallback((leadsToFilter: KanbanLead[]) => {
    return leadsToFilter.filter((lead) => {
      // Filtro por termo de busca (nome, email, telefone, notas)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.phone?.toLowerCase().includes(searchLower) ||
          lead.notes?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtro por tags selecionadas
      if (selectedTags.length > 0) {
        const leadTags = lead.tags || [];
        const hasSelectedTag = selectedTags.some(tagId => 
          leadTags.some(tag => tag.id === tagId)
        );
        if (!hasSelectedTag) return false;
      }

      // Filtro por usuário responsável
      if (selectedUser) {
        if (lead.assignedUser !== selectedUser) return false;
      }

      return true;
    });
  }, [searchTerm, selectedTags, selectedUser]);

  // Aplicar filtros às colunas do Kanban
  const filteredColumns = useMemo(() => {
    if (!columns || columns.length === 0) return [];
    
    // Se não há filtros ativos, retornar colunas originais
    const hasActiveFilters = searchTerm || selectedTags.length > 0 || selectedUser;
    if (!hasActiveFilters) return columns;

    // Filtrar leads em cada coluna
    return columns.map(column => ({
      ...column,
      leads: filterLeads(column.leads)
    }));
  }, [columns, filterLeads, searchTerm, selectedTags, selectedUser]);

  // Contador de resultados filtrados
  const filteredResultsCount = useMemo(() => {
    return filteredColumns.reduce((total, column) => total + column.leads.length, 0);
  }, [filteredColumns]);

  // Handler para mudanças de colunas que preserva os dados originais
  const handleColumnsChange = useCallback((newColumns: typeof columns) => {
    // Sempre atualizar as colunas originais (sem filtro)
    // Os filtros serão reaplicados automaticamente via useMemo
    setColumns(newColumns);
  }, [setColumns]);

  // 🚀 Tags carregadas diretamente pelo hook isolado - removido código duplicado

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

  // 🚀 FUNÇÃO CORRIGIDA: Aceitar leadId em vez de lead completo
  const handleOpenChat = useCallback((leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
      toast.error("Lead não encontrado");
      return;
    }

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
  }, [navigate, leads]);

  // Função auxiliar para uso em outros componentes que ainda passam KanbanLead
  const handleOpenChatWithLead = useCallback((lead: KanbanLead) => {
    handleOpenChat(lead.id);
  }, [handleOpenChat]);

  // Handlers para ações em massa - COM VALIDAÇÃO E BATCHING
  const handleMassDelete = useCallback((selectedLeads: KanbanLead[]) => {
    if (selectedLeads.length === 0) {
      toast.error('Nenhum lead selecionado para exclusão');
      return;
    }
    
    setCurrentSelectedLeads(selectedLeads);
    setMassDeleteModalOpen(true);
  }, []);

  const handleMassMove = useCallback((selectedLeads: KanbanLead[]) => {
    if (selectedLeads.length === 0) {
      toast.error('Nenhum lead selecionado para movimentação');
      return;
    }
    
    setCurrentSelectedLeads(selectedLeads);
    setMassMoveModalOpen(true);
  }, []);

  const handleMassAssignTags = useCallback((selectedLeads: KanbanLead[]) => {
    if (selectedLeads.length === 0) {
      toast.error('Nenhum lead selecionado para atribuição de tags');
      return;
    }
    
    setCurrentSelectedLeads(selectedLeads);
    setMassTagModalOpen(true);
  }, []);

  const handleMassAssignUser = useCallback((selectedLeads: KanbanLead[]) => {
    if (selectedLeads.length === 0) {
      toast.error('Nenhum lead selecionado para atribuição de responsável');
      return;
    }
    
    setCurrentSelectedLeads(selectedLeads);
    setMassAssignUserModalOpen(true);
  }, []);

  // Handler para refresh após ações em massa - OTIMIZADO
  const handleMassActionSuccess = useCallback(async () => {
    try {
      // 🚀 Real-time já atualiza automaticamente - apenas confirmar
      await Promise.all([
        refetchLeads(),
        refetchStages()
      ]);
      console.log('[SalesFunnelContent] ✅ Refresh pós ação em massa - Real-time ativo');
    } catch (error) {
      console.error('Erro no refresh após ação em massa:', error);
      toast.error('Erro ao atualizar dados - tente novamente');
    }
  }, [refetchLeads, refetchStages]);

  // Obter todos os leads para o MassSelectionToolbar
  const allLeads = useMemo(() => {
    return filteredColumns.reduce((acc: KanbanLead[], column) => {
      return [...acc, ...column.leads];
    }, []);
  }, [filteredColumns]);

  // Estado para armazenar leads selecionados no momento da ação
  const [currentSelectedLeads, setCurrentSelectedLeads] = useState<KanbanLead[]>([]);

  // Renderização condicional com base no loading e error
  if (loading) {
    return <FunnelLoadingState />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">❌ {String(error)}</p>
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
    <div className="flex flex-col h-full w-full relative">
      {/* Barra de Controles compacta e sticky */}
      <div className="sticky top-0 z-10 px-6 py-4 backdrop-blur-md border-b border-white/20">
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

      {/* Área do board em full-bleed e altura restante do viewport */}
      <div className="flex-1 min-h-0 px-6 py-4 overflow-hidden relative">
        {activeTab === "funnel" ? (
          <div className="mt-2 md:mt-4 h-full flex flex-col">
            {/* Barra de pesquisa/filtro para Funil principal (fixa acima, fora do scroll horizontal) */}
            <WonLostFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              availableTags={availableTags}
              availableUsers={availableUsers}
              onClearFilters={() => {
                setSearchTerm("");
                setSelectedTags([]);
                setSelectedUser("");
              }}
              resultsCount={filteredResultsCount}
              massSelection={massSelection}
            />
            {/* Wrapper somente do board: permite scroll horizontal natural */}
            <div className="flex-1 min-h-0">
              <KanbanBoard
                columns={filteredColumns}
                onColumnsChange={handleColumnsChange}
                onOpenLeadDetail={openLeadDetail}
                onOpenChat={handleOpenChatWithLead}
                onMoveToWonLost={handleMoveToWonLost}
                wonStageId={wonStageId}
                lostStageId={lostStageId}
                massSelection={massSelection}
              />
            </div>
          </div>
        ) : (
          <div className="mt-2 md:mt-4 h-full flex flex-col">
            {/* Filtros para Ganhos e Perdidos com margem superior igual ao Funil principal */}
            <WonLostFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              availableTags={availableTags}
              availableUsers={availableUsers}
              onClearFilters={() => {
                setSearchTerm("");
                setSelectedTags([]);
                setSelectedUser("");
              }}
              resultsCount={filteredResultsCount}
              massSelection={massSelection}
            />
            {/* Board Won/Lost (pode rolar verticalmente dentro das etapas) */}
            <div className="flex-1 min-h-0">
              <WonLostBoard
                stages={stages}
                leads={filterLeads(leads).map(lead => ({
                  ...lead,
                  lastMessage: lead.last_message || '',
                  lastMessageTime: lead.last_message_time || '',
                  tags: [],
                  unreadCount: lead.unread_count || 0,
                  created_at: lead.created_at || '',
                  funnel_id: lead.funnel_id || ''
                })) as any}
                onOpenLeadDetail={openLeadDetail}
                onReturnToFunnel={handleReturnToFunnel}
                onOpenChat={(lead) => handleOpenChatWithLead(lead)}
                wonStageId={wonStageId}
                lostStageId={lostStageId}
                searchTerm={searchTerm}
                selectedTags={selectedTags}
                selectedUser={selectedUser}
              />
            </div>
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
        onTagsChange={async () => {
          // Tags atualizadas automaticamente via hook useTagDatabase
          console.log('[SalesFunnelContent] Tags atualizadas automaticamente via Real-time');
        }}
      />

      <FunnelConfigModal
        isOpen={isFunnelConfigModalOpen}
        onClose={() => setIsFunnelConfigModalOpen(false)}
      />

      {/* Toolbar de seleção em massa - aparece quando há leads selecionados */}
      <MassSelectionToolbar
        allLeads={allLeads}
        massSelection={massSelection}
        onDelete={handleMassDelete}
        onMove={handleMassMove}
        onAssignTags={handleMassAssignTags}
        onAssignUser={handleMassAssignUser}
      />

      {/* Modais de ações em massa com wrapper para limpeza de seleção - CORRIGIDO */}
      <MassActionWrapper massSelection={massSelection} onSuccess={handleMassActionSuccess}>
        <MassDeleteModal
          isOpen={massDeleteModalOpen}
          onClose={() => {
            setMassDeleteModalOpen(false);
            setCurrentSelectedLeads([]);
          }}
          selectedLeads={currentSelectedLeads}
          onSuccess={() => {}} // Será sobrescrito pelo wrapper
        />
      </MassActionWrapper>

      <MassActionWrapper massSelection={massSelection} onSuccess={handleMassActionSuccess}>
        <MassMoveModal
          isOpen={massMoveModalOpen}
          onClose={() => {
            setMassMoveModalOpen(false);
            setCurrentSelectedLeads([]);
          }}
          selectedLeads={currentSelectedLeads}
          onSuccess={() => {}} // Será sobrescrito pelo wrapper
        />
      </MassActionWrapper>

      <MassActionWrapper massSelection={massSelection} onSuccess={handleMassActionSuccess}>
        <MassTagModal
          isOpen={massTagModalOpen}
          onClose={() => {
            setMassTagModalOpen(false);
            setCurrentSelectedLeads([]);
          }}
          selectedLeads={currentSelectedLeads}
          onSuccess={() => {}} // Será sobrescrito pelo wrapper
        />
      </MassActionWrapper>

      <MassActionWrapper massSelection={massSelection} onSuccess={handleMassActionSuccess}>
        <MassAssignUserModal
          isOpen={massAssignUserModalOpen}
          onClose={() => {
            setMassAssignUserModalOpen(false);
            setCurrentSelectedLeads([]);
          }}
          selectedLeads={currentSelectedLeads}
          onSuccess={() => {}} // Será sobrescrito pelo wrapper
        />
      </MassActionWrapper>


    </div>
  );
}
