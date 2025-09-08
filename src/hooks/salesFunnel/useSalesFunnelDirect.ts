
import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStageManagement } from "./useStageManagement";
import { useTagDatabase } from "./useTagDatabase";
import { useAccessControl } from "@/hooks/useAccessControl";
import { KanbanColumn, KanbanLead, KanbanTag } from "@/types/kanban";
import { Funnel, KanbanStage } from "@/types/funnel";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function useSalesFunnelDirect() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { userFunnels, canViewAllFunnels, isLoading: accessLoading } = useAccessControl();
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);

  // Verificar se o usuário é admin
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.email === 'inacio@ticlin.com.br';
  
  // Logging básico para monitoring
  console.log('[useSalesFunnelDirect] Hook iniciado:', {
    userId: user?.id,
    isAdmin,
    selectedFunnelId: selectedFunnel?.id
  });

  // Database hooks - usando queries diretas COM filtro de acesso corrigido
  const { data: funnels = [], isLoading: funnelLoading, refetch: refetchFunnels } = useQuery({
    queryKey: ['funnels', user?.id, canViewAllFunnels, userFunnels],
    queryFn: async () => {
      if (!user?.id || accessLoading) return [];
      
      console.log('[useSalesFunnelDirect] 🔍 Buscando funis acessíveis:', {
        userId: user.id,
        canViewAll: canViewAllFunnels,
        userFunnelsCount: userFunnels.length
      });
      
      try {
        if (canViewAllFunnels) {
          // Admin/Manager: buscar todos os funis criados por ele
          const { data: ownedFunnels, error } = await supabase
            .from('funnels')
            .select('*')
            .eq('created_by_user_id', user.id)
            .order('created_at', { ascending: true });
            
          if (error) throw error;
          console.log('[useSalesFunnelDirect] ✅ Funis próprios encontrados:', ownedFunnels?.length || 0);
          return ownedFunnels || [];
        } else {
          // Operacional: buscar apenas funis atribuídos
          if (userFunnels.length === 0) {
            console.log('[useSalesFunnelDirect] ⚠️ Usuário sem funis atribuídos');
            return [];
          }
          
          const { data: assignedFunnels, error } = await supabase
            .from('funnels')
            .select('*')
            .in('id', userFunnels)
            .order('created_at', { ascending: true });
            
          if (error) throw error;
          console.log('[useSalesFunnelDirect] ✅ Funis atribuídos encontrados:', assignedFunnels?.length || 0);
          return assignedFunnels || [];
        }
      } catch (error) {
        console.error('[useSalesFunnelDirect] ❌ Erro ao buscar funis:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !accessLoading,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
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
      console.log('[useSalesFunnelDirect] Stages encontrados:', data?.length || 0);
      return data || [];
    },
    enabled: !!selectedFunnel?.id,
    staleTime: 1 * 60 * 1000, // 1 minuto de cache para stages
    gcTime: 3 * 60 * 1000
  });

  // 🔄 REVERTER: Query de leads original que funcionava
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads, error: leadsError } = useQuery({
    queryKey: ['leads', selectedFunnel?.id, user?.id, canViewAllFunnels],
    queryFn: async () => {
      if (!selectedFunnel?.id || !user?.id || accessLoading) {
        console.log('[useSalesFunnelDirect] ⏸️ Query BLOQUEADA - falta funnel ou user ou access carregando');
        return [];
      }

      console.log('[useSalesFunnelDirect] 🔍 EXECUTANDO QUERY LEADS:', {
        funnelId: selectedFunnel.id,
        userId: user.id,
        canViewAll: canViewAllFunnels
      });
      
      try {
        // Query simplificada usando a mesma lógica de acesso
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

        // 🚀 ESCALA: RLS automático - filtros no backend
        console.log('[useSalesFunnelDirect] 🔐 Confiando no RLS para filtros multitenant');
        console.log('[useSalesFunnelDirect] 🔑 Auth context:', {
          authUserId: user.id,
          userRole: canViewAllFunnels ? 'admin' : 'operational',
          funnelId: selectedFunnel.id
        });

        const { data: allLeads, error } = await query
          .order('updated_at', { ascending: false });
          
        if (error) {
          console.error('[useSalesFunnelDirect] ❌ ERRO QUERY LEADS:', error);
          throw error;
        }
        
        console.log('[useSalesFunnelDirect] ✅ LEADS ENCONTRADOS:', {
          count: allLeads?.length || 0,
          funnelId: selectedFunnel.id,
          canViewAll: canViewAllFunnels,
          first3: allLeads?.slice(0, 3)?.map(l => ({ id: l.id, name: l.name, stage: l.kanban_stage_id }))
        });
        
        return allLeads || [];
      } catch (error) {
        console.error('[useSalesFunnelDirect] ❌ ERRO CRÍTICO na query:', error);
        return [];
      }
    },
    enabled: !!selectedFunnel?.id && !!user?.id && !accessLoading,
    staleTime: 3 * 60 * 1000, // 3 minutos para reduzir refetch
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
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

  // Auto-selecionar primeiro funil - SÓ UMA VEZ
  useEffect(() => {
    if (!funnelLoading && !selectedFunnel && funnels && funnels.length > 0) {
      console.log('[useSalesFunnelDirect] Auto-selecionando primeiro funil:', funnels[0].name);
      setSelectedFunnel(funnels[0]);
    }
  }, [funnelLoading, funnels]); // Removida dependência de selectedFunnel para evitar loop

  // 🚀 PERFORMANCE: Construir colunas Kanban com cache otimizado
  const kanbanColumns = useMemo(() => {
    // Debounce desnecessário - só logar em dev
    if (process.env.NODE_ENV === 'development') {
      console.log('[useSalesFunnelDirect] 🔧 Reconstruindo kanbanColumns:', {
        stagesLength: stages?.length,
        leadsLength: leads?.length,
        selectedFunnelId: selectedFunnel?.id
      });
    }

    if (!stages?.length || !selectedFunnel?.id) {
      return [];
    }

    // Filtrar apenas etapas principais (não GANHO nem PERDIDO)
    const mainStages = stages.filter(stage => !stage.is_won && !stage.is_lost);
    
    if (!mainStages.length) {
      return [];
    }

    // 🚀 OTIMIZAÇÃO: Criar Map para lookup mais rápido
    const leadsByStage = new Map<string, any[]>();
    leads.forEach(lead => {
      if (!leadsByStage.has(lead.kanban_stage_id)) {
        leadsByStage.set(lead.kanban_stage_id, []);
      }
      leadsByStage.get(lead.kanban_stage_id)?.push(lead);
    });

    return mainStages.map(stage => {
      const stageLeads = (leadsByStage.get(stage.id) || [])
        .map((lead): KanbanLead => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email || undefined,
          company: lead.company || undefined,
          lastMessage: lead.last_message || "Sem mensagens",
          lastMessageTime: lead.last_message_time ? new Date(lead.last_message_time).toISOString() : new Date().toISOString(),
          tags: [], // Lazy load - tags carregadas sob demanda
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
          ownerName: undefined // Lazy load - nome do owner carregado sob demanda
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
  }, [
    // 🚀 PERFORMANCE: Dependências otimizadas para evitar re-renders
    stages?.map(s => `${s.id}-${s.title}`).join(','), // String simples para stages
    leads?.length, // Apenas length ao invés do array completo
    selectedFunnel?.id
  ]);

  // Atualizar columns apenas quando kanbanColumns mudar - COM verificação simples para evitar loops  
  useEffect(() => {
    // Comparação simples por length primeiro (mais eficiente)
    if (columns.length !== kanbanColumns.length || 
        (kanbanColumns.length > 0 && columns[0]?.id !== kanbanColumns[0]?.id)) {
      console.log('[useSalesFunnelDirect] 🔄 Atualizando columns:', kanbanColumns.length);
      setColumns(kanbanColumns);
    }
  }, [kanbanColumns]); // SEM dependência de columns para evitar loop

  // 🚀 REAL-TIME SUBSCRIPTIONS - ULTRA OTIMIZADO
  useEffect(() => {
    if (!user?.id || !selectedFunnel?.id || accessLoading) return;

    if (process.env.NODE_ENV === 'development') {
      console.log('[useSalesFunnelDirect] 🔄 Configurando Real-time subscriptions para funil:', selectedFunnel.id);
    }

    // Throttle mais agressivo para reduzir invalidações excessivas
    let invalidationTimeout: NodeJS.Timeout | null = null;
    let pendingInvalidations = new Set<string>();
    
    const throttledInvalidation = (queryKey: any[]) => {
      const keyString = JSON.stringify(queryKey);
      pendingInvalidations.add(keyString);
      
      if (invalidationTimeout) return;
      
      invalidationTimeout = setTimeout(() => {
        // Processar todas as invalidações pendentes de uma vez
        pendingInvalidations.forEach(key => {
          queryClient.invalidateQueries({ queryKey: JSON.parse(key) });
        });
        pendingInvalidations.clear();
        invalidationTimeout = null;
      }, 5000); // 5 segundos de throttle para reduzir queries
    };

    const leadsSubscription = supabase
      .channel(`leads-${selectedFunnel.id}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `funnel_id=eq.${selectedFunnel.id}`
        },
        (payload) => {
          // Só invalidar na página atual para performance
          throttledInvalidation(['leads', selectedFunnel.id, user.id, canViewAllFunnels]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kanban_stages',
          filter: `funnel_id=eq.${selectedFunnel.id}`
        },
        (payload) => {
          throttledInvalidation(['stages', selectedFunnel.id]);
        }
      )
      .subscribe();

    return () => {
      if (invalidationTimeout) {
        clearTimeout(invalidationTimeout);
      }
      try {
        supabase.removeChannel(leadsSubscription);
      } catch (error) {
        console.warn('[useSalesFunnelDirect] Erro ao desconectar subscription:', error);
      }
    };
  }, [user?.id, selectedFunnel?.id, queryClient, canViewAllFunnels, accessLoading]);

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

  // 🚀 DRAG & DROP COM SYNC AUTOMÁTICO - TEMPO REAL
  const moveLeadToStage = useCallback(async (leadId: string, newStageId: string) => {
    if (!user?.id || !selectedFunnel?.id) {
      toast.error("Usuário não autenticado ou funil não selecionado");
      return;
    }

    console.log('[useSalesFunnelDirect] 🎯 Movendo lead para stage:', { leadId, newStageId });

    try {
      // Update otimista na UI (antes da confirmação do servidor)
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

      setColumns(optimisticColumns);

      // Sync com banco de dados
      const { error } = await supabase
        .from('leads')
        .update({ 
          kanban_stage_id: newStageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .eq('created_by_user_id', user.id); // Segurança: apenas leads do usuário

      if (error) {
        console.error('[useSalesFunnelDirect] ❌ Erro ao mover lead:', error);
        // Reverter UI em caso de erro
        await refetchLeads();
        toast.error("Erro ao mover lead");
        return;
      }

      console.log('[useSalesFunnelDirect] ✅ Lead movido com sucesso - Real-time ativo');
      toast.success("Lead movido com sucesso!");

    } catch (error) {
      console.error('[useSalesFunnelDirect] ❌ Erro crítico ao mover lead:', error);
      await refetchLeads(); // Reverter para estado do servidor
      toast.error("Erro ao mover lead");
    }
  }, [user?.id, selectedFunnel?.id, columns, setColumns, refetchLeads]);

  // Identificar estágios especiais
  const wonStageId = stages?.find(s => s.is_won)?.id;
  const lostStageId = stages?.find(s => s.is_lost)?.id;


  return {
    // Estado de carregamento - incluir accessLoading para evitar render prematuro
    loading: funnelLoading || stagesLoading || leadsLoading || accessLoading,
    error: leadsError,

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
    moveLeadToStage,

    // Funções de refresh
    refetchLeads: async () => {
      await refetchLeads();
    },
    refetchStages: async () => {
      await refetchStages();
    }
  };
}
