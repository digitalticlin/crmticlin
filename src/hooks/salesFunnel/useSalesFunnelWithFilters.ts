import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStageManagement } from "./useStageManagement";
import { useTagDatabase } from "./useTagDatabase";
import { useDataFilters } from "@/hooks/useDataFilters";
import { KanbanColumn, KanbanLead, KanbanTag } from "@/types/kanban";
import { Funnel, KanbanStage } from "@/types/funnel";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

/**
 * 🎯 HOOK SALES FUNNEL COM FILTROS CONDICIONAIS
 * - Admin: Vê funis que criou (created_by_user_id)
 * - Operacional: Vê funis atribuídos (user_funnels) e leads atribuídos (owner_id)
 * - Mesma interface, lógica condicional interna
 */
export function useSalesFunnelWithFilters() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { role, funnelsFilter, leadsFilter, loading: filtersLoading } = useDataFilters();
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);

  console.log('🎯 [useSalesFunnelWithFilters] Hook iniciado:', {
    userId: user?.id,
    role,
    selectedFunnelId: selectedFunnel?.id,
    filtersLoading,
    funnelsFilter,
    leadsFilter
  });

  // 🎯 QUERY DE FUNIS COM FILTROS CONDICIONAIS
  const { data: funnels = [], isLoading: funnelLoading, refetch: refetchFunnels } = useQuery({
    queryKey: ['funnels-with-filters', user?.id, role, funnelsFilter],
    queryFn: async () => {
      if (!user?.id || filtersLoading || !funnelsFilter) {
        console.log('[useSalesFunnelWithFilters] ⚠️ Aguardando filtros...');
        return [];
      }
      
      console.log('[useSalesFunnelWithFilters] 📊 Buscando funis com filtros:', { role, funnelsFilter });
      
      try {
        let query = supabase.from('funnels').select('*');

        // 🔒 APLICAR FILTROS CONDICIONAIS
        if (role === 'admin') {
          // Admin: Funis que criou
          query = query.eq('created_by_user_id', funnelsFilter.created_by_user_id);
          console.log('[useSalesFunnelWithFilters] 👑 Filtro ADMIN aplicado');
          
        } else if (role === 'operational') {
          // Operacional: Funis atribuídos via user_funnels
          if (funnelsFilter.id === 'no-access') {
            console.log('[useSalesFunnelWithFilters] 🚫 Usuário operacional sem funis atribuídos');
            return [];
          }
          query = query.in('id', funnelsFilter.id.in);
          console.log('[useSalesFunnelWithFilters] 🎯 Filtro OPERACIONAL aplicado:', funnelsFilter.id.in);
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) {
          console.error('[useSalesFunnelWithFilters] ❌ Erro ao buscar funis:', error);
          throw error;
        }

        console.log('[useSalesFunnelWithFilters] ✅ Funis carregados:', {
          role,
          count: data?.length || 0,
          sample: data?.slice(0, 2).map(f => ({ id: f.id, name: f.name }))
        });

        return data || [];
        
      } catch (error) {
        console.error('[useSalesFunnelWithFilters] ❌ Erro:', error);
        return [];
      }
    },
    enabled: !!user?.id && !filtersLoading && !!funnelsFilter,
    staleTime: 2 * 60 * 1000
  });

  // 🎯 QUERY DE STAGES (mesma lógica original)
  const { data: stages = [], isLoading: stagesLoading, refetch: refetchStages } = useQuery({
    queryKey: ['stages-with-filters', selectedFunnel?.id],
    queryFn: async () => {
      if (!selectedFunnel?.id) return [];
      
      const { data, error } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('funnel_id', selectedFunnel.id)
        .order('order_position', { ascending: true });
      
      if (error) throw error;
      console.log('[useSalesFunnelWithFilters] ✅ Stages encontrados:', data?.length || 0);
      return data || [];
    },
    enabled: !!selectedFunnel?.id,
    staleTime: 1 * 60 * 1000
  });

  // 🎯 QUERY DE LEADS COM FILTROS CONDICIONAIS
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads, error: leadsError } = useQuery({
    queryKey: ['leads-with-filters', selectedFunnel?.id, user?.id, role, leadsFilter],
    queryFn: async () => {
      if (!selectedFunnel?.id || !user?.id || filtersLoading || !leadsFilter) {
        console.log('[useSalesFunnelWithFilters] ⚠️ Aguardando parâmetros leads...');
        return [];
      }

      console.log('[useSalesFunnelWithFilters] 📊 Buscando leads:', {
        funnelId: selectedFunnel.id,
        role,
        leadsFilter
      });
      
      try {
        let query = supabase
          .from('leads')
          .select(`
            id, name, phone, email, company, notes, 
            last_message, last_message_time, purchase_value, 
            unread_count, owner_id, created_by_user_id, kanban_stage_id, funnel_id,
            whatsapp_number_id, created_at, updated_at, profile_pic_url,
            conversation_status
          `)
          .eq('funnel_id', selectedFunnel.id)
          .in('conversation_status', ['active', 'closed']);

        // 🔒 APLICAR FILTROS CONDICIONAIS
        if (role === 'admin') {
          // Admin: Leads dos funis que criou
          query = query.eq('created_by_user_id', leadsFilter.created_by_user_id);
          console.log('[useSalesFunnelWithFilters] 👑 Filtro LEADS ADMIN aplicado');
          
        } else if (role === 'operational') {
          // Operacional: Apenas leads atribuídos a ele
          query = query.eq('owner_id', leadsFilter.owner_id);
          console.log('[useSalesFunnelWithFilters] 🎯 Filtro LEADS OPERACIONAL aplicado');
        }

        const { data, error } = await query.order('updated_at', { ascending: false });
          
        if (error) {
          console.error('[useSalesFunnelWithFilters] ❌ Erro ao buscar leads:', error);
          throw error;
        }
        
        console.log('[useSalesFunnelWithFilters] ✅ Leads carregados:', {
          role,
          count: data?.length || 0,
          funnelId: selectedFunnel.id,
          sample: data?.slice(0, 2).map(l => ({ 
            id: l.id, 
            name: l.name, 
            owner_id: l.owner_id,
            created_by_user_id: l.created_by_user_id
          }))
        });
        
        return data || [];
      } catch (error) {
        console.error('[useSalesFunnelWithFilters] ❌ Erro crítico leads:', error);
        return [];
      }
    },
    enabled: !!selectedFunnel?.id && !!user?.id && !filtersLoading && !!leadsFilter,
    staleTime: 3 * 60 * 1000,
    retry: 2
  });

  const { tags: availableTags } = useTagDatabase();
  
  const { 
    addColumn: addStageToDatabase,
    updateColumn: updateStageInDatabase,
    deleteColumn: deleteStageFromDatabase 
  } = useStageManagement();

  // Auto-selecionar primeiro funil
  useEffect(() => {
    if (!funnelLoading && !selectedFunnel && funnels && funnels.length > 0) {
      console.log('[useSalesFunnelWithFilters] Auto-selecionando primeiro funil:', funnels[0].name);
      setSelectedFunnel(funnels[0]);
    }
  }, [funnelLoading, funnels]);

  // 🚀 CONSTRUIR COLUNAS KANBAN (mesma lógica otimizada)
  const kanbanColumns = useMemo(() => {
    if (!stages?.length || !selectedFunnel?.id) {
      return [];
    }

    const mainStages = stages.filter(stage => !stage.is_won && !stage.is_lost);
    
    if (!mainStages.length) {
      return [];
    }

    const leadsByStage = new Map<string, any[]>();
    leads.forEach(lead => {
      if (!leadsByStage.has(lead.kanban_stage_id)) {
        leadsByStage.set(lead.kanban_stage_id, []);
      }
      leadsByStage.get(lead.kanban_stage_id)?.push(lead);
    });

    const columns = mainStages.map(stage => {
      const stageLeads = (leadsByStage.get(stage.id) || [])
        .map((lead): KanbanLead => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email || undefined,
          company: lead.company || undefined,
          lastMessage: lead.last_message || "Sem mensagens",
          lastMessageTime: lead.last_message_time ? new Date(lead.last_message_time).toISOString() : new Date().toISOString(),
          tags: [],
          notes: lead.notes || undefined,
          columnId: stage.id,
          purchaseValue: lead.purchase_value ? Number(lead.purchase_value) : undefined,
          assignedUser: lead.owner_id || undefined,
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
          ownerName: undefined
        }));

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
  }, [stages, leads, selectedFunnel?.id]);

  // Atualizar columns
  useEffect(() => {
    if (kanbanColumns.length > 0) {
      setColumns(kanbanColumns);
    }
  }, [kanbanColumns]);

  // 🚀 FUNÇÕES DE GERENCIAMENTO (mesma lógica original)
  const createFunnel = useCallback(async (name: string, description?: string): Promise<void> => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    // Verificar se é admin (apenas admins podem criar funis)
    if (role !== 'admin') {
      toast.error("Apenas administradores podem criar funis");
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
      console.error('[useSalesFunnelWithFilters] ❌ Erro ao criar funil:', error);
      toast.error(error.message || "Erro ao criar funil");
      throw error;
    }
  }, [refetchFunnels, user?.id, role]);

  const addColumn = useCallback(async (title: string) => {
    if (!selectedFunnel?.id || role !== 'admin') {
      toast.error(role !== 'admin' ? "Sem permissão para criar etapas" : "Nenhum funil selecionado");
      return;
    }

    try {
      await addStageToDatabase(title, "#3b82f6", selectedFunnel.id);
      await refetchStages();
      toast.success("Etapa criada com sucesso!");
    } catch (error: any) {
      console.error('[useSalesFunnelWithFilters] ❌ Erro ao adicionar coluna:', error);
      toast.error(error.message || "Erro ao criar etapa");
    }
  }, [selectedFunnel?.id, addStageToDatabase, refetchStages, role]);

  const updateColumn = useCallback(async (column: KanbanColumn) => {
    if (role !== 'admin') {
      toast.error("Sem permissão para editar etapas");
      return;
    }

    try {
      await updateStageInDatabase(column.id, {
        title: column.title,
        color: column.color
      });
      await refetchStages();
      toast.success("Etapa atualizada com sucesso!");
    } catch (error: any) {
      console.error('[useSalesFunnelWithFilters] ❌ Erro ao atualizar coluna:', error);
      toast.error(error.message || "Erro ao atualizar etapa");
    }
  }, [updateStageInDatabase, refetchStages, role]);

  const deleteColumn = useCallback(async (columnId: string) => {
    if (role !== 'admin') {
      toast.error("Sem permissão para deletar etapas");
      return;
    }

    try {
      await deleteStageFromDatabase(columnId);
      await refetchStages();
      toast.success("Etapa removida com sucesso!");
    } catch (error: any) {
      console.error('[useSalesFunnelWithFilters] ❌ Erro ao deletar coluna:', error);
      toast.error(error.message || "Erro ao remover etapa");
    }
  }, [deleteStageFromDatabase, refetchStages, role]);

  const openLeadDetail = useCallback((lead: KanbanLead) => {
    console.log('[useSalesFunnelWithFilters] 👤 Abrindo detalhes do lead:', lead.name);
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  }, []);

  // 🎯 DRAG & DROP COM VERIFICAÇÃO DE PERMISSÃO
  const moveLeadToStage = useCallback(async (leadId: string, newStageId: string) => {
    if (!user?.id || !selectedFunnel?.id) {
      toast.error("Usuário não autenticado ou funil não selecionado");
      return;
    }

    // Verificar se tem acesso ao lead
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
      toast.error("Lead não encontrado ou sem permissão");
      return;
    }

    console.log('[useSalesFunnelWithFilters] 🎯 Movendo lead:', { leadId, newStageId, role });

    try {
      // Update otimista na UI
      const optimisticColumns = columns.map(col => ({
        ...col,
        leads: col.leads.map(lead => 
          lead.id === leadId 
            ? { ...lead, columnId: newStageId, kanban_stage_id: newStageId }
            : lead
        ).filter(lead => lead.id !== leadId || col.id === newStageId)
      }));

      const targetColumn = optimisticColumns.find(col => col.id === newStageId);
      const movingLead = columns.flatMap(col => col.leads).find(lead => lead.id === leadId);
      
      if (targetColumn && movingLead && !targetColumn.leads.find(l => l.id === leadId)) {
        targetColumn.leads.push({ ...movingLead, columnId: newStageId, kanban_stage_id: newStageId });
      }

      setColumns(optimisticColumns);

      // Sync com banco - filtro por permissão
      let updateQuery = supabase
        .from('leads')
        .update({ 
          kanban_stage_id: newStageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      // Filtro de segurança baseado no role
      if (role === 'admin') {
        updateQuery = updateQuery.eq('created_by_user_id', user.id);
      } else if (role === 'operational') {
        updateQuery = updateQuery.eq('owner_id', user.id);
      }

      const { error } = await updateQuery;

      if (error) {
        console.error('[useSalesFunnelWithFilters] ❌ Erro ao mover lead:', error);
        await refetchLeads();
        toast.error("Erro ao mover lead");
        return;
      }

      console.log('[useSalesFunnelWithFilters] ✅ Lead movido com sucesso');
      toast.success("Lead movido com sucesso!");

    } catch (error) {
      console.error('[useSalesFunnelWithFilters] ❌ Erro crítico ao mover lead:', error);
      await refetchLeads();
      toast.error("Erro ao mover lead");
    }
  }, [user?.id, selectedFunnel?.id, columns, setColumns, refetchLeads, leads, role]);

  // Identificar estágios especiais
  const wonStageId = stages?.find(s => s.is_won)?.id;
  const lostStageId = stages?.find(s => s.is_lost)?.id;

  return {
    // Estado de carregamento
    loading: funnelLoading || stagesLoading || leadsLoading || filtersLoading,
    funnelLoading,
    stagesLoading,
    leadsLoading,
    error: leadsError,
    leadsError,

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

    // Ações de gerenciamento de etapas
    addColumn,
    updateColumn,
    deleteColumn,

    // Ações de lead
    openLeadDetail,
    moveLeadToStage,

    // Funções de refresh
    refetchLeads: async () => {
      await refetchLeads();
    },
    refetchStages: async () => {
      await refetchStages();
    },

    // Info adicional
    role,
    hasPermission: !filtersLoading && !!leadsFilter && !!funnelsFilter
  };
}