/**
 * 🎮 CONTROL BAR COORDINATOR
 *
 * Hook coordenador isolado para a barra de controle superior
 * Gerencia todos os botões e ações da barra de controle
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useCreateClientMutation } from "@/hooks/clients/mutations";
import { ClientData } from "@/hooks/clients/types";

interface ControlBarState {
  // Estados dos modais
  isCreateFunnelOpen: boolean;
  isCreateLeadOpen: boolean;
  isManageTagsOpen: boolean;
  isConfigureFunnelOpen: boolean;

  // Estado da visualização
  currentView: "board" | "won-lost";

  // Dados
  selectedFunnel: any;
  stages: any[];
}

export interface UseControlBarCoordinatorReturn {
  // Estados
  state: ControlBarState;

  // Ações de Modal
  openCreateFunnel: () => void;
  closeCreateFunnel: () => void;
  openCreateLead: () => void;
  closeCreateLead: () => void;
  openManageTags: () => void;
  closeManageTags: () => void;
  openConfigureFunnel: () => void;
  closeConfigureFunnel: () => void;

  // Ações de Visualização
  switchToBoard: () => void;
  switchToWonLost: () => void;
  setCurrentView: (view: "board" | "won-lost") => void;

  // Ações de Dados
  setSelectedFunnel: (funnel: any) => void;
  setStages: (stages: any[]) => void;

  // Handlers de Criação
  handleCreateFunnel: (name: string) => Promise<void>;
  handleCreateLead: (data: Partial<ClientData>) => Promise<void>;

  // Utilitários
  isAdmin: boolean;
  canCreateFunnel: boolean;
  canManageTags: boolean;
  canConfigureFunnel: boolean;
}

export function useControlBarCoordinator(
  onRefresh?: () => void,
  onFunnelSelect?: (funnel: any) => void,
  onRefreshLeads?: () => void
): UseControlBarCoordinatorReturn {
  const { user } = useAuth();
  const { isAdmin } = useUserRole(); // ✅ USAR useUserRole para obter role correta
  const { companyId } = useCompanyData();
  const createClientMutation = useCreateClientMutation(companyId);

  // Estado centralizado da barra de controle
  const [state, setState] = useState<ControlBarState>({
    isCreateFunnelOpen: false,
    isCreateLeadOpen: false,
    isManageTagsOpen: false,
    isConfigureFunnelOpen: false,
    currentView: "board",
    selectedFunnel: null,
    stages: []
  });

  // Permissões - CORRIGIDO para usar useUserRole
  const canCreateFunnel = isAdmin; // APENAS ADMIN pode criar funil
  const canManageTags = isAdmin;
  const canConfigureFunnel = isAdmin;

  // Ações de Modal
  const openCreateFunnel = useCallback(() => {
    console.log('[ControlBarCoordinator] 📝 Abrindo modal de criação de funil');
    setState(prev => ({ ...prev, isCreateFunnelOpen: true }));
  }, []);

  const closeCreateFunnel = useCallback(() => {
    setState(prev => ({ ...prev, isCreateFunnelOpen: false }));
  }, []);

  const openCreateLead = useCallback(() => {
    console.log('[ControlBarCoordinator] 👤 Abrindo modal de criação de lead');
    setState(prev => ({ ...prev, isCreateLeadOpen: true }));
  }, []);

  const closeCreateLead = useCallback(() => {
    setState(prev => ({ ...prev, isCreateLeadOpen: false }));
  }, []);

  const openManageTags = useCallback(() => {
    console.log('[ControlBarCoordinator] 🏷️ Abrindo gerenciador de tags');
    setState(prev => ({ ...prev, isManageTagsOpen: true }));
  }, []);

  const closeManageTags = useCallback(() => {
    setState(prev => ({ ...prev, isManageTagsOpen: false }));
  }, []);

  const openConfigureFunnel = useCallback(() => {
    console.log('[ControlBarCoordinator] ⚙️ Abrindo configuração do funil');
    setState(prev => ({ ...prev, isConfigureFunnelOpen: true }));
  }, []);

  const closeConfigureFunnel = useCallback(() => {
    setState(prev => ({ ...prev, isConfigureFunnelOpen: false }));
  }, []);

  // Ações de Visualização
  const switchToBoard = useCallback(() => {
    console.log('[ControlBarCoordinator] 📊 Mudando para visualização Board');
    setState(prev => ({ ...prev, currentView: "board" }));
  }, []);

  const switchToWonLost = useCallback(() => {
    console.log('[ControlBarCoordinator] 🏆 Mudando para visualização Ganhos/Perdidos');
    setState(prev => ({ ...prev, currentView: "won-lost" }));
  }, []);

  const setCurrentView = useCallback((view: "board" | "won-lost") => {
    setState(prev => ({ ...prev, currentView: view }));
  }, []);

  // Ações de Dados
  const setSelectedFunnel = useCallback((funnel: any) => {
    setState(prev => ({ ...prev, selectedFunnel: funnel }));
  }, []);

  const setStages = useCallback((stages: any[]) => {
    setState(prev => ({ ...prev, stages }));
  }, []);

  // Handler para criar funil
  const handleCreateFunnel = useCallback(async (name: string) => {
    if (!user?.id) {
      console.error('[ControlBarCoordinator] ❌ Usuário não autenticado');
      toast.error('Você precisa estar autenticado para criar um funil');
      return;
    }

    console.log('[ControlBarCoordinator] 🚀 Criando funil:', { name });

    try {
      // 1. Criar o funil
      const { data: newFunnel, error: funnelError } = await supabase
        .from('funnels')
        .insert({
          name: name.trim(),
          created_by_user_id: user.id
        })
        .select()
        .single();

      if (funnelError) throw funnelError;

      console.log('[ControlBarCoordinator] ✅ Funil criado:', newFunnel);

      // 2. Criar as 3 etapas padrão
      const defaultStages = [
        {
          title: 'Entrada de Leads',
          color: '#3B82F6',
          order_position: 1,
          funnel_id: newFunnel.id,
          created_by_user_id: user.id,
          is_fixed: false,
          is_won: false,
          is_lost: false,
          ai_enabled: false
        },
        {
          title: 'Em Atendimento',
          color: '#10B981',
          order_position: 2,
          funnel_id: newFunnel.id,
          created_by_user_id: user.id,
          is_fixed: false,
          is_won: false,
          is_lost: false,
          ai_enabled: false
        },
        {
          title: 'Em Negociação',
          color: '#F59E0B',
          order_position: 3,
          funnel_id: newFunnel.id,
          created_by_user_id: user.id,
          is_fixed: false,
          is_won: false,
          is_lost: false,
          ai_enabled: false
        }
      ];

      const { error: stagesError } = await supabase
        .from('kanban_stages')
        .insert(defaultStages);

      if (stagesError) {
        console.error('[ControlBarCoordinator] ❌ Erro ao criar etapas padrão:', stagesError);
        // Não falhar se as etapas não forem criadas, mas avisar
        toast.error('Funil criado, mas erro ao criar etapas padrão');
      } else {
        console.log('[ControlBarCoordinator] ✅ Etapas padrão criadas');
      }

      // 3. Atualizar lista e selecionar o novo funil
      onRefresh?.();

      setTimeout(() => {
        if (newFunnel && onFunnelSelect) {
          onFunnelSelect(newFunnel);
        }
      }, 100);

      toast.success(`Funil "${name}" criado com 3 etapas padrão!`);
      closeCreateFunnel();
    } catch (error) {
      console.error('[ControlBarCoordinator] ❌ Erro ao criar funil:', error);
      toast.error('Erro ao criar funil');
      throw error;
    }
  }, [user?.id, onRefresh, onFunnelSelect, closeCreateFunnel]);

  // Handler para criar lead
  const handleCreateLead = useCallback(async (data: Partial<ClientData>) => {
    if (!state.selectedFunnel) {
      console.error('[ControlBarCoordinator] ❌ Nenhum funil selecionado');
      toast.error('Selecione um funil antes de criar um lead');
      return;
    }

    // Encontrar primeira etapa
    const entryStage = state.stages.find(s => s.order_position === 0) || state.stages[0];

    console.log('[ControlBarCoordinator] 👤 Criando lead:', {
      selectedFunnel: state.selectedFunnel.name,
      entryStage: entryStage?.title,
      leadData: data
    });

    try {
      await createClientMutation.mutateAsync({
        ...data,
        funnel_id: state.selectedFunnel.id,
        kanban_stage_id: entryStage?.id,
      } as any);

      closeCreateLead();
      onRefreshLeads?.();

      toast.success('Lead criado com sucesso!');
      console.log('[ControlBarCoordinator] ✅ Lead criado');
    } catch (error) {
      console.error('[ControlBarCoordinator] ❌ Erro ao criar lead:', error);
      toast.error('Erro ao criar lead');
    }
  }, [state.selectedFunnel, state.stages, createClientMutation, closeCreateLead, onRefreshLeads]);

  return {
    state,

    // Ações de Modal
    openCreateFunnel,
    closeCreateFunnel,
    openCreateLead,
    closeCreateLead,
    openManageTags,
    closeManageTags,
    openConfigureFunnel,
    closeConfigureFunnel,

    // Ações de Visualização
    switchToBoard,
    switchToWonLost,
    setCurrentView,

    // Ações de Dados
    setSelectedFunnel,
    setStages,

    // Handlers
    handleCreateFunnel,
    handleCreateLead,

    // Utilitários
    isAdmin,
    canCreateFunnel,
    canManageTags,
    canConfigureFunnel
  };
}