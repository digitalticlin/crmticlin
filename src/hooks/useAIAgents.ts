
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AIAgent, CreateAIAgentData } from '@/types/aiAgent';
import { toast } from 'sonner';

export const useAIAgents = () => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching AI agents:', error);
      toast.error('Erro ao carregar agentes de IA');
    } finally {
      setIsLoading(false);
    }
  };

  const createAgent = async (data: CreateAIAgentData): Promise<AIAgent | null> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: agent, error } = await supabase
        .from('ai_agents')
        .insert({
          ...data,
          created_by_user_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchAgents();
      toast.success('Agente criado com sucesso');
      return agent;
    } catch (error) {
      console.error('Error creating AI agent:', error);
      toast.error('Erro ao criar agente');
      return null;
    }
  };

  const updateAgent = async (id: string, updates: Partial<AIAgent>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchAgents();
      toast.success('Agente atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('Error updating AI agent:', error);
      toast.error('Erro ao atualizar agente');
      return false;
    }
  };

  const deleteAgent = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchAgents();
      toast.success('Agente removido com sucesso');
      return true;
    } catch (error) {
      console.error('Error deleting AI agent:', error);
      toast.error('Erro ao remover agente');
      return false;
    }
  };

  const toggleAgentStatus = async (id: string): Promise<boolean> => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return false;

    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    return await updateAgent(id, { status: newStatus });
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return {
    agents,
    isLoading,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
    refetch: fetchAgents
  };
};
