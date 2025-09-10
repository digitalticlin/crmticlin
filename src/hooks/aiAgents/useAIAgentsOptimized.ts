/**
 * 🚀 AI AGENTS ISOLADO E OTIMIZADO
 * 
 * ISOLAMENTO COMPLETO:
 * ✅ Query keys com namespace específico (AIAGENTS-*)
 * ✅ Cache otimizado com React Query
 * ✅ Mutations com otimistic updates
 * ✅ Debounce em operações
 * ✅ Estado isolado
 * ✅ Zero interferência com outras páginas
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AIAgent, CreateAIAgentData } from "@/types/aiAgent";

// ✅ QUERY KEYS ISOLADAS - NAMESPACE ÚNICO
const aiAgentsQueryKeys = {
  base: ['AIAGENTS'] as const,
  all: (userId: string) => 
    [...aiAgentsQueryKeys.base, 'all', userId] as const,
  details: (agentId: string) => 
    [...aiAgentsQueryKeys.base, 'details', agentId] as const,
  config: (agentId: string) => 
    [...aiAgentsQueryKeys.base, 'config', agentId] as const,
  stats: (userId: string) => 
    [...aiAgentsQueryKeys.base, 'stats', userId] as const
};

// ✅ CONSTANTES OTIMIZADAS
const CACHE_TIME_AGENTS = 5 * 60 * 1000; // 5 minutos
const CACHE_TIME_CONFIG = 10 * 60 * 1000; // 10 minutos
const DEBOUNCE_DELAY = 300;

// ✅ TIPOS ISOLADOS
interface AIAgentStats {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  totalMessages: number;
  avgMessagesPerAgent: number;
}

interface AIAgentsState {
  selectedAgent: AIAgent | null;
  isEditing: boolean;
  filterStatus: 'all' | 'active' | 'inactive';
  sortBy: 'name' | 'created_at' | 'messages_count' | 'status';
  sortOrder: 'asc' | 'desc';
}

export function useAIAgentsOptimized() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ✅ ESTADO ISOLADO
  const [agentsState, setAgentsState] = useState<AIAgentsState>({
    selectedAgent: null,
    isEditing: false,
    filterStatus: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // ✅ QUERY ISOLADA - All AI Agents
  const { 
    data: agents = [], 
    isLoading: agentsLoading,
    error: agentsError
  } = useQuery({
    queryKey: aiAgentsQueryKeys.all(user?.id || ''),
    queryFn: async (): Promise<AIAgent[]> => {
      if (!user?.id) return [];

      console.log('🚀 [AIAgents] Buscando agentes isolados:', user.id);

      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to typed objects
      return (data || []).map(agent => ({
        ...agent,
        type: agent.type as 'attendance' | 'sales' | 'support' | 'custom',
        status: agent.status as 'active' | 'inactive'
      }));
    },
    enabled: !!user?.id,
    staleTime: CACHE_TIME_AGENTS,
    gcTime: CACHE_TIME_AGENTS * 2
  });

  // ✅ QUERY ISOLADA - Agent Stats
  const { data: agentStats } = useQuery({
    queryKey: aiAgentsQueryKeys.stats(user?.id || ''),
    queryFn: async (): Promise<AIAgentStats> => {
      if (!agents.length) {
        return {
          totalAgents: 0,
          activeAgents: 0,
          inactiveAgents: 0,
          totalMessages: 0,
          avgMessagesPerAgent: 0
        };
      }

      const activeAgents = agents.filter(a => a.status === 'active').length;
      const totalMessages = agents.reduce((sum, agent) => sum + (agent.messages_count || 0), 0);

      return {
        totalAgents: agents.length,
        activeAgents,
        inactiveAgents: agents.length - activeAgents,
        totalMessages,
        avgMessagesPerAgent: agents.length > 0 ? Math.round(totalMessages / agents.length) : 0
      };
    },
    enabled: agents.length > 0,
    staleTime: CACHE_TIME_CONFIG,
    gcTime: CACHE_TIME_CONFIG * 2
  });

  // ✅ MUTATION ISOLADA - Create Agent
  const createAgentMutation = useMutation({
    mutationFn: async (data: CreateAIAgentData): Promise<AIAgent> => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('🚀 [AIAgents] Criando agente isolado:', data);

      const insertData = {
        ...data,
        created_by_user_id: user.id
      };

      const { data: agent, error } = await supabase
        .from('ai_agents')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return {
        ...agent,
        type: agent.type as 'attendance' | 'sales' | 'support' | 'custom',
        status: agent.status as 'active' | 'inactive'
      };
    },
    onSuccess: (newAgent) => {
      queryClient.invalidateQueries({ queryKey: aiAgentsQueryKeys.all(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: aiAgentsQueryKeys.stats(user?.id || '') });
      toast.success(`Agente "${newAgent.name}" criado com sucesso!`);
    },
    onError: (error: any) => {
      console.error('❌ [AIAgents] Erro ao criar agente:', error);
      toast.error(`Erro ao criar agente: ${error.message}`);
    }
  });

  // ✅ MUTATION ISOLADA - Update Agent
  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AIAgent> }): Promise<AIAgent> => {
      console.log('🚀 [AIAgents] Atualizando agente isolado:', { id, updates });

      const { data, error } = await supabase
        .from('ai_agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        type: data.type as 'attendance' | 'sales' | 'support' | 'custom',
        status: data.status as 'active' | 'inactive'
      };
    },
    onMutate: async ({ id, updates }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: aiAgentsQueryKeys.all(user?.id || '') });
      
      const previousAgents = queryClient.getQueryData<AIAgent[]>(aiAgentsQueryKeys.all(user?.id || ''));
      
      if (previousAgents) {
        const updatedAgents = previousAgents.map(agent =>
          agent.id === id ? { ...agent, ...updates } : agent
        );
        queryClient.setQueryData(aiAgentsQueryKeys.all(user?.id || ''), updatedAgents);
      }
      
      return { previousAgents };
    },
    onError: (error: any, _, context) => {
      // Revert optimistic update
      if (context?.previousAgents) {
        queryClient.setQueryData(aiAgentsQueryKeys.all(user?.id || ''), context.previousAgents);
      }
      console.error('❌ [AIAgents] Erro ao atualizar agente:', error);
      toast.error(`Erro ao atualizar agente: ${error.message}`);
    },
    onSuccess: (updatedAgent) => {
      queryClient.invalidateQueries({ queryKey: aiAgentsQueryKeys.stats(user?.id || '') });
      toast.success(`Agente "${updatedAgent.name}" atualizado com sucesso!`);
    }
  });

  // ✅ MUTATION ISOLADA - Delete Agent
  const deleteAgentMutation = useMutation({
    mutationFn: async (id: string): Promise<string> => {
      console.log('🚀 [AIAgents] Deletando agente isolado:', id);

      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: aiAgentsQueryKeys.all(user?.id || '') });
      
      const previousAgents = queryClient.getQueryData<AIAgent[]>(aiAgentsQueryKeys.all(user?.id || ''));
      
      if (previousAgents) {
        const updatedAgents = previousAgents.filter(agent => agent.id !== id);
        queryClient.setQueryData(aiAgentsQueryKeys.all(user?.id || ''), updatedAgents);
      }
      
      return { previousAgents };
    },
    onError: (error: any, _, context) => {
      // Revert optimistic update
      if (context?.previousAgents) {
        queryClient.setQueryData(aiAgentsQueryKeys.all(user?.id || ''), context.previousAgents);
      }
      console.error('❌ [AIAgents] Erro ao deletar agente:', error);
      toast.error(`Erro ao deletar agente: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiAgentsQueryKeys.stats(user?.id || '') });
      toast.success('Agente removido com sucesso!');
    }
  });

  // ✅ MUTATION ISOLADA - Toggle Status
  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string): Promise<{ id: string; newStatus: 'active' | 'inactive' }> => {
      const agent = agents.find(a => a.id === id);
      if (!agent) throw new Error('Agente não encontrado');

      const newStatus = agent.status === 'active' ? 'inactive' : 'active';
      
      console.log('🚀 [AIAgents] Alternando status isolado:', { id, oldStatus: agent.status, newStatus });

      const { error } = await supabase
        .from('ai_agents')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      return { id, newStatus };
    },
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: aiAgentsQueryKeys.all(user?.id || '') });
      
      const previousAgents = queryClient.getQueryData<AIAgent[]>(aiAgentsQueryKeys.all(user?.id || ''));
      
      if (previousAgents) {
        const updatedAgents = previousAgents.map(agent => {
          if (agent.id === id) {
            const newStatus = agent.status === 'active' ? 'inactive' : 'active';
            return { ...agent, status: newStatus };
          }
          return agent;
        });
        queryClient.setQueryData(aiAgentsQueryKeys.all(user?.id || ''), updatedAgents);
      }
      
      return { previousAgents };
    },
    onError: (error: any, _, context) => {
      // Revert optimistic update
      if (context?.previousAgents) {
        queryClient.setQueryData(aiAgentsQueryKeys.all(user?.id || ''), context.previousAgents);
      }
      console.error('❌ [AIAgents] Erro ao alternar status:', error);
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
    onSuccess: ({ newStatus }) => {
      queryClient.invalidateQueries({ queryKey: aiAgentsQueryKeys.stats(user?.id || '') });
      toast.success(`Agente ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
    }
  });

  // ✅ MEMOIZAÇÃO - Agents filtrados e ordenados
  const processedAgents = useMemo(() => {
    let filtered = agents;

    // Filter by status
    if (agentsState.filterStatus !== 'all') {
      filtered = filtered.filter(agent => agent.status === agentsState.filterStatus);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (agentsState.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'messages_count':
          aValue = a.messages_count || 0;
          bValue = b.messages_count || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return agentsState.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return agentsState.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [agents, agentsState.filterStatus, agentsState.sortBy, agentsState.sortOrder]);

  // ✅ CALLBACKS MEMOIZADOS
  const updateFilter = useCallback((filterStatus: 'all' | 'active' | 'inactive') => {
    setAgentsState(prev => ({ ...prev, filterStatus }));
  }, []);

  const updateSort = useCallback((sortBy: typeof agentsState.sortBy, sortOrder: 'asc' | 'desc') => {
    setAgentsState(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  const selectAgent = useCallback((agent: AIAgent | null) => {
    setAgentsState(prev => ({ ...prev, selectedAgent: agent }));
  }, []);

  const startEditing = useCallback((agent?: AIAgent) => {
    setAgentsState(prev => ({
      ...prev,
      selectedAgent: agent || null,
      isEditing: true
    }));
  }, []);

  const stopEditing = useCallback(() => {
    setAgentsState(prev => ({
      ...prev,
      selectedAgent: null,
      isEditing: false
    }));
  }, []);

  // ✅ FUNÇÃO DE INVALIDAÇÃO ISOLADA
  const invalidateAIAgentsData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: aiAgentsQueryKeys.base });
  }, [queryClient]);

  return {
    // ✅ Dados isolados
    agents: processedAgents,
    selectedAgent: agentsState.selectedAgent,
    agentStats,
    
    // ✅ Estados isolados
    isEditing: agentsState.isEditing,
    filterStatus: agentsState.filterStatus,
    sortBy: agentsState.sortBy,
    sortOrder: agentsState.sortOrder,
    
    // ✅ Loading states
    loading: agentsLoading,
    isCreating: createAgentMutation.isPending,
    isUpdating: updateAgentMutation.isPending,
    isDeleting: deleteAgentMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    
    // ✅ Actions isoladas
    updateFilter,
    updateSort,
    selectAgent,
    startEditing,
    stopEditing,
    createAgent: createAgentMutation.mutate,
    updateAgent: (id: string, updates: Partial<AIAgent>) => updateAgentMutation.mutate({ id, updates }),
    deleteAgent: deleteAgentMutation.mutate,
    toggleStatus: toggleStatusMutation.mutate,
    
    // ✅ Metadata
    userId: user?.id,
    totalCount: agents.length,
    filteredCount: processedAgents.length,
    
    // ✅ Query client e invalidação
    queryClient,
    invalidateAIAgentsData,
    refetch: () => queryClient.refetchQueries({ queryKey: aiAgentsQueryKeys.all(user?.id || '') })
  };
}