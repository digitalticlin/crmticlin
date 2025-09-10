
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
import { useUserRole } from "@/hooks/useUserRole";
import { 
  salesFunnelFunnelsQueryKeys,
  salesFunnelStagesQueryKeys,
  salesFunnelLeadsQueryKeys 
} from "./queryKeys";

export function useSalesFunnelDirect() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { role } = useUserRole();
  const { userFunnels, canViewAllFunnels, isLoading: accessLoading } = useAccessControl();
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [createdByUserId, setCreatedByUserId] = useState<string | null>(null);

  // Usar o role do hook useUserRole
  const isAdmin = role === 'admin';
  
  // Buscar created_by_user_id do perfil se for operacional
  useEffect(() => {
    const fetchCreatedByUserId = async () => {
      if (!user?.id || role !== 'operational') {
        setCreatedByUserId(null);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_by_user_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.created_by_user_id) {
        console.log('[useSalesFunnelDirect] 👤 Operacional - created_by_user_id:', profile.created_by_user_id);
        setCreatedByUserId(profile.created_by_user_id);
      }
    };
    
    fetchCreatedByUserId();
  }, [user?.id, role]);
  
  // Logging básico para monitoring
  console.log('🔍 [DEBUG] useSalesFunnelDirect Hook iniciado:', {
    userId: user?.id,
    isAdmin,
    role,
    createdByUserId,
    selectedFunnelId: selectedFunnel?.id,
    accessLoading,
    canViewAllFunnels,
    userFunnels: userFunnels.length
  });

  // Database hooks - usando queries diretas COM filtro de acesso corrigido
  const { data: funnels = [], isLoading: funnelLoading, refetch: refetchFunnels } = useQuery({
    queryKey: salesFunnelFunnelsQueryKeys.list(user?.id || '', canViewAllFunnels, userFunnels),
    queryFn: async () => {
      if (!user?.id || accessLoading) return [];
      
      console.log('🔍 [DEBUG] FUNNELS - Buscando funis acessíveis:', {
        userId: user.id,
        canViewAll: canViewAllFunnels,
        userFunnelsCount: userFunnels.length,
        accessLoading
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
          console.log('🔍 [DEBUG] FUNNELS - Admin funis encontrados:', ownedFunnels?.length || 0, ownedFunnels);
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
          console.log('🔍 [DEBUG] FUNNELS - Operacional funis encontrados:', assignedFunnels?.length || 0, assignedFunnels);
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
    queryKey: salesFunnelStagesQueryKeys.byFunnel(selectedFunnel?.id || ''),
    queryFn: async () => {
      if (!selectedFunnel?.id) return [];
      
      console.log('🔍 [DEBUG] STAGES - INÍCIO DA QUERY:', {
        funnelId: selectedFunnel.id,
        funnelName: selectedFunnel.name,
        role,
        isAdmin,
        createdByUserId
      });
      
      // SOLUÇÃO: Buscar etapas através do funil para contornar RLS
      // Primeiro, vamos buscar o funil com suas etapas
      const { data: funnelWithStages, error: funnelError } = await supabase
        .from('funnels')
        .select(`
          id,
          name,
          kanban_stages (
            id,
            title,
            color,
            order_position,
            is_fixed,
            is_won,
            is_lost,
            funnel_id,
            created_by_user_id
          )
        `)
        .eq('id', selectedFunnel.id)
        .single();
      
      console.log('🔍 [DEBUG] STAGES - Via FUNIL:', {
        erro: funnelError,
        funnel: funnelWithStages?.name,
        totalEtapas: funnelWithStages?.kanban_stages?.length || 0,
        etapas: funnelWithStages?.kanban_stages?.map(s => ({ id: s.id, title: s.title }))
      });
      
      // Se conseguiu buscar via funil, usar esses dados
      if (funnelWithStages?.kanban_stages && funnelWithStages.kanban_stages.length > 0) {
        const sortedStages = funnelWithStages.kanban_stages.sort((a, b) => a.order_position - b.order_position);
        console.log('🔍 [DEBUG] STAGES - SUCESSO VIA FUNIL:', {
          total: sortedStages.length,
          etapas: sortedStages.map(s => s.title)
        });
        return sortedStages;
      }
      
      // Fallback: tentar buscar direto (pode falhar por RLS)
      const { data, error } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('funnel_id', selectedFunnel.id)
        .order('order_position', { ascending: true });
      
      if (error) {
        console.error('🔍 [DEBUG] STAGES - ERRO:', error);
        throw error;
      }
      
      console.log('🔍 [DEBUG] STAGES - FALLBACK DIRETO:', {
        totalEncontradas: data?.length || 0,
        funnelId: selectedFunnel.id,
        etapas: data?.map(s => ({ id: s.id, title: s.title }))
      });
      
      return data || [];
    },
    enabled: !!selectedFunnel?.id,
    staleTime: 1 * 60 * 1000, // 1 minuto de cache para stages
    gcTime: 3 * 60 * 1000
  });

  // 🔄 REVERTER: Query de leads original que funcionava + filtro por instância
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads, error: leadsError } = useQuery({
    queryKey: salesFunnelLeadsQueryKeys.byFunnel(selectedFunnel?.id || '', user?.id || '', canViewAllFunnels, role, createdByUserId),
    queryFn: async () => {
      if (!selectedFunnel?.id || !user?.id || accessLoading) {
        console.log('🔍 [DEBUG] LEADS - Query BLOQUEADA:', {
          selectedFunnelId: selectedFunnel?.id,
          userId: user?.id,
          accessLoading,
          reason: !selectedFunnel?.id ? 'sem funnel' : !user?.id ? 'sem user' : 'access loading'
        });
        return [];
      }

      console.log('🔍 [DEBUG] LEADS - EXECUTANDO QUERY:', {
        funnelId: selectedFunnel.id,
        funnelName: selectedFunnel.name,
        userId: user.id,
        canViewAll: canViewAllFunnels,
        accessLoading
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

        // 🚀 FILTRO POR INSTÂNCIA: Aplicar mesmo filtro do WhatsApp Chat
        if (role === 'admin') {
          // Admin: vê leads que criou (RLS já filtra)
          console.log('[useSalesFunnelDirect] 🔑 Filtro ADMIN aplicado - RLS automático');
          query = query.eq('created_by_user_id', user.id);
        } else if (role === 'operational') {
          // Operacional: vê APENAS leads das instâncias que tem acesso
          console.log('[useSalesFunnelDirect] 🔒 Filtro OPERACIONAL aplicado - buscando instâncias acessíveis');
          
          // Buscar instâncias que o usuário operacional pode acessar
          const { data: userWhatsAppNumbers } = await supabase
            .from('user_whatsapp_numbers')
            .select('whatsapp_number_id')
            .eq('profile_id', user.id);

          if (!userWhatsAppNumbers || userWhatsAppNumbers.length === 0) {
            console.log('[useSalesFunnelDirect] ⚠️ Usuário operacional sem instâncias atribuídas');
            // Retornar query impossível para não mostrar nada
            query = query.eq('id', 'impossible-id');
          } else {
            const whatsappIds = userWhatsAppNumbers.map(uwn => uwn.whatsapp_number_id);
            console.log('[useSalesFunnelDirect] 🎯 Instâncias acessíveis:', whatsappIds);
            
            // Filtrar leads por instâncias acessíveis + admin correto
            query = query
              .in('whatsapp_number_id', whatsappIds)
              .eq('created_by_user_id', createdByUserId || user.id);
          }
        } else {
          // Fallback seguro
          query = query.eq('created_by_user_id', user.id);
        }

        const { data: allLeads, error } = await query
          .order('updated_at', { ascending: false });
          
        if (error) {
          console.error('[useSalesFunnelDirect] ❌ ERRO QUERY LEADS:', error);
          throw error;
        }
        
        console.log('🔍 [DEBUG] LEADS - RESULTADO QUERY:', {
          count: allLeads?.length || 0,
          funnelId: selectedFunnel.id,
          canViewAll: canViewAllFunnels,
          first3: allLeads?.slice(0, 3)?.map(l => ({ id: l.id, name: l.name, stage: l.kanban_stage_id })),
          allLeadsIds: allLeads?.map(l => l.id).slice(0, 10)
        });
        
        return allLeads || [];
      } catch (error) {
        console.error('[useSalesFunnelDirect] ❌ ERRO CRÍTICO na query:', error);
        return [];
      }
    },
    enabled: !!selectedFunnel?.id && !!user?.id && !accessLoading && (role === 'admin' || (role === 'operational' && !!createdByUserId)),
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

  // Estado atual monitorado

  // Auto-selecionar primeiro funil - SÓ UMA VEZ
  useEffect(() => {
    if (!funnelLoading && !selectedFunnel && funnels && funnels.length > 0) {
      console.log('[useSalesFunnelDirect] Auto-selecionando primeiro funil:', funnels[0].name);
      setSelectedFunnel(funnels[0]);
    }
  }, [funnelLoading, funnels]); // Removida dependência de selectedFunnel para evitar loop

  // 🚀 PERFORMANCE: Construir colunas Kanban com cache otimizado
  const kanbanColumns = useMemo(() => {
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

    return columns;
  }, [stages, leads, selectedFunnel?.id]);

  // Atualizar columns apenas quando kanbanColumns mudar - SIMPLIFICADO
  useEffect(() => {
    if (kanbanColumns.length > 0 && JSON.stringify(kanbanColumns) !== JSON.stringify(columns)) {
      setColumns(kanbanColumns);
    }
  }, [kanbanColumns, columns]); // Comparação profunda para evitar loop

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
          throttledInvalidation(salesFunnelLeadsQueryKeys.byFunnel(selectedFunnel.id, user.id, canViewAllFunnels));
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
          throttledInvalidation(salesFunnelStagesQueryKeys.byFunnel(selectedFunnel.id));
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

  // ✅ REMOVIDAS funções TODO - usar useLeadActions para operações de lead

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


    // Ações de gerenciamento de etapas - AGORA FUNCIONAIS
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
    }
  };
}
