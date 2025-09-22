/**
 * 🎯 UNIFIED SALES FUNNEL CONTENT
 *
 * Substitui o SalesFunnelContent antigo por versão unificada
 * sem conflitos, coordenada e otimizada.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Hooks unificados
import { useSalesFunnelUnified } from "@/hooks/salesFunnel/useSalesFunnelUnified";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useStageManagement } from "@/hooks/salesFunnel/useStageManagement";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

// Componentes
import { KanbanBoard } from "../KanbanBoard";
import { FunnelLoadingState } from "./FunnelLoadingState";
import { FunnelEmptyState } from "./FunnelEmptyState";
import { ModernFunnelControlBarUnified } from "./ModernFunnelControlBarUnified";
import { TagManagementModal } from "./modals/TagManagementModal";
import { FunnelConfigModal } from "./modals/FunnelConfigModal";
import { WonLostFilters } from "./WonLostFilters";
import { WonLostBoard } from "./WonLostBoard";
import { RealClientDetails } from "@/components/clients/RealClientDetails";
import { MassSelectionToolbar } from "../mass-selection/MassSelectionToolbar";
import { MassDeleteModal } from "../mass-selection/modals/MassDeleteModal";
import { MassMoveModal } from "../mass-selection/modals/MassMoveModal";
import { MassTagModal } from "../mass-selection/modals/MassTagModal";
import { MassAssignUserModal } from "../mass-selection/modals/MassAssignUserModal";
import { MassActionWrapper } from "../mass-selection/MassActionWrapper";

// Types
import { KanbanLead } from "@/types/kanban";
import { ClientData } from "@/hooks/clients/types";
import { salesFunnelFunnelsQueryKeys } from "@/hooks/salesFunnel/queryKeys";

export function SalesFunnelContentUnified() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userFunnels, canViewAllFunnels, isLoading: accessLoading } = useAccessControl();
  const { addColumn: addStageToDatabase, updateColumn: updateStageInDatabase, deleteColumn: deleteStageFromDatabase } = useStageManagement();

  // Estados locais
  const [selectedFunnel, setSelectedFunnel] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState("");

  // Estados para modais
  const [activeModal, setActiveModal] = useState<"tags" | "config" | "massDelete" | "massMove" | "massTag" | "massAssign" | null>(null);
  const [currentView, setCurrentView] = useState<"board" | "won-lost">("board");

  console.log('[SalesFunnelContentUnified] 🚀 Inicializando Sales Funnel UNIFICADO');

  // 🎯 HOOK UNIFICADO PRINCIPAL - Substitui 8+ hooks antigos
  const funnel = useSalesFunnelUnified({
    funnelId: selectedFunnel?.id,
    enableDnd: true,
    enableRealtime: true,
    enableFilters: true,
    enableMassSelection: true,
    pageSize: 30
  });

  // Memoizar query key para evitar re-renders
  const funnelQueryKey = useMemo(() =>
    salesFunnelFunnelsQueryKeys.list(user?.id || '', canViewAllFunnels, userFunnels),
    [user?.id, canViewAllFunnels, userFunnels]
  );

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

  // Aplicar filtros quando mudam
  useEffect(() => {
    if (!funnel) return;

    const hasFilters = searchTerm || selectedTags.length > 0 || (selectedUser && selectedUser !== "all");

    if (hasFilters) {
      console.log('[SalesFunnelContentUnified] 🔍 Aplicando filtros:', {
        searchTerm,
        selectedTags: selectedTags.length,
        selectedUser: selectedUser !== "all" ? selectedUser : undefined
      });

      funnel.applyFilters({
        searchTerm: searchTerm || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        assignedUser: (selectedUser && selectedUser !== "all") ? selectedUser : undefined
      });
    } else {
      funnel.clearFilters();
    }
  }, [searchTerm, selectedTags, selectedUser]); // Removido 'funnel' das dependências para evitar loop

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
    navigate(`/whatsapp-chats?leadId=${lead.id}`);
  }, [navigate]);

  const handleMoveToWonLost = useCallback(async (lead: KanbanLead, status: "won" | "lost") => {
    console.log(`[SalesFunnelContentUnified] 📝 Movendo lead para ${status}:`, lead.name);

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success(`Lead "${lead.name}" marcado como ${status === 'won' ? 'ganho' : 'perdido'}!`);
      funnel.refreshData();
    } catch (error) {
      console.error('[SalesFunnelContentUnified] ❌ Erro ao mover para won/lost:', error);
      toast.error('Erro ao atualizar status do lead');
    }
  }, [funnel.refreshData]); // Dependência mais específica

  const handleReturnToFunnel = useCallback(async (lead: KanbanLead) => {
    console.log('[SalesFunnelContentUnified] 🔄 Retornando lead ao funil:', lead.name);

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success(`Lead "${lead.name}" retornado ao funil!`);
      funnel.refreshData();
    } catch (error) {
      console.error('[SalesFunnelContentUnified] ❌ Erro ao retornar ao funil:', error);
      toast.error('Erro ao retornar lead ao funil');
    }
  }, [funnel.refreshData]); // Dependência mais específica

  // Handler para limpar filtros (CORRIGINDO VIOLATION DAS RULES OF HOOKS)
  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedTags([]);
    setSelectedUser("");
    funnel.clearFilters();
  }, [funnel.clearFilters]);

  // Loading states
  if (accessLoading || funnelLoading) {
    return <FunnelLoadingState />;
  }

  if (funnels.length === 0) {
    return <FunnelEmptyState onRefetch={refetchFunnels} />;
  }

  if (!selectedFunnel) {
    return <FunnelLoadingState />;
  }

  // 🔍 Verificação de segurança - DEPOIS de todos os hooks
  if (!funnel || !funnel.massSelection) {
    console.log('[SalesFunnelContentUnified] ⏳ Aguardando inicialização do hook...');
    return <FunnelLoadingState />;
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Control Bar */}
      <ModernFunnelControlBarUnified
        funnels={funnels}
        selectedFunnel={selectedFunnel}
        onFunnelSelect={setSelectedFunnel}
        onRefresh={refetchFunnels}
        onOpenTagModal={() => setActiveModal("tags")}
        onOpenConfigModal={() => setActiveModal("config")}
        currentView={currentView}
        onViewChange={setCurrentView}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        selectedUser={selectedUser}
        onUserChange={setSelectedUser}
        hasActiveFilters={funnel.hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Mass Selection Toolbar */}
      {funnel.massSelection.isSelectionMode && (
        <MassSelectionToolbar
          selectedCount={funnel.massSelection.selectedCount}
          onDelete={() => setActiveModal("massDelete")}
          onMove={() => setActiveModal("massMove")}
          onTag={() => setActiveModal("massTag")}
          onAssignUser={() => setActiveModal("massAssign")}
          onClearSelection={funnel.massSelection.clearSelection}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
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
                massSelection={funnel.massSelection}
                funnelId={selectedFunnel.id}
                hasActiveFilters={funnel.hasActiveFilters}
              />
            </>
          )
        ) : (
          <>
            <WonLostFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
            <WonLostBoard
              funnelId={selectedFunnel.id}
              onOpenLeadDetail={handleOpenLeadDetail}
              onOpenChat={handleOpenChat}
              onReturnToFunnel={handleReturnToFunnel}
              searchTerm={searchTerm}
              selectedTags={selectedTags}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <TagManagementModal
        isOpen={activeModal === "tags"}
        onClose={() => setActiveModal(null)}
      />

      <FunnelConfigModal
        isOpen={activeModal === "config"}
        onClose={() => setActiveModal(null)}
        funnelId={selectedFunnel?.id}
      />

      {/* Mass Action Modals */}
      {funnel?.massSelection && typeof funnel.massSelection === 'object' && (
        <MassActionWrapper
          massSelection={funnel.massSelection}
          onSuccess={() => {
            funnel.massSelection?.clearSelection();
            funnel.refreshData();
          }}
        >
          <div>
            <MassDeleteModal
              isOpen={activeModal === "massDelete"}
              onClose={() => setActiveModal(null)}
              selectedLeads={funnel.massSelection?.getSelectedLeadsData?.(funnel.allLeads) || []}
              onSuccess={() => {
                funnel.massSelection?.clearSelection();
                funnel.refreshData();
                setActiveModal(null);
              }}
            />

            <MassMoveModal
              isOpen={activeModal === "massMove"}
              onClose={() => setActiveModal(null)}
              selectedLeads={funnel.massSelection?.getSelectedLeadsData?.(funnel.allLeads) || []}
              onSuccess={() => {
                funnel.massSelection?.clearSelection();
                funnel.refreshData();
                setActiveModal(null);
              }}
            />

            <MassTagModal
              isOpen={activeModal === "massTag"}
              onClose={() => setActiveModal(null)}
              selectedLeads={funnel.massSelection?.getSelectedLeadsData?.(funnel.allLeads) || []}
              onSuccess={() => {
                funnel.massSelection?.clearSelection();
                funnel.refreshData();
                setActiveModal(null);
              }}
            />

            <MassAssignUserModal
              isOpen={activeModal === "massAssign"}
              onClose={() => setActiveModal(null)}
              selectedLeads={funnel.massSelection?.getSelectedLeadsData?.(funnel.allLeads) || []}
              onSuccess={() => {
                funnel.massSelection?.clearSelection();
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
    </div>
  );
}

