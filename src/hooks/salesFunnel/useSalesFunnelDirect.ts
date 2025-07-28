
/**
 * 🚀 HOOK PRINCIPAL PARA SALES FUNNEL - CORRIGIDO PARA PHASE 2
 * 
 * Responsabilidades:
 * - Gerenciar estado dos funnels, stages e leads
 * - Operações CRUD completas
 * - Integração com Supabase
 * - Transformação de dados para KanbanLead
 * - Mutações otimizadas
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Funnel, KanbanStage } from '@/types/funnel';
import { KanbanColumn, KanbanLead, KanbanTag } from '@/types/kanban';

export const useSalesFunnelDirect = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Estados locais
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);

  // 📊 QUERY: FUNNELS
  const { 
    data: funnels = [], 
    isLoading: funnelsLoading,
    error: funnelsError,
    refetch: refetchFunnels 
  } = useQuery({
    queryKey: ['funnels', user?.id],
    queryFn: async () => {
      console.log('[Sales Funnel Direct] 📊 Buscando funnels do usuário:', user?.id);
      
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('created_by_user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[Sales Funnel Direct] ❌ Erro ao buscar funnels:', error);
        throw error;
      }

      console.log('[Sales Funnel Direct] ✅ Funnels carregados:', data.length);
      return data as Funnel[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false
  });

  // 🏗️ QUERY: STAGES
  const { 
    data: stages = [], 
    isLoading: stagesLoading,
    error: stagesError,
    refetch: refetchStages 
  } = useQuery({
    queryKey: ['kanban_stages', selectedFunnel?.id],
    queryFn: async () => {
      if (!selectedFunnel?.id) return [];
      
      console.log('[Sales Funnel Direct] 🏗️ Buscando stages do funil:', selectedFunnel.id);
      
      const { data, error } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('funnel_id', selectedFunnel.id)
        .eq('created_by_user_id', user?.id)
        .order('order_position', { ascending: true });

      if (error) {
        console.error('[Sales Funnel Direct] ❌ Erro ao buscar stages:', error);
        throw error;
      }

      console.log('[Sales Funnel Direct] ✅ Stages carregados:', data.length);
      return data as KanbanStage[];
    },
    enabled: !!selectedFunnel?.id && !!user?.id,
    staleTime: 5 * 60 * 1000
  });

  // 👥 QUERY: LEADS COM TRANSFORMAÇÃO
  const { 
    data: rawLeads = [], 
    isLoading: leadsLoading,
    error: leadsError,
    refetch: refetchLeads 
  } = useQuery({
    queryKey: ['leads', selectedFunnel?.id],
    queryFn: async () => {
      if (!selectedFunnel?.id) return [];
      
      console.log('[Sales Funnel Direct] 👥 Buscando leads do funil:', selectedFunnel.id);
      
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          lead_tags (
            id,
            tag_id,
            tags (
              id,
              name,
              color
            )
          )
        `)
        .eq('funnel_id', selectedFunnel.id)
        .eq('created_by_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Sales Funnel Direct] ❌ Erro ao buscar leads:', error);
        throw error;
      }

      console.log('[Sales Funnel Direct] ✅ Leads carregados:', data.length);
      return data;
    },
    enabled: !!selectedFunnel?.id && !!user?.id,
    staleTime: 2 * 60 * 1000 // 2 minutos para leads (mais dinâmico)
  });

  // 🔄 TRANSFORMAR LEADS PARA KanbanLead
  const leads = useMemo(() => {
    return rawLeads.map(lead => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email || '',
      company: lead.company || '',
      lastMessage: lead.last_message || 'Sem mensagens',
      lastMessageTime: lead.last_message_time || lead.created_at,
      tags: lead.lead_tags?.map(lt => ({
        id: lt.tags.id,
        name: lt.tags.name,
        color: lt.tags.color
      })) || [],
      notes: lead.notes || '',
      columnId: lead.kanban_stage_id || '',
      purchaseValue: lead.purchase_value ? Number(lead.purchase_value) : undefined,
      assignedUser: lead.owner_id || '',
      unreadCount: lead.unread_count || 0,
      avatar: undefined,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      whatsapp_number_id: lead.whatsapp_number_id,
      funnel_id: lead.funnel_id,
      kanban_stage_id: lead.kanban_stage_id,
      owner_id: lead.owner_id
    })) as KanbanLead[];
  }, [rawLeads]);

  // 🏷️ QUERY: TAGS
  const { data: availableTags = [] } = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('created_by_user_id', user?.id)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as KanbanTag[];
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000
  });

  // 🔄 TRANSFORMAR STAGES EM COLUNAS
  useEffect(() => {
    if (!stages.length || !leads.length) {
      setColumns([]);
      return;
    }

    const newColumns: KanbanColumn[] = stages.map(stage => ({
      id: stage.id,
      title: stage.title,
      color: stage.color || '#e0e0e0',
      isFixed: stage.is_fixed || false,
      ai_enabled: stage.ai_enabled,
      leads: leads.filter(lead => lead.kanban_stage_id === stage.id)
    }));

    setColumns(newColumns);
  }, [stages, leads]);

  // 📊 DEFINIR FUNNEL PADRÃO
  useEffect(() => {
    if (funnels.length > 0 && !selectedFunnel) {
      const defaultFunnel = funnels[0];
      setSelectedFunnel(defaultFunnel);
      console.log('[Sales Funnel Direct] 📊 Funnel padrão selecionado:', defaultFunnel.name);
    }
  }, [funnels, selectedFunnel]);

  // 🎯 ENCONTRAR STAGES WON/LOST
  const wonStageId = useMemo(() => 
    stages.find(stage => stage.is_won)?.id, 
    [stages]
  );
  
  const lostStageId = useMemo(() => 
    stages.find(stage => stage.is_lost)?.id, 
    [stages]
  );

  // 🏗️ MUTATION: CRIAR FUNNEL - CORRIGIDO
  const createFunnel = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('funnels')
        .insert({
          name,
          created_by_user_id: user?.id,
          description: `Funil criado em ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
      setSelectedFunnel(data);
      toast.success(`Funnel "${data.name}" criado com sucesso`);
    },
    onError: (error) => {
      toast.error('Erro ao criar funnel', {
        description: error.message
      });
    }
  });

  // 🏗️ MUTATION: CRIAR STAGE
  const addColumn = useMutation({
    mutationFn: async ({ title, color }: { title: string; color?: string }) => {
      const maxOrder = Math.max(...stages.map(s => s.order_position), -1);
      
      const { data, error } = await supabase
        .from('kanban_stages')
        .insert({
          title,
          color: color || '#e0e0e0',
          funnel_id: selectedFunnel?.id,
          created_by_user_id: user?.id,
          order_position: maxOrder + 1
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_stages'] });
      toast.success('Nova etapa criada');
    },
    onError: (error) => {
      toast.error('Erro ao criar etapa', {
        description: error.message
      });
    }
  });

  // 🏗️ MUTATION: ATUALIZAR STAGE
  const updateColumn = useMutation({
    mutationFn: async (column: KanbanColumn) => {
      const { error } = await supabase
        .from('kanban_stages')
        .update({
          title: column.title,
          color: column.color
        })
        .eq('id', column.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_stages'] });
      toast.success('Etapa atualizada');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar etapa', {
        description: error.message
      });
    }
  });

  // 🏗️ MUTATION: DELETAR STAGE
  const deleteColumn = useMutation({
    mutationFn: async (columnId: string) => {
      const { error } = await supabase
        .from('kanban_stages')
        .delete()
        .eq('id', columnId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_stages'] });
      toast.success('Etapa removida');
    },
    onError: (error) => {
      toast.error('Erro ao remover etapa', {
        description: error.message
      });
    }
  });

  // 👥 MUTATION: ATUALIZAR LEAD - CORRIGIDO
  const updateLead = useMutation({
    mutationFn: async ({ leadId, fields }: { leadId: string; fields: any }) => {
      const { error } = await supabase
        .from('leads')
        .update(fields)
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar lead', {
        description: error.message
      });
    }
  });

  // 🎯 FUNÇÕES DE AÇÃO
  const openLeadDetail = useCallback((lead: KanbanLead) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  }, []);

  const toggleTagOnLead = useCallback((leadId: string, tagId: string) => {
    // Implementar toggle de tag
    console.log('Toggle tag:', { leadId, tagId });
  }, []);

  const createTag = useCallback((name: string, color: string) => {
    // Implementar criação de tag
    console.log('Create tag:', { name, color });
  }, []);

  const updateLeadNotes = useCallback((notes: string) => {
    if (!selectedLead) return;
    updateLead.mutate({ 
      leadId: selectedLead.id, 
      fields: { notes } 
    });
  }, [selectedLead, updateLead]);

  const updateLeadPurchaseValue = useCallback((value: number | undefined) => {
    if (!selectedLead) return;
    updateLead.mutate({ 
      leadId: selectedLead.id, 
      fields: { purchase_value: value } 
    });
  }, [selectedLead, updateLead]);

  const updateLeadAssignedUser = useCallback((user: string) => {
    if (!selectedLead) return;
    updateLead.mutate({ 
      leadId: selectedLead.id, 
      fields: { owner_id: user } 
    });
  }, [selectedLead, updateLead]);

  const updateLeadName = useCallback((name: string) => {
    if (!selectedLead) return;
    updateLead.mutate({ 
      leadId: selectedLead.id, 
      fields: { name } 
    });
  }, [selectedLead, updateLead]);

  // 🚀 ESTADO CONSOLIDADO
  const loading = funnelsLoading || stagesLoading || leadsLoading;
  const error = funnelsError || stagesError || leadsError;

  return {
    // Estado
    loading,
    error,
    
    // Dados
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel: createFunnel.mutate, // ✅ CORRIGIDO: Retornar apenas mutate
    
    // Colunas e leads
    columns,
    setColumns,
    stages,
    leads,
    wonStageId,
    lostStageId,
    
    // Lead selecionado
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    
    // Tags
    availableTags,
    
    // Ações
    addColumn: (title: string, color?: string) => addColumn.mutate({ title, color }),
    updateColumn: updateColumn.mutate,
    deleteColumn: deleteColumn.mutate,
    
    // Ações de lead
    openLeadDetail,
    toggleTagOnLead,
    createTag,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    updateLead, // ✅ MANTER updateLead
    
    // Refresh
    refetchLeads,
    refetchStages,
    refetchFunnels
  };
};
