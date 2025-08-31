
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStageManagement } from "./useStageManagement";
import { useTagDatabase } from "./useTagDatabase";
import { KanbanColumn, KanbanLead, KanbanTag } from "@/types/kanban";
import { Funnel, KanbanStage } from "@/types/funnel";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function useSalesFunnelDirect() {
  const { user } = useAuth();
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);

  // Verificar se o usuário é admin
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.email === 'inacio@ticlin.com.br';
  
  // Logging para monitoring multi-tenancy
  console.log('[useSalesFunnelDirect] 🚀 Hook iniciado para usuário:', user?.email, 'isAdmin:', isAdmin);

  // Database hooks - usando queries diretas COM filtro de usuário
  const { data: funnels = [], isLoading: funnelLoading, refetch: refetchFunnels } = useQuery({
    queryKey: ['funnels', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // ESTRUTURA DIRETA: Buscar apenas funis do usuário para isolamento multi-tenant
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('[useSalesFunnelDirect] Erro ao buscar funis:', error);
        throw error;
      }
      
      console.log('[useSalesFunnelDirect] 📊 Funis carregados:', data?.length || 0);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos de cache
    gcTime: 5 * 60 * 1000 // 5 minutos no garbage collector
  });

  const { data: stages = [], isLoading: stagesLoading, refetch: refetchStages } = useQuery({
    queryKey: ['stages', selectedFunnel?.id],
    queryFn: async () => {
      if (!selectedFunnel?.id) return [];
      
      const { data, error } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('funnel_id', selectedFunnel.id)
        .order('order_position', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedFunnel?.id,
    staleTime: 1 * 60 * 1000, // 1 minuto de cache para stages
    gcTime: 3 * 60 * 1000
  });

  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['leads', selectedFunnel?.id, user?.id, isAdmin],
    queryFn: async () => {
      if (!selectedFunnel?.id || !user?.id) return [];

      console.log('[useSalesFunnelDirect] 🔍 Buscando leads:', {
        funnelId: selectedFunnel.id,
        userId: user.id,
        isAdmin,
        userEmail: user.email
      });

      // Carregar leads de forma paginada para evitar limite de 1000
      const PAGE_SIZE = 1000;
      let allLeads: any[] = [];
      
      for (let offset = 0; ; offset += PAGE_SIZE) {
        let query = supabase
          .from('leads')
          .select(`
            id, name, phone, email, company, notes, 
            last_message, last_message_time, purchase_value, 
            unread_count, owner_id, created_by_user_id, kanban_stage_id, funnel_id,
            whatsapp_number_id, created_at, updated_at, profile_pic_url,
            conversation_status,
            owner:owner_id (
              id,
              full_name
            ),
            creator:created_by_user_id (
              id,
              full_name
            ),
            lead_tags(
              tag_id,
              tags:tag_id(
                id,
                name,
                color
              )
            )
          `)
          .eq('funnel_id', selectedFunnel.id)
          .in('conversation_status', ['active', 'closed']);

        // FILTRO CORRETO: Admin vê todos os seus leads, Team vê apenas leads responsáveis
        if (isAdmin) {
          console.log('[useSalesFunnelDirect] 👑 Usuário ADMIN - buscando todos os leads criados por ele');
          query = query.eq('created_by_user_id', user.id);
        } else {
          console.log('[useSalesFunnelDirect] 👤 Usuário TEAM - buscando apenas leads responsáveis');
          query = query.or(`owner_id.eq.${user.id},created_by_user_id.eq.${user.id}`);
        }

        const { data, error } = await query
          .order('updated_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) throw error;
        
        allLeads = allLeads.concat(data || []);
        if (!data || data.length < PAGE_SIZE) break;
      }
      
      console.log('[useSalesFunnelDirect] 📊 Leads carregados:', {
        count: allLeads?.length || 0,
        isAdmin,
        userId: user.id,
        funnelId: selectedFunnel.id
      });
      
      return allLeads;
    },
    enabled: !!selectedFunnel?.id && !!user?.id,
    staleTime: 30 * 1000, // 30 segundos de cache para leads (mais dinâmico)
    gcTime: 2 * 60 * 1000
  });

  const { tags: availableTags } = useTagDatabase();
  
  // Stage management hook - INTEGRADO
  const { 
    addColumn: addStageToDatabase,
    updateColumn: updateStageInDatabase,
    deleteColumn: deleteStageFromDatabase 
  } = useStageManagement();

  console.log('[useSalesFunnelDirect] 📊 Estado atual:', {
    selectedFunnelId: selectedFunnel?.id,
    funnelsCount: funnels?.length || 0,
    stagesCount: stages?.length || 0,
    leadsCount: leads?.length || 0,
    columnsCount: columns.length,
    loading: { funnel: funnelLoading, stages: stagesLoading, leads: leadsLoading }
  });

  // Auto-selecionar primeiro funil
  useEffect(() => {
    if (!funnelLoading && !selectedFunnel && funnels && funnels.length > 0) {
      console.log('[useSalesFunnelDirect] 🔄 Auto-selecionando primeiro funil:', funnels[0].name);
      setSelectedFunnel(funnels[0]);
    }
  }, [funnelLoading, selectedFunnel, funnels]);

  // Construir colunas Kanban quando stages/leads mudarem
  useEffect(() => {
    if (!stages || !leads) {
      setColumns([]);
      return;
    }

    console.log('[useSalesFunnelDirect] 🏗️ Construindo colunas Kanban:', {
      stagesCount: stages.length,
      leadsCount: leads.length
    });

    // Filtrar apenas etapas principais (não GANHO nem PERDIDO)
    const mainStages = stages.filter(stage => !stage.is_won && !stage.is_lost);

    const kanbanColumns: KanbanColumn[] = mainStages.map(stage => {
      const stageLeads = leads
        .filter(lead => lead.kanban_stage_id === stage.id)
        .map((lead): KanbanLead => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email || undefined,
          company: lead.company || undefined,
          lastMessage: lead.last_message || "Sem mensagens",
          lastMessageTime: lead.last_message_time ? new Date(lead.last_message_time).toISOString() : new Date().toISOString(),
          tags: lead.lead_tags?.map(lt => lt.tags) || [], // Mapear tags do lead
          notes: lead.notes || undefined,
          columnId: stage.id,
          purchaseValue: lead.purchase_value ? Number(lead.purchase_value) : undefined,
          assignedUser: lead.owner?.full_name || lead.creator?.full_name || lead.created_by_user_id || undefined,
          unreadCount: lead.unread_count || 0,
          avatar: undefined,
          profile_pic_url: lead.profile_pic_url || undefined,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
          company_id: undefined,
          whatsapp_number_id: lead.whatsapp_number_id || undefined,
          funnel_id: lead.funnel_id,
          kanban_stage_id: lead.kanban_stage_id || undefined,
          owner_id: lead.owner_id || undefined,
          ownerName: lead.owner?.full_name || undefined
        }));

      return {
        id: stage.id,
        title: stage.title,
        leads: stageLeads,
        color: stage.color || "#e0e0e0",
        isFixed: stage.is_fixed || false,
        isHidden: false,
        ai_enabled: stage.ai_enabled !== false // Nova propriedade
      };
    });

    setColumns(kanbanColumns);
  }, [stages, leads]);

  // Create funnel function - FIXED to return Promise<void>
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
      console.error('[useSalesFunnelDirect] ❌ Erro ao criar funil:', error);
      toast.error(error.message || "Erro ao criar funil");
      throw error;
    }
  }, [refetchFunnels, user?.id]);

  // IMPLEMENTAR FUNÇÕES DE GERENCIAMENTO DE ETAPAS
  const addColumn = useCallback(async (title: string) => {
    if (!selectedFunnel?.id) {
      toast.error("Nenhum funil selecionado");
      return;
    }

    console.log('[useSalesFunnelDirect] ➕ Adicionando coluna:', title);
    
    try {
      await addStageToDatabase(title, "#3b82f6", selectedFunnel.id);
      await refetchStages();
      toast.success("Etapa criada com sucesso!");
    } catch (error: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao adicionar coluna:', error);
      toast.error(error.message || "Erro ao criar etapa");
    }
  }, [selectedFunnel?.id, addStageToDatabase, refetchStages]);

  const updateColumn = useCallback(async (column: KanbanColumn) => {
    console.log('[useSalesFunnelDirect] ✏️ Atualizando coluna:', column.title);
    
    try {
      await updateStageInDatabase(column.id, {
        title: column.title,
        color: column.color
      });
      await refetchStages();
      toast.success("Etapa atualizada com sucesso!");
    } catch (error: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao atualizar coluna:', error);
      toast.error(error.message || "Erro ao atualizar etapa");
    }
  }, [updateStageInDatabase, refetchStages]);

  const deleteColumn = useCallback(async (columnId: string) => {
    console.log('[useSalesFunnelDirect] 🗑️ Deletando coluna:', columnId);
    
    try {
      await deleteStageFromDatabase(columnId);
      await refetchStages();
      toast.success("Etapa removida com sucesso!");
    } catch (error: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao deletar coluna:', error);
      toast.error(error.message || "Erro ao remover etapa");
    }
  }, [deleteStageFromDatabase, refetchStages]);

  // FUNÇÕES DE LEAD
  const openLeadDetail = useCallback((lead: KanbanLead) => {
    console.log('[useSalesFunnelDirect] 👤 Abrindo detalhes do lead:', lead.name);
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  }, []);

  const toggleTagOnLead = useCallback((leadId: string, tagId: string) => {
    console.log('[useSalesFunnelDirect] 🏷️ Toggle tag no lead:', leadId, tagId);
    // TODO: Implementar lógica de tags
  }, []);

  const updateLeadNotes = useCallback((notes: string) => {
    console.log('[useSalesFunnelDirect] 📝 Atualizando notas do lead:', notes);
    // TODO: Implementar atualização de notas
  }, []);

  const updateLeadPurchaseValue = useCallback((value: number | undefined) => {
    console.log('[useSalesFunnelDirect] 💰 Atualizando valor de compra:', value);
    // TODO: Implementar atualização de valor
  }, []);

  const updateLeadAssignedUser = useCallback((user: string) => {
    console.log('[useSalesFunnelDirect] 👤 Atualizando usuário responsável:', user);
    // TODO: Implementar atualização de usuário
  }, []);

  const updateLeadName = useCallback((name: string) => {
    console.log('[useSalesFunnelDirect] ✏️ Atualizando nome do lead:', name);
    // TODO: Implementar atualização de nome
  }, []);

  // Identificar estágios especiais
  const wonStageId = stages?.find(s => s.is_won)?.id;
  const lostStageId = stages?.find(s => s.is_lost)?.id;

  return {
    // Estado de carregamento
    loading: funnelLoading || stagesLoading || leadsLoading,
    error: null,

    // Dados do funil
    funnels: funnels || [],
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,

    // Dados das colunas e leads
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags: availableTags || [],
    stages: stages || [],
    leads: leads || [],
    wonStageId,
    lostStageId,

    // Ações de gerenciamento de etapas - AGORA FUNCIONAIS
    addColumn,
    updateColumn,
    deleteColumn,

    // Ações de lead
    openLeadDetail,
    toggleTagOnLead,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,

    // Funções de refresh
    refetchLeads: async () => {
      await refetchLeads();
    },
    refetchStages: async () => {
      await refetchStages();
    }
  };
}
