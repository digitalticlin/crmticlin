
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AIAgentPrompt, CreateAIAgentPromptData } from '@/types/aiAgent';
import { toast } from 'sonner';

export const useAIAgentPrompts = (agentId?: string) => {
  const [prompts, setPrompts] = useState<AIAgentPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrompts = async (targetAgentId?: string) => {
    if (!targetAgentId && !agentId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_agent_prompts')
        .select('*')
        .eq('agent_id', targetAgentId || agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching AI agent prompts:', error);
      toast.error('Erro ao carregar prompts do agente');
    } finally {
      setIsLoading(false);
    }
  };

  const createPrompt = async (data: CreateAIAgentPromptData): Promise<AIAgentPrompt | null> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: prompt, error } = await supabase
        .from('ai_agent_prompts')
        .insert({
          ...data,
          created_by_user_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchPrompts(data.agent_id);
      toast.success('Prompt criado com sucesso');
      return prompt;
    } catch (error) {
      console.error('Error creating AI agent prompt:', error);
      toast.error('Erro ao criar prompt');
      return null;
    }
  };

  const updatePrompt = async (id: string, updates: Partial<AIAgentPrompt>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ai_agent_prompts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchPrompts();
      toast.success('Prompt atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('Error updating AI agent prompt:', error);
      toast.error('Erro ao atualizar prompt');
      return false;
    }
  };

  const getPromptByAgentId = async (targetAgentId: string): Promise<AIAgentPrompt | null> => {
    try {
      const { data, error } = await supabase
        .from('ai_agent_prompts')
        .select('*')
        .eq('agent_id', targetAgentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching prompt by agent ID:', error);
      return null;
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchPrompts();
    }
  }, [agentId]);

  return {
    prompts,
    isLoading,
    createPrompt,
    updatePrompt,
    getPromptByAgentId,
    refetch: fetchPrompts
  };
};
