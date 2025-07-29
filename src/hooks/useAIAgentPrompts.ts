
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
      
      // Convert database records to typed AIAgentPrompt objects
      const typedPrompts: AIAgentPrompt[] = (data || []).map(prompt => ({
        ...prompt,
        objectives: Array.isArray(prompt.objectives) ? prompt.objectives as string[] : []
      }));
      
      setPrompts(typedPrompts);
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

      // Ensure objectives is properly formatted
      const formattedData = {
        ...data,
        objectives: Array.isArray(data.objectives) ? data.objectives : []
      };

      const { data: prompt, error } = await supabase
        .from('ai_agent_prompts')
        .insert({
          ...formattedData,
          created_by_user_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Convert database record to typed AIAgentPrompt object
      const typedPrompt: AIAgentPrompt = {
        ...prompt,
        objectives: Array.isArray(prompt.objectives) ? prompt.objectives as string[] : []
      };
      
      // Update local state
      await fetchPrompts(data.agent_id);
      return typedPrompt;
    } catch (error) {
      console.error('Error creating AI agent prompt:', error);
      throw error;
    }
  };

  const updatePrompt = async (id: string, updates: Partial<AIAgentPrompt>): Promise<boolean> => {
    try {
      // Ensure objectives is properly formatted
      const formattedUpdates = {
        ...updates,
        objectives: Array.isArray(updates.objectives) ? updates.objectives : []
      };

      const { error } = await supabase
        .from('ai_agent_prompts')
        .update(formattedUpdates)
        .eq('id', id);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating AI agent prompt:', error);
      throw error;
    }
  };

  const getPromptByAgentId = async (targetAgentId: string): Promise<AIAgentPrompt | null> => {
    try {
      const { data, error } = await supabase
        .from('ai_agent_prompts')
        .select('*')
        .eq('agent_id', targetAgentId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      // Convert database record to typed AIAgentPrompt object with proper array handling
      const typedPrompt: AIAgentPrompt = {
        ...data,
        objectives: Array.isArray(data.objectives) ? data.objectives as string[] : []
      };
      
      return typedPrompt;
    } catch (error) {
      console.error('Error fetching prompt by agent ID:', error);
      return null;
    }
  };

  // Enhanced refetch function
  const refetch = async (targetAgentId?: string) => {
    await fetchPrompts(targetAgentId);
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
    refetch
  };
};
