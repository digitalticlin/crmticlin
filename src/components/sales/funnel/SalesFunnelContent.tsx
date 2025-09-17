
import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// HOOKS ISOLADOS DIRETOS - Performance otimizada
import { useFunnelLeads } from "@/hooks/salesFunnel/leads/useFunnelLeads";
import { useLeadsRealtime } from "@/hooks/salesFunnel/leads/useLeadsRealtime";
import { useLeadTags } from "@/hooks/salesFunnel/leads/useLeadTags";
import { useFunnelStages } from "@/hooks/salesFunnel/stages/useFunnelStages";
import { useQuery } from "@tanstack/react-query";
import { salesFunnelFunnelsQueryKeys } from "@/hooks/salesFunnel/queryKeys";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useStageManagement } from "@/hooks/salesFunnel/useStageManagement";
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
  const { userFunnels, canViewAllFunnels, isLoading: accessLoading } = useAccessControl();
  const { addColumn: addStageToDatabase, updateColumn: updateStageInDatabase, deleteColumn: deleteStageFromDatabase } = useStageManagement();

  // Estados locais
  const [selectedFunnel, setSelectedFunnel] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [columns, setColumns] = useState<any[]>([]);
  const [hasOptimisticChanges, setHasOptimisticChanges] = useState(false);

  // ✅ Hook isolado para seleção em massa
  const massSelection = useMassSelection();

  // 🚀 HOOKS ISOLADOS DIRETOS - Maximum Performance

  // 1. BUSCAR FUNIS DISPONÍVEIS
  const { data: funnels = [], isLoading: funnelLoading, refetch: refetchFunnels } = useQuery({
    queryKey: salesFunnelFunnelsQueryKeys.list(user?.id || '', canViewAllFunnels, userFunnels),
    queryFn: async () => {
      if (!user?.id || accessLoading) return [];

      console.log('[SalesFunnelContent] 🔍 Buscando funis acessíveis:', {
        userId: user.id,
        canViewAll: canViewAllFunnels,
        userFunnelsCount: userFunnels.length
      });

      try {
        if (canViewAllFunnels) {
          const { data: ownedFunnels, error } = await supabase
            .from('funnels')
            .select('*')
            .eq('created_by_user_id', user.id)
            .order('created_at', { ascending: true });

          if (error) throw error;
          console.log('[SalesFunnelContent] ✅ Admin funis encontrados:', ownedFunnels?.length || 0);
          return ownedFunnels || [];
        } else {
          if (userFunnels.length === 0) {
            console.log('[SalesFunnelContent] ⚠️ Usuário sem funis atribuídos');
            return [];
          }

          const { data: assignedFunnels, error } = await supabase
            .from('funnels')
            .select('*')
            .in('id', userFunnels)
            .order('created_at', { ascending: true });

          if (error) throw error;
          console.log('[SalesFunnelContent] ✅ Operacional funis encontrados:', assignedFunnels?.length || 0);
          return assignedFunnels || [];
        }
      } catch (error) {
        console.error('[SalesFunnelContent] ❌ Erro ao buscar funis:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !accessLoading,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });

  // 2. HOOKS ISOLADOS PARA FUNCIONALIDADES ESPECÍFICAS
  const {
    stages,
    mainStages,
    wonStage,
    lostStage,
    firstStage,
    wonStageId,
    lostStageId,
    firstStageId,
    isLoading: stagesLoading,
    refetch: refetchStages
  } = useFunnelStages({
    funnelId: selectedFunnel?.id || null,
    enabled: !!selectedFunnel?.id
  });

  const {
    leads,
    isLoading: leadsLoading,
    isFetchingNextPage,
    hasNextPage,
    error: leadsError,
    refetch: refetchLeads,
    loadMore,
    totalCount
  } = useFunnelLeads({
    funnelId: selectedFunnel?.id || null,
    enabled: !!selectedFunnel?.id,
    pageSize: 20 // Scroll infinito otimizado com 20 leads por vez
  });

  const {
    availableTags,
    addTag,
    removeTag,
    addTagsInBatch,
    removeTagsInBatch,
    isAddingTag,
    isRemovingTag,
    isAddingBatch,
    isRemovingBatch
  } = useLeadTags(selectedFunnel?.id);

  // 3. REAL-TIME COM CONTROLE INTELIGENTE
  const { pauseRealtime, resumeRealtime, isPaused } = useLeadsRealtime({
    funnelId: selectedFunnel?.id || null,
    firstStageId,
    enabled: !!selectedFunnel?.id && !hasOptimisticChanges,
    onNewLead: (newLead) => {
      console.log('[SalesFunnelContent] 📨 Novo lead recebido:', newLead.name);
    }
  });

  // Estados computados - Loading mais restritivo para evitar estado infinito
  const loading = accessLoading || funnelLoading || (stagesLoading && !!selectedFunnel?.id);
  const error = leadsError;

  // Auto-selecionar primeiro funil
  useEffect(() => {
    if (!funnelLoading && !selectedFunnel && funnels && funnels.length > 0) {
      console.log('[SalesFunnelContent] Auto-selecionando primeiro funil:', funnels[0].name);
      setSelectedFunnel(funnels[0]);
    }
  }, [funnelLoading, funnels, selectedFunnel]);

  // ✅ FORÇA REFETCH DE LEADS QUANDO FUNIL MUDA - Fix para problema de carregamento inicial
  useEffect(() => {
    if (selectedFunnel?.id && !leadsLoading) {
      console.log('[SalesFunnelContent] 🔄 Forçando refetch de leads para funil:', selectedFunnel.name);
      refetchLeads();
    }
  }, [selectedFunnel?.id, refetchLeads, leadsLoading]);

  // 🏗️ CONSTRUIR COLUNAS KANBAN OTIMIZADAS
  const kanbanColumns = useMemo(() => {
    if (!mainStages?.length || !selectedFunnel?.id) {
      return [];
    }

    console.log('[SalesFunnelContent] 🏗️ Construindo colunas Kanban:', {
      stages: mainStages.length,
      leads: leads.length,
      funil: selectedFunnel.name
    });

    // Criar Map para lookup mais rápido
    const leadsByStage = new Map();
    leads.forEach(lead => {
      const stageId = lead.kanban_stage_id || lead.columnId || '';
      console.log(`[SalesFunnelContent] 🔗 Lead "${lead.name}" -> Stage: ${stageId}`);
      if (!leadsByStage.has(stageId)) {
        leadsByStage.set(stageId, []);
      }
      leadsByStage.get(stageId)?.push(lead);
    });

    console.log('[SalesFunnelContent] 📋 Mapa de leads por etapa:', {
      totalLeads: leads.length,
      etapasComLeads: Array.from(leadsByStage.keys()),
      distribuicao: Array.from(leadsByStage.entries()).map(([stageId, stageLeads]) => ({
        stageId,
        count: stageLeads.length
      }))
    });

    const columns = mainStages.map(stage => {
      const stageLeads = leadsByStage.get(stage.id) || [];

      console.log(`[SalesFunnelContent] 📊 Stage "${stage.title}": ${stageLeads.length} leads, ${stageLeads.filter(l => l.tags && l.tags.length > 0).length} com tags`);

      return {
        id: stage.id,
        title: stage.title,
        leads: stageLeads,
        color: stage.color || "#e0e0e0",
        isFixed: stage.is_fixed || false,
        isHidden: false,
        ai_enabled: stage.ai_enabled !== false
      };
    });

    return columns;
  }, [mainStages, leads, selectedFunnel?.id]);

  // Sincronizar columns com dados do servidor (respeitando otimistas)
  useEffect(() => {
    const isDragging = document.body.hasAttribute('data-dragging');
    if (isDragging || hasOptimisticChanges) {
      console.log('[SalesFunnelContent] 🚫 Sync pausado - drag ou mudanças otimistas em progresso');
      return;
    }

    if (columns.length === 0 && kanbanColumns.length > 0) {
      console.log('[SalesFunnelContent] 🚀 Inicializando columns com dados do servidor');
      setColumns(kanbanColumns);
    }
  }, [kanbanColumns, hasOptimisticChanges, columns.length]);

  // FUNÇÕES DE GERENCIAMENTO
  const createFunnel = useCallback(async (name: string, description?: string): Promise<void> => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('funnels')
        .insert([{
          name,
          description,
          created_by_user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      await refetchFunnels();
      toast.success("Funil criado com sucesso!");
    } catch (error: any) {
      console.error('[SalesFunnelContent] ❌ Erro ao criar funil:', error);
      toast.error(error.message || "Erro ao criar funil");
      throw error;
    }
  }, [refetchFunnels, user?.id]);

  // FUNÇÕES DE GERENCIAMENTO DE ETAPAS
  const addColumn = useCallback(async (title: string) => {
    if (!selectedFunnel?.id) {
      toast.error("Nenhum funil selecionado");
      return;
    }

    console.log('[SalesFunnelContent] ➕ Adicionando coluna:', title);

    try {
      await addStageToDatabase(title, "#3b82f6", selectedFunnel.id);
      await refetchStages();
      toast.success("Etapa criada com sucesso!");
    } catch (error: any) {
      console.error('[SalesFunnelContent] ❌ Erro ao adicionar coluna:', error);
      toast.error(error.message || "Erro ao criar etapa");
    }
  }, [selectedFunnel?.id, addStageToDatabase, refetchStages]);

  const updateColumn = useCallback(async (column: any) => {
    console.log('[SalesFunnelContent] ✏️ Atualizando coluna:', column.title);

    try {
      await updateStageInDatabase(column.id, {
        title: column.title,
        color: column.color
      });
      await refetchStages();
      toast.success("Etapa atualizada com sucesso!");
    } catch (error: any) {
      console.error('[SalesFunnelContent] ❌ Erro ao atualizar coluna:', error);
      toast.error(error.message || "Erro ao atualizar etapa");
    }
  }, [updateStageInDatabase, refetchStages]);

  const deleteColumn = useCallback(async (columnId: string) => {
    console.log('[SalesFunnelContent] 🗑️ Deletando coluna:', columnId);

    try {
      await deleteStageFromDatabase(columnId);
      await refetchStages();
      toast.success("Etapa removida com sucesso!");
    } catch (error: any) {
      console.error('[SalesFunnelContent] ❌ Erro ao deletar coluna:', error);
      toast.error(error.message || "Erro ao remover etapa");
    }
  }, [deleteStageFromDatabase, refetchStages]);

  // FUNÇÃO DE LEAD
  const openLeadDetail = useCallback((lead: KanbanLead) => {
    console.log('[SalesFunnelContent] 👤 Abrindo detalhes do lead:', lead.name);
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  }, []);

  // DRAG & DROP OTIMIZADO
  const moveLeadToStage = useCallback(async (leadId: string, newStageId: string) => {
    if (!user?.id || !selectedFunnel?.id) {
      toast.error("Usuário não autenticado ou funil não selecionado");
      return;
    }

    console.log('[SalesFunnelContent] 🎯 Movendo lead para stage:', { leadId, newStageId });

    try {
      // Pausar real-time durante drag
      pauseRealtime();

      // Update otimista na UI
      const optimisticColumns = columns.map(col => ({
        ...col,
        leads: col.leads.map(lead =>
          lead.id === leadId
            ? { ...lead, columnId: newStageId, kanban_stage_id: newStageId }
            : lead
        ).filter(lead => lead.id !== leadId || col.id === newStageId)
      }));

      // Adicionar lead na nova coluna se não estiver lá
      const targetColumn = optimisticColumns.find(col => col.id === newStageId);
      const movingLead = columns.flatMap(col => col.leads).find(lead => lead.id === leadId);

      if (targetColumn && movingLead && !targetColumn.leads.find(l => l.id === leadId)) {
        targetColumn.leads.push({ ...movingLead, columnId: newStageId, kanban_stage_id: newStageId });
      }

      // Marcar mudanças otimistas
      setHasOptimisticChanges(true);
      document.body.setAttribute('data-dragging', 'true');
      setColumns(optimisticColumns);

      // Sync com banco de dados
      const { error } = await supabase
        .from('leads')
        .update({
          kanban_stage_id: newStageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .eq('created_by_user_id', user.id);

      if (error) {
        console.error('[SalesFunnelContent] ❌ Erro ao mover lead:', error);
        await refetchLeads();
        toast.error("Erro ao mover lead");
        return;
      }

      console.log('[SalesFunnelContent] ✅ Lead movido com sucesso');
      toast.success("Lead movido com sucesso!");

      // Limpar marcações após 1 segundo para máxima responsividade
      setTimeout(() => {
        document.body.removeAttribute('data-dragging');
        setHasOptimisticChanges(false);
        resumeRealtime();
      }, 1000);

    } catch (error) {
      console.error('[SalesFunnelContent] ❌ Erro crítico ao mover lead:', error);
      await refetchLeads();
      toast.error("Erro ao mover lead");
    }
  }, [user?.id, selectedFunnel?.id, columns, setColumns, refetchLeads, pauseRealtime, resumeRealtime]);

  const markOptimisticChange = useCallback((value: boolean) => setHasOptimisticChanges(value), []);

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
    console.log('[SalesFunnelContent] 💬 handleOpenChat CHAMADO:', {
      leadId,
      totalLeads: leads.length,
      hasNavigate: !!navigate
    });
    
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
      console.error('[SalesFunnelContent] ❌ Lead não encontrado:', { leadId, availableLeads: leads.map(l => l.id) });
      toast.error("Lead não encontrado");
      return;
    }

    console.log('[SalesFunnelContent] 🚀 Lead encontrado - navegando para chat:', {
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      navigateUrl: `/whatsapp-chat?leadId=${lead.id}`
    });

    try {
      // Navegar para WhatsApp Chat com o leadId na URL
      navigate(`/whatsapp-chat?leadId=${lead.id}`);
      
      toast.success(`Abrindo chat com ${lead.name}`, {
        description: "Redirecionando para o WhatsApp..."
      });
      
      console.log('[SalesFunnelContent] ✅ Navegação executada com sucesso');
    } catch (error) {
      console.error('[SalesFunnelContent] ❌ ERRO na navegação:', error);
      toast.error('Erro ao abrir chat');
    }
  }, [navigate, leads]);

  // Função auxiliar para uso em outros componentes que ainda passam KanbanLead
  const handleOpenChatWithLead = useCallback((lead: KanbanLead) => {
    console.log('[SalesFunnelContent] 📨 handleOpenChatWithLead CHAMADO:', {
      leadId: lead.id,
      leadName: lead.name,
      hasHandleOpenChat: !!handleOpenChat,
      timestamp: new Date().toISOString()
    });

    try {
      handleOpenChat(lead.id);
      console.log('[SalesFunnelContent] ✅ handleOpenChat executado com sucesso para:', lead.name);
    } catch (error) {
      console.error('[SalesFunnelContent] ❌ Erro ao executar handleOpenChat:', error);
    }
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
                markOptimisticChange={markOptimisticChange}
                funnelId={selectedFunnel?.id}
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
              leads={filterLeads(leads.map(lead => ({
                id: lead.id,
                name: lead.name,
                phone: lead.phone,
                email: lead.email || '',
                company: lead.company || '',
                lastMessage: lead.last_message || '',
                lastMessageTime: lead.last_message_time || '',
                purchaseValue: lead.purchase_value || 0,
                unreadCount: lead.unread_count || 0,
                columnId: lead.kanban_stage_id || '',
                assignedUser: lead.owner_id || '',
                avatar: lead.profile_pic_url || '',
                tags: [],
                notes: lead.notes || '',
                profile_pic_url: lead.profile_pic_url || '',
                created_at: lead.created_at || '',
                funnel_id: lead.funnel_id || '',
                kanban_stage_id: lead.kanban_stage_id || '',
                owner_id: lead.owner_id || ''
              }) as KanbanLead))}
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
        selectedFunnelId={selectedFunnel?.id}
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
