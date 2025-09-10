/**
 * 🤖 AI AGENTS OTIMIZADO - REACT QUERY
 * 
 * OTIMIZAÇÕES IMPLEMENTADAS:
 * ✅ React Query para cache automático
 * ✅ Query keys isoladas (ai-agents-*)
 * ✅ Mutations otimizadas
 * ✅ Invalidação inteligente
 * ✅ Loading states automáticos
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AIAgent, CreateAIAgentData } from '@/types/aiAgent';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// ✅ QUERY KEYS ISOLADAS
const aiAgentsQueryKeys = {
  base: ['AI_AGENTS-agents'] as const,
  byUser: (userId: string) => [...aiAgentsQueryKeys.base, 'user', userId] as const,
  detail: (agentId: string) => [...aiAgentsQueryKeys.base, 'detail', agentId] as const,
  config: (agentId: string) => [...aiAgentsQueryKeys.base, 'config', agentId] as const
};

export const useAIAgentsOptimized = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ✅ QUERY OTIMIZADA - Agents com cache
  const {
    data: agents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: aiAgentsQueryKeys.byUser(user?.id || ''),
    queryFn: async (): Promise<AIAgent[]> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // 🔒 MULTITENANT: Verificar profile primeiro
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error('Profile not found');
      }

      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('created_by_user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert to typed objects
      return (data || []).map(agent => ({
        ...agent,
        type: agent.type as 'attendance' | 'sales' | 'support' | 'custom',
        status: agent.status as 'active' | 'inactive'
      }));
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // ✅ Cache de 2 minutos
    gcTime: 5 * 60 * 1000
  });

  // ✅ MUTATION OTIMIZADA - Create Agent
  const createAgentMutation = useMutation({
    mutationFn: async (agentData: CreateAIAgentData): Promise<AIAgent> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('ai_agents')
        .insert({
          ...agentData,
          created_by_user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        type: data.type as 'attendance' | 'sales' | 'support' | 'custom',
        status: data.status as 'active' | 'inactive'
      };
    },
    onSuccess: (newAgent) => {
      // ✅ OPTIMISTIC UPDATE
      queryClient.setQueryData(
        aiAgentsQueryKeys.byUser(user?.id || ''),
        (oldData: AIAgent[] = []) => [newAgent, ...oldData]
      );
      
      toast.success('Agente IA criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar agente:', error);
      toast.error('Erro ao criar agente IA');
    }
  });

  // ✅ MUTATION OTIMIZADA - Update Agent
  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AIAgent> }) => {
      const { data, error } = await supabase
        .from('ai_agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedAgent) => {
      // ✅ OPTIMISTIC UPDATE
      queryClient.setQueryData(
        aiAgentsQueryKeys.byUser(user?.id || ''),
        (oldData: AIAgent[] = []) => 
          oldData.map(agent => 
            agent.id === updatedAgent.id 
              ? { ...agent, ...updatedAgent }
              : agent
          )
      );
      
      toast.success('Agente atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar agente:', error);
      toast.error('Erro ao atualizar agente');
    }
  });

  // ✅ MUTATION OTIMIZADA - Delete Agent
  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;
      return agentId;
    },
    onSuccess: (deletedId) => {
      // ✅ OPTIMISTIC UPDATE
      queryClient.setQueryData(
        aiAgentsQueryKeys.byUser(user?.id || ''),
        (oldData: AIAgent[] = []) => 
          oldData.filter(agent => agent.id !== deletedId)
      );
      
      toast.success('Agente removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao deletar agente:', error);
      toast.error('Erro ao remover agente');
    }
  });

  // ✅ MUTATION OTIMIZADA - Toggle Status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
      const { data, error } = await supabase
        .from('ai_agents')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedAgent) => {
      // ✅ OPTIMISTIC UPDATE
      queryClient.setQueryData(
        aiAgentsQueryKeys.byUser(user?.id || ''),
        (oldData: AIAgent[] = []) => 
          oldData.map(agent => 
            agent.id === updatedAgent.id 
              ? { ...agent, status: updatedAgent.status as 'active' | 'inactive' }
              : agent
          )
      );
      
      const statusText = updatedAgent.status === 'active' ? 'ativado' : 'desativado';
      toast.success(`Agente ${statusText} com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do agente');
    }
  });

  // ✅ HELPERS FUNCTIONS
  const createAgent = (agentData: CreateAIAgentData) => 
    createAgentMutation.mutate(agentData);

  const updateAgent = (id: string, updates: Partial<AIAgent>) => 
    updateAgentMutation.mutate({ id, updates });

  const deleteAgent = (agentId: string) => 
    deleteAgentMutation.mutate(agentId);

  const toggleAgentStatus = (id: string, status: 'active' | 'inactive') => 
    toggleStatusMutation.mutate({ id, status });

  return {
    // ✅ Data
    agents,
    isLoading,
    error,
    
    // ✅ Actions
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
    refetch,
    
    // ✅ Loading states específicos
    isCreating: createAgentMutation.isPending,
    isUpdating: updateAgentMutation.isPending,
    isDeleting: deleteAgentMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    
    // ✅ Query client para invalidações manuais
    queryClient
  };
};