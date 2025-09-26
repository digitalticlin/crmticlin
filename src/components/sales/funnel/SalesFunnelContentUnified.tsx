/**
 * 🎯 UNIFIED SALES FUNNEL CONTENT
 *
 * Substitui o SalesFunnelContent antigo por versão unificada
 * sem conflitos, coordenada e otimizada.
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Hooks unificados
import { useSalesFunnelUnified } from "@/hooks/salesFunnel/useSalesFunnelUnified";

// Modal para deals
import { AddDealModal } from "@/components/clients/ClientDetailsSections/DealsHistory/AddDealModal";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useStageManagement } from "@/hooks/salesFunnel/useStageManagement";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useEnsureDefaultStages } from "@/hooks/salesFunnel/useEnsureDefaultStages";
import { useWonLostStages } from "@/hooks/salesFunnel/stages/useWonLostStages";
import { useDragScroll } from "@/hooks/dnd/useDragScroll";

// Componentes
import { KanbanBoard } from "../KanbanBoard";
import { FunnelLoadingState } from "./FunnelLoadingState";
import { FunnelEmptyState } from "./FunnelEmptyState";
import { ModernFunnelControlBarUnifiedV2 } from "./ModernFunnelControlBarUnifiedV2";
// Modais removidos - agora gerenciados pelo ModernFunnelControlBarUnifiedV2
// import { TagManagementModal } from "./modals/TagManagementModal";
// import { FunnelConfigModal } from "./modals/FunnelConfigModal";
import { WonLostBoard } from "./WonLostBoard";
import { RealClientDetails } from "@/components/clients/RealClientDetails";
import { MassSelectionToolbar } from "../mass-selection/MassSelectionToolbar";
import { MassDeleteModal } from "../mass-selection/modals/MassDeleteModal";
import { MassMoveModal } from "../mass-selection/modals/MassMoveModal";
import { MassTagModal } from "../mass-selection/modals/MassTagModal";
import { MassAssignUserModal } from "../mass-selection/modals/MassAssignUserModal";
import { MassActionWrapper } from "../mass-selection/MassActionWrapper";
import { SelectStageModal } from "./modals/SelectStageModal";

// Types
import { KanbanLead } from "@/types/kanban";
import { ClientData } from "@/hooks/clients/types";
import { salesFunnelFunnelsQueryKeys } from "@/hooks/salesFunnel/queryKeys";

export function SalesFunnelContentUnified() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userFunnels, canViewAllFunnels, isLoading: accessLoading } = useAccessControl();
  const { addColumn: addStageToDatabase, updateColumn: updateStageInDatabase, deleteColumn: deleteStageFromDatabase } = useStageManagement();

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Estados locais
  const [selectedFunnel, setSelectedFunnel] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);

  // Estados para filtros - REMOVIDOS (agora no hook coordenador)
  // Os filtros são gerenciados pelo useFiltersCoordinator dentro do ModernFunnelControlBarUnifiedV2

  // Estados para modais de seleção em massa
  const [activeModal, setActiveModal] = useState<"massDelete" | "massMove" | "massTag" | "massAssign" | null>(null);

  // Estados para modal de seleção de etapa
  const [isSelectStageModalOpen, setIsSelectStageModalOpen] = useState(false);
  const [selectedLeadForStageChange, setSelectedLeadForStageChange] = useState<KanbanLead | null>(null);

  // Estados para modal de deals
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [selectedLeadForDeal, setSelectedLeadForDeal] = useState<KanbanLead | null>(null);
  const [dealStatus, setDealStatus] = useState<"won" | "lost">("won");
  const [isDealSaving, setIsDealSaving] = useState(false);

  // Estado da visualização - será gerenciado pelo hook coordenador
  const [currentView, setCurrentView] = useState<"board" | "won-lost">("board");

  // console.log('[SalesFunnelContentUnified] 🚀 Inicializando Sales Funnel UNIFICADO');

  // Garantir que existam etapas padrão no funil
  useEnsureDefaultStages(selectedFunnel?.id);

  // 🎯 HOOK UNIFICADO PRINCIPAL - Substitui 8+ hooks antigos
  const funnel = useSalesFunnelUnified({
    funnelId: selectedFunnel?.id,
    enableDnd: true,
    enableRealtime: true,
    enableFilters: true,
    enableMassSelection: true,
    pageSize: 50 // 🚀 FASE 1: Aumentado de 30 → 50 para carregar mais leads inicialmente
  });

  // 🎯 HOOK ESPECÍFICO PARA ETAPAS WON/LOST
  const { wonStageId, lostStageId, isLoading: wonLostLoading } = useWonLostStages({
    funnelId: selectedFunnel?.id,
    enabled: !!selectedFunnel?.id
  });

  // 🎯 DRAG-TO-SCROLL horizontal
  const { isDragging } = useDragScroll({
    container: scrollContainerRef.current,
    enabled: true,
    sensitivity: 2
  });

  // 🚀 MEMOIZAÇÃO AGRESSIVA: Evitar recálculos desnecessários
  const funnelQueryKey = useMemo(() => {
    // Só recalcular se realmente mudou (não por referência)
    const userId = user?.id || '';
    const canView = !!canViewAllFunnels;
    const funnelIds = userFunnels?.join(',') || '';

    return salesFunnelFunnelsQueryKeys.list(userId, canView, userFunnels);
  }, [user?.id, canViewAllFunnels, userFunnels?.join(',')]); // ← Join para comparar valores, não referências

  // BUSCAR FUNIS DISPONÍVEIS
  const { data: funnels = [], isLoading: funnelLoading, refetch: refetchFunnels } = useQuery({
    queryKey: funnelQueryKey,
    queryFn: useCallback(async () => {
      if (!user?.id || accessLoading) return [];

      try {
        if (canViewAllFunnels) {
          const { data: ownedFunnels, error } = await supabase
            .from('funnels')
            .select('*')
            .eq('created_by_user_id', user.id)
            .order('created_at', { ascending: true });

          if (error) throw error;
          return ownedFunnels || [];
        } else {
          if (userFunnels.length === 0) return [];

          const { data: assignedFunnels, error } = await supabase
            .from('funnels')
            .select('*')
            .in('id', userFunnels)
            .order('created_at', { ascending: true });

          if (error) throw error;
          return assignedFunnels || [];
        }
      } catch (error) {
        console.error('[SalesFunnelContentUnified] ❌ Erro ao buscar funis:', error);
        throw error;
      }
    }, [user?.id, accessLoading, canViewAllFunnels, userFunnels]),
    enabled: !!user?.id && !accessLoading,
    staleTime: 300000,
    gcTime: 600000
  });

  // 🚨 EMERGENCY THROTTLING - Refs para quebrar loop infinito
  const lastFiltersRef = useRef<any>(null);
  const lastRenderTime = useRef<number>(0);
  const renderThrottleMs = 2000; // 2 segundos entre re-renders

  // Handler para mudanças de filtros vindos da barra de controle
  const handleFiltersChange = useCallback((filters: any) => {
    const now = Date.now();

    // 🛡️ EMERGENCY THROTTLE: Bloquear se muito recente
    if (now - lastRenderTime.current < renderThrottleMs) {
      console.log('[SalesFunnelContentUnified] 🚨 EMERGENCY THROTTLE: Bloqueando render por',
        renderThrottleMs - (now - lastRenderTime.current), 'ms');
      return;
    }

    lastRenderTime.current = now;
    if (!funnel) return;

    // 🛡️ GUARD: Evitar loop se filtros são iguais ao último processado
    const filtersKey = JSON.stringify({
      hasActiveFilters: filters.hasActiveFilters,
      searchTerm: filters.searchTerm,
      selectedTags: filters.selectedTags,
      selectedUser: filters.selectedUser
    });

    if (lastFiltersRef.current === filtersKey) {
      console.log('[SalesFunnelContentUnified] 🛡️ GUARD: Filtros idênticos - ignorando para evitar loop');
      return;
    }

    lastFiltersRef.current = filtersKey;

    if (filters.hasActiveFilters) {
      console.log('[SalesFunnelContentUnified] 🔍 Aplicando filtros coordenados:', filters);

      funnel.applyFilters({
        searchTerm: filters.searchTerm || undefined,
        tags: filters.selectedTags?.length > 0 ? filters.selectedTags : undefined,
        assignedUser: (filters.selectedUser && filters.selectedUser !== "all") ? filters.selectedUser : undefined
      });
    }
    // 🚨 EMERGÊNCIA: clearFilters automático DESABILITADO para quebrar loop infinito
    // else if (funnel.hasActiveFilters) {
    //   console.log('[SalesFunnelContentUnified] 🧹 Limpando filtros (tinha filtros ativos) - COM GUARD');
    //   // Só limpar se realmente há filtros ativos
    //   funnel.clearFilters();
    // }
  }, [funnel]);

  // Selecionar primeiro funil automaticamente
  useEffect(() => {
    if (funnels.length > 0 && !selectedFunnel) {
      setSelectedFunnel(funnels[0]);
      console.log('[SalesFunnelContentUnified] 🎯 Funil selecionado automaticamente:', funnels[0].name);
    }
  }, [funnels, selectedFunnel]);

  // Handlers
  const handleOpenLeadDetail = useCallback((lead: KanbanLead) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  }, []);

  const handleCloseLeadDetail = useCallback(() => {
    setSelectedLead(null);
    setIsLeadDetailOpen(false);
  }, []);

  const handleOpenChat = useCallback((lead: KanbanLead) => {
    navigate(`/whatsapp-chat?leadId=${lead.id}`);
  }, [navigate]);

  const handleMoveToWonLost = useCallback(async (lead: KanbanLead, status: "won" | "lost") => {
    console.log(`[SalesFunnelContentUnified] 📝 Abrindo modal de deal para ${status}:`, lead.name);

    // Abrir modal para adicionar informações do deal
    setSelectedLeadForDeal(lead);
    setDealStatus(status);
    setIsDealModalOpen(true);
  }, []);

  // Handler para o submit do modal de deals
  const handleDealSubmit = useCallback(async (dealData: { status: "won" | "lost"; value: number; note?: string }) => {
    if (!selectedLeadForDeal) return;

    setIsDealSaving(true);

    try {
      const lead = selectedLeadForDeal;
      const { status, value, note } = dealData;

      // Determinar o ID da etapa de destino
      const targetStageId = status === 'won' ? wonStageId : lostStageId;

      if (!targetStageId) {
        toast.error(`Etapa ${status === 'won' ? 'de ganho' : 'de perda'} não encontrada!`);
        console.error(`[SalesFunnelContentUnified] ❌ Etapa ${status} não encontrada:`, {
          wonStageId,
          lostStageId,
          status
        });
        return;
      }

      console.log(`[SalesFunnelContentUnified] 🎯 Salvando deal e movendo lead:`, {
        leadId: lead.id,
        targetStageId,
        status,
        value,
        note
      });

      // 🚀 EFEITO OTIMISTA: Atualizar UI imediatamente
      const optimisticUpdate = {
        ...lead,
        columnId: targetStageId,
        status: status
      };

      // Aplicar update otimista primeiro (visual imediato)
      if (funnel.updateLeadOptimistic) {
        funnel.updateLeadOptimistic(lead.id, optimisticUpdate);
      }

      // Toast imediato de feedback
      toast.success(`Lead "${lead.name}" marcado como ${status === 'won' ? 'ganho' : 'perdido'}!`);

      // 1. Mover lead para a etapa correspondente
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          kanban_stage_id: targetStageId,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (updateError) {
        throw updateError;
      }

      // 2. Criar registro na tabela deals
      // 🔒 VALIDAÇÃO MULTITENANT: Verificar se o funil e lead pertencem ao usuário
      if (!selectedFunnel?.created_by_user_id || selectedFunnel.created_by_user_id !== user.id) {
        console.error('[SalesFunnelContentUnified] 🚨 VIOLAÇÃO DE SEGURANÇA: Tentativa de criar deal em funil de outro usuário:', {
          funnelId: selectedFunnel?.id,
          funnelOwner: selectedFunnel?.created_by_user_id,
          currentUser: user.id
        });
        toast.error('Erro de segurança: você não tem permissão para criar deals neste funil');
        return;
      }

      // 🔒 VALIDAÇÃO ADICIONAL: Verificar se o lead pertence ao usuário
      if (lead.created_by_user_id && lead.created_by_user_id !== user.id) {
        console.error('[SalesFunnelContentUnified] 🚨 VIOLAÇÃO DE SEGURANÇA: Tentativa de criar deal para lead de outro usuário:', {
          leadId: lead.id,
          leadOwner: lead.created_by_user_id,
          currentUser: user.id
        });
        toast.error('Erro de segurança: você não tem permissão para modificar este lead');
        return;
      }

      const dealData: any = {
        lead_id: lead.id,
        funnel_id: selectedFunnel.id, // Já validado acima
        status,
        value,
        created_by_user_id: user.id, // ✅ CAMPO OBRIGATÓRIO ADICIONADO
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Adicionar campos opcionais se existirem
      if (lead.client_id) dealData.client_id = lead.client_id;
      if (note) dealData.note = note;

      const { error: dealError } = await supabase
        .from('deals')
        .insert([dealData]);

      if (dealError) {
        console.error('[SalesFunnelContentUnified] ❌ Erro ao criar deal:', dealError);
        // Não fazer throw aqui - lead já foi movido, só loggar o erro
        toast.error('Lead movido, mas erro ao salvar informações do deal');
      } else {
        console.log('[SalesFunnelContentUnified] ✅ Deal criado com sucesso');
      }

      // Refresh final para sincronizar com servidor
      funnel.refreshData();

      // Fechar modal e limpar estado
      setIsDealModalOpen(false);
      setSelectedLeadForDeal(null);

    } catch (error) {
      console.error('[SalesFunnelContentUnified] ❌ Erro ao mover para won/lost:', error);
      toast.error('Erro ao atualizar status do lead');
    } finally {
      setIsDealSaving(false);
    }
  }, [funnel, wonStageId, lostStageId, selectedFunnel?.id]);

  const handleReturnToFunnel = useCallback((lead: KanbanLead) => {
    console.log('[SalesFunnelContentUnified] 🔄 Abrindo modal para retornar lead ao funil:', lead.name);

    // Abrir modal para o usuário escolher a etapa
    setSelectedLeadForStageChange(lead);
    setIsSelectStageModalOpen(true);
  }, []);

  // Handler para quando usuário seleciona uma etapa no modal
  const handleStageSelection = useCallback(async (lead: KanbanLead, stageId: string) => {
    console.log('[SalesFunnelContentUnified] 🎯 Movendo lead para etapa selecionada:', {
      leadName: lead.name,
      stageId
    });

    try {
      // Toast imediato de feedback
      toast.success(`Lead "${lead.name}" retornado ao funil!`);

      // Fechar modal
      setIsSelectStageModalOpen(false);
      setSelectedLeadForStageChange(null);

      // Depois fazer a atualização real no servidor
      const { error } = await supabase
        .from('leads')
        .update({
          kanban_stage_id: stageId,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) {
        throw error;
      }

      // Refresh final para sincronizar com servidor
      funnel.refreshData();
    } catch (error) {
      console.error('[SalesFunnelContentUnified] ❌ Erro ao retornar ao funil:', error);
      toast.error('Erro ao retornar lead ao funil');
    }
  }, [funnel]);

  // Handler removido - agora gerenciado pelo useFiltersCoordinator

  // DEBUG: Verificar etapas Won/Lost do novo hook
  console.log('[SalesFunnelContentUnified] 🎯 Etapas Won/Lost do hook específico:', {
    wonStageId,
    lostStageId,
    wonLostLoading,
    totalColumns: funnel?.columns?.length
  });

  // Loading states
  if (accessLoading || funnelLoading || wonLostLoading) {
    return <FunnelLoadingState />;
  }

  if (funnels.length === 0) {
    return <FunnelEmptyState onRefetch={refetchFunnels} />;
  }

  if (!selectedFunnel) {
    return <FunnelLoadingState />;
  }

  // 🔍 Verificação de segurança - DEPOIS de todos os hooks
  // Garantir que o funnel está inicializado com dados mínimos
  if (!funnel) {
    console.log('[SalesFunnelContentUnified] ⏳ Aguardando inicialização do hook...');
    return <FunnelLoadingState />;
  }

  // Se não tem massSelection, criar um objeto vazio seguro
  const safeMassSelection = funnel.massSelection || {
    isSelectionMode: false,
    selectedCount: 0,
    clearSelection: () => {},
    getSelectedLeadsData: () => [],
    selectLead: () => {},
    unselectLead: () => {},
    toggleLead: () => {},
    selectAll: () => {},
    selectStage: () => {},
    enterSelectionMode: () => {},
    exitSelectionMode: () => {},
    getStageSelectionState: () => 'none' as const,
    isLeadSelected: () => false,
    canSelect: () => false,
    canDragWithSelection: () => false,
    selectedLeads: new Set<string>()
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Control Bar V2 - Com hooks coordenadores isolados */}
      <ModernFunnelControlBarUnifiedV2
        funnels={funnels}
        selectedFunnel={selectedFunnel}
        onFunnelSelect={setSelectedFunnel}
        onRefresh={refetchFunnels}
        onRefreshLeads={funnel.refreshData}
        stages={funnel.columns}
        massSelection={safeMassSelection}
        allLeads={funnel.allLeads || []}
        onFiltersChange={handleFiltersChange}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Mass Selection Toolbar */}
      {safeMassSelection.isSelectionMode && (
        <MassSelectionToolbar
          allLeads={funnel.allLeads}
          massSelection={funnel.massSelection}
          onDelete={() => setActiveModal("massDelete")}
          onMove={() => setActiveModal("massMove")}
          onAssignTags={() => setActiveModal("massTag")}
          onAssignUser={() => setActiveModal("massAssign")}
        />
      )}

      {/* Main Content - Viewport responsivo com scroll horizontal + drag-to-scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-x-auto overflow-y-hidden kanban-horizontal-scroll kanban-smooth-scroll relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ zIndex: 1 }}
        >
          {currentView === "board" ? (
            funnel.isLoading ? (
              <FunnelLoadingState />
            ) : (
              <>
                <KanbanBoard
                  columns={funnel.columns}
                  onColumnsChange={funnel.updateColumns}
                  onOpenLeadDetail={handleOpenLeadDetail}
                  onOpenChat={handleOpenChat}
                  onMoveToWonLost={handleMoveToWonLost}
                  massSelection={safeMassSelection}
                  funnelId={selectedFunnel.id}
                  hasActiveFilters={funnel.hasActiveFilters}
                  wonStageId={wonStageId}
                  lostStageId={lostStageId}
                  onLoadMoreFromDatabase={funnel.loadMoreForStage} // 🚀 FASE 2: Conectar scroll infinito real
                />
              </>
            )
          ) : (
            <WonLostBoard
                funnelId={selectedFunnel.id}
                onOpenLeadDetail={handleOpenLeadDetail}
                onOpenChat={handleOpenChat}
                onReturnToFunnel={handleReturnToFunnel}
                searchTerm={""}
                selectedTags={[]}
              />
          )}
        </div>
      </div>

      {/* Modais de Tags e Config agora são gerenciados pelo ModernFunnelControlBarUnifiedV2 */}

      {/* Mass Action Modals */}
      {safeMassSelection && (
        <MassActionWrapper
          massSelection={safeMassSelection}
          onSuccess={() => {
            safeMassSelection.clearSelection();
            funnel.refreshData();
          }}
        >
          <div>
            <MassDeleteModal
              isOpen={activeModal === "massDelete"}
              onClose={() => setActiveModal(null)}
              selectedLeads={safeMassSelection.getSelectedLeadsData(funnel.allLeads) || []}
              onSuccess={() => {
                safeMassSelection.clearSelection();
                funnel.refreshData();
                setActiveModal(null);
              }}
            />

            <MassMoveModal
              isOpen={activeModal === "massMove"}
              onClose={() => setActiveModal(null)}
              selectedLeads={safeMassSelection.getSelectedLeadsData(funnel.allLeads) || []}
              onSuccess={() => {
                safeMassSelection.clearSelection();
                funnel.refreshData();
                setActiveModal(null);
              }}
            />

            <MassTagModal
              isOpen={activeModal === "massTag"}
              onClose={() => setActiveModal(null)}
              selectedLeads={safeMassSelection.getSelectedLeadsData(funnel.allLeads) || []}
              onSuccess={() => {
                safeMassSelection.clearSelection();
                funnel.refreshData();
                setActiveModal(null);
              }}
            />

            <MassAssignUserModal
              isOpen={activeModal === "massAssign"}
              onClose={() => setActiveModal(null)}
              selectedLeads={safeMassSelection.getSelectedLeadsData(funnel.allLeads) || []}
              onSuccess={() => {
                safeMassSelection.clearSelection();
                funnel.refreshData();
                setActiveModal(null);
              }}
            />
          </div>
        </MassActionWrapper>
      )}

      {/* Lead Detail Modal */}
      {isLeadDetailOpen && selectedLead && (
        <RealClientDetails
          isOpen={isLeadDetailOpen}
          onClose={handleCloseLeadDetail}
          clientData={selectedLead as ClientData}
        />
      )}

      {/* Stage Selection Modal para retornar ao funil */}
      <SelectStageModal
        isOpen={isSelectStageModalOpen}
        onClose={() => {
          setIsSelectStageModalOpen(false);
          setSelectedLeadForStageChange(null);
        }}
        lead={selectedLeadForStageChange}
        stages={funnel.columns.map(col => ({
          id: col.id,
          title: col.title,
          color: col.color,
          is_won: false,
          is_lost: false,
          funnel_id: selectedFunnel?.id || '',
          order_position: 0,
          created_at: '',
          updated_at: ''
        }))}
        onSelectStage={handleStageSelection}
      />

      {/* Add Deal Modal para ganho/perda */}
      <AddDealModal
        open={isDealModalOpen}
        onClose={() => {
          setIsDealModalOpen(false);
          setSelectedLeadForDeal(null);
        }}
        onSubmit={handleDealSubmit}
        isLoading={isDealSaving}
      />
    </div>
  );
}

