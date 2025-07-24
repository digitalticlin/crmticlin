import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStageManagement } from "./useStageManagement";
import { useTagDatabase } from "./useTagDatabase";
import { KanbanColumn, KanbanLead, KanbanTag } from "@/types/kanban";
import { Funnel, KanbanStage } from "@/types/funnel";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const CACHE_TIME = 5 * 60 * 1000; // 5 minutos
const LEADS_PER_PAGE = 50; // Paginação para performance

export function useSalesFunnelOptimized() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);

  // Database hooks com cache otimizado
  const { data: funnels = [], isLoading: funnelLoading, refetch: refetchFunnels } = useQuery({
    queryKey: ['funnels-optimized'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME * 2
  });

  const { data: stages = [], isLoading: stagesLoading, refetch: refetchStages } = useQuery({
    queryKey: ['stages-optimized', selectedFunnel?.id],
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
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME * 2
  });

  // Query otimizada para leads com paginação inteligente
  const { data: leadsData = [], isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['leads-optimized', selectedFunnel?.id],
    queryFn: async () => {
      if (!selectedFunnel?.id) return [];
      
      // Buscar TODOS os leads essenciais sem limite para carregamento completo
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id, name, phone, email, company, notes, 
          last_message, last_message_time, purchase_value, 
          unread_count, owner_id, kanban_stage_id, funnel_id,
          whatsapp_number_id, created_at, updated_at,
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
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      console.log('[useSalesFunnelOptimized] 📊 Leads carregados:', {
        count: data?.length || 0,
        funnelId: selectedFunnel.id,
        timestamp: new Date().toISOString()
      });
      
      return data || [];
    },
    enabled: !!selectedFunnel?.id,
    staleTime: 1000, // 1 segundo para dados mais frescos
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: true, // Refetch quando a janela receber foco
    refetchOnMount: true // Sempre refetch ao montar
  });

  const { tags: availableTags } = useTagDatabase();
  
  // Stage management hook
  const { 
    addColumn: addStageToDatabase,
    updateColumn: updateStageInDatabase,
    deleteColumn: deleteStageFromDatabase 
  } = useStageManagement();

  console.log('[useSalesFunnelOptimized] 📊 Estado atual OTIMIZADO:', {
    selectedFunnelId: selectedFunnel?.id,
    funnelsCount: funnels?.length || 0,
    stagesCount: stages?.length || 0,
    leadsCount: leadsData?.length || 0,
    columnsCount: columns.length,
    loading: { funnel: funnelLoading, stages: stagesLoading, leads: leadsLoading }
  });

  // Auto-selecionar primeiro funil
  useEffect(() => {
    if (!funnelLoading && !selectedFunnel && funnels && funnels.length > 0) {
      console.log('[useSalesFunnelOptimized] 🔄 Auto-selecionando primeiro funil:', funnels[0].name);
      setSelectedFunnel(funnels[0]);
    }
  }, [funnelLoading, selectedFunnel, funnels]);

  // Construir colunas Kanban com memoização otimizada
  const optimizedColumns = useMemo(() => {
    if (!stages || !leadsData) return [];

    console.log('[useSalesFunnelOptimized] 🏗️ Reconstruindo colunas otimizadas:', {
      stagesCount: stages.length,
      leadsCount: leadsData.length
    });

    // Filtrar apenas etapas principais (não GANHO nem PERDIDO)
    const mainStages = stages.filter(stage => !stage.is_won && !stage.is_lost);

    const kanbanColumns: KanbanColumn[] = mainStages.map(stage => {
      const stageLeads = leadsData
        .filter(lead => lead.kanban_stage_id === stage.id)
        .map((lead): KanbanLead => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email || undefined,
          company: lead.company || undefined,
          lastMessage: lead.last_message || "Sem mensagens",
          lastMessageTime: lead.last_message_time ? new Date(lead.last_message_time).toISOString() : new Date().toISOString(),
          tags: lead.lead_tags?.map(lt => lt.tags) || [],
          notes: lead.notes || undefined,
          columnId: stage.id,
          purchaseValue: lead.purchase_value ? Number(lead.purchase_value) : undefined,
          assignedUser: lead.owner_id || undefined,
          unreadCount: lead.unread_count || 0,
          avatar: undefined,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
          company_id: undefined,
          whatsapp_number_id: lead.whatsapp_number_id || undefined,
          funnel_id: lead.funnel_id,
          kanban_stage_id: lead.kanban_stage_id || undefined,
          owner_id: lead.owner_id || undefined
        }));

      return {
        id: stage.id,
        title: stage.title,
        leads: stageLeads,
        color: stage.color || "#e0e0e0",
        isFixed: stage.is_fixed || false,
        isHidden: false
      };
    });

    return kanbanColumns;
  }, [stages, leadsData]);

  // Atualizar columns apenas quando necessário
  useEffect(() => {
    setColumns(optimizedColumns);
  }, [optimizedColumns]);

  // Create funnel function
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
      console.error('[useSalesFunnelOptimized] ❌ Erro ao criar funil:', error);
      toast.error(error.message || "Erro ao criar funil");
      throw error;
    }
  }, [refetchFunnels, user?.id]);

  // Stage management functions
  const addColumn = useCallback(async (title: string) => {
    if (!selectedFunnel?.id) {
      toast.error("Nenhum funil selecionado");
      return;
    }

    console.log('[useSalesFunnelOptimized] ➕ Adicionando coluna:', title);
    
    try {
      await addStageToDatabase(title, "#3b82f6", selectedFunnel.id);
      await refetchStages();
      toast.success("Etapa criada com sucesso!");
    } catch (error: any) {
      console.error('[useSalesFunnelOptimized] ❌ Erro ao adicionar coluna:', error);
      toast.error(error.message || "Erro ao criar etapa");
    }
  }, [selectedFunnel?.id, addStageToDatabase, refetchStages]);

  const updateColumn = useCallback(async (column: KanbanColumn) => {
    console.log('[useSalesFunnelOptimized] ✏️ Atualizando coluna:', column.title);
    
    try {
      await updateStageInDatabase(column.id, {
        title: column.title,
        color: column.color
      });
      await refetchStages();
      toast.success("Etapa atualizada com sucesso!");
    } catch (error: any) {
      console.error('[useSalesFunnelOptimized] ❌ Erro ao atualizar coluna:', error);
      toast.error(error.message || "Erro ao atualizar etapa");
    }
  }, [updateStageInDatabase, refetchStages]);

  const deleteColumn = useCallback(async (columnId: string) => {
    console.log('[useSalesFunnelOptimized] 🗑️ Deletando coluna:', columnId);
    
    try {
      await deleteStageFromDatabase(columnId);
      await refetchStages();
      toast.success("Etapa removida com sucesso!");
    } catch (error: any) {
      console.error('[useSalesFunnelOptimized] ❌ Erro ao deletar coluna:', error);
      toast.error(error.message || "Erro ao remover etapa");
    }
  }, [deleteStageFromDatabase, refetchStages]);

  // Lead functions
  const openLeadDetail = useCallback((lead: KanbanLead) => {
    console.log('[useSalesFunnelOptimized] 👤 Abrindo detalhes do lead:', lead.name);
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  }, []);

  const toggleTagOnLead = useCallback((leadId: string, tagId: string) => {
    console.log('[useSalesFunnelOptimized] 🏷️ Toggle tag no lead:', leadId, tagId);
    // TODO: Implementar lógica de tags
  }, []);

  const updateLeadNotes = useCallback((notes: string) => {
    console.log('[useSalesFunnelOptimized] 📝 Atualizando notas do lead:', notes);
    // TODO: Implementar atualização de notas
  }, []);

  const updateLeadPurchaseValue = useCallback((value: number | undefined) => {
    console.log('[useSalesFunnelOptimized] 💰 Atualizando valor de compra:', value);
    // TODO: Implementar atualização de valor
  }, []);

  const updateLeadAssignedUser = useCallback((user: string) => {
    console.log('[useSalesFunnelOptimized] 👤 Atualizando usuário responsável:', user);
    // TODO: Implementar atualização de usuário
  }, []);

  const updateLeadName = useCallback((name: string) => {
    console.log('[useSalesFunnelOptimized] ✏️ Atualizando nome do lead:', name);
    // TODO: Implementar atualização de nome
  }, []);

  // Identificar estágios especiais
  const wonStageId = stages?.find(s => s.is_won)?.id;
  const lostStageId = stages?.find(s => s.is_lost)?.id;

  // Inscrição em tempo real para atualizações de tags
  useEffect(() => {
    if (!selectedFunnel?.id) return;

    // Primeiro, buscar todos os lead_ids do funil selecionado
    const fetchLeadIds = async () => {
      console.log('[useSalesFunnelOptimized] 🔍 Buscando lead_ids do funil:', selectedFunnel.id);
      
      const { data: leadIds } = await supabase
        .from('leads')
        .select('id')
        .eq('funnel_id', selectedFunnel.id)
        .order('updated_at', { ascending: false })
        .limit(200);
      
      console.log('[useSalesFunnelOptimized] ✅ Lead IDs encontrados:', leadIds?.length || 0);
      return leadIds?.map(l => l.id) || [];
    };

    // Configurar inscrição para mudanças em lead_tags
    const setupSubscription = async () => {
      const leadIds = await fetchLeadIds();
      
      if (leadIds.length === 0) {
        console.log('[useSalesFunnelOptimized] ⚠️ Nenhum lead encontrado para monitorar');
        return;
      }

      console.log('[useSalesFunnelOptimized] 🔄 Configurando inscrição para', leadIds.length, 'leads');

      // ❌ REMOVIDO: SUBSCRIPTION PARA LEAD_TAGS
      // Motivo: useLeadTags + eventos customizados já fazem isso
      // Esta subscription duplicava o trabalho desnecessariamente

      // 🚀 NOVA SUBSCRIPTION: Escutar mudanças no unread_count dos leads
      const leadsUnreadChannel = supabase
        .channel('leads-unread-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'leads',
            filter: `id=in.(${leadIds.join(',')})`
          },
          (payload) => {
            console.log('[useSalesFunnelOptimized] 📨 Mudança detectada em lead (unread_count):', {
              leadId: payload.new?.id,
              oldUnreadCount: payload.old?.unread_count,
              newUnreadCount: payload.new?.unread_count,
              leadName: payload.new?.name
            });
            
            // Invalidar o cache e forçar um refetch quando unread_count mudar
            if (payload.old?.unread_count !== payload.new?.unread_count) {
              console.log('[useSalesFunnelOptimized] 🔄 Unread count alterado - atualizando funil');
              queryClient.invalidateQueries({
                queryKey: ['leads-optimized', selectedFunnel.id]
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('[useSalesFunnelOptimized] 📡 Status da inscrição unread:', status);
        });

      // Cleanup
      return () => {
        console.log('[useSalesFunnelOptimized] 🧹 Limpando inscrições');
        leadsUnreadChannel.unsubscribe();
      };
    };

    const cleanup = setupSubscription();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [selectedFunnel?.id, queryClient]);

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
    leads: leadsData || [],
    wonStageId,
    lostStageId,

    // Ações de gerenciamento de etapas
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