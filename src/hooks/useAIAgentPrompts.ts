
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
        communication_style_examples: Array.isArray(prompt.communication_style_examples) ? prompt.communication_style_examples : [],
        products_services_examples: Array.isArray(prompt.products_services_examples) ? prompt.products_services_examples : [],
        rules_guidelines_examples: Array.isArray(prompt.rules_guidelines_examples) ? prompt.rules_guidelines_examples : [],
        prohibitions_examples: Array.isArray(prompt.prohibitions_examples) ? prompt.prohibitions_examples : [],
        client_objections_examples: Array.isArray(prompt.client_objections_examples) ? prompt.client_objections_examples : [],
        phrase_tips_examples: Array.isArray(prompt.phrase_tips_examples) ? prompt.phrase_tips_examples : [],
        flow: Array.isArray(prompt.flow) ? prompt.flow : []
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
      console.log('➕ createPrompt called with:', data);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      console.log('👤 User authenticated:', user.user.id);

      // Ensure all array fields are properly formatted
      const formattedData = {
        ...data,
        communication_style_examples: Array.isArray(data.communication_style_examples) ? data.communication_style_examples : [],
        products_services_examples: Array.isArray(data.products_services_examples) ? data.products_services_examples : [],
        rules_guidelines_examples: Array.isArray(data.rules_guidelines_examples) ? data.rules_guidelines_examples : [],
        prohibitions_examples: Array.isArray(data.prohibitions_examples) ? data.prohibitions_examples : [],
        client_objections_examples: Array.isArray(data.client_objections_examples) ? data.client_objections_examples : [],
        phrase_tips_examples: Array.isArray(data.phrase_tips_examples) ? data.phrase_tips_examples : [],
        flow: Array.isArray(data.flow) ? data.flow : []
      };

      console.log('📝 formattedData:', formattedData);

      const { data: prompt, error } = await supabase
        .from('ai_agent_prompts')
        .insert({
          ...formattedData,
          created_by_user_id: user.user.id
        })
        .select()
        .single();

      console.log('📊 Supabase response:', { prompt, error });

      if (error) throw error;
      
      // Convert database record to typed AIAgentPrompt object
      const typedPrompt: AIAgentPrompt = {
        ...prompt,
        communication_style_examples: Array.isArray(prompt.communication_style_examples) ? prompt.communication_style_examples : [],
        products_services_examples: Array.isArray(prompt.products_services_examples) ? prompt.products_services_examples : [],
        rules_guidelines_examples: Array.isArray(prompt.rules_guidelines_examples) ? prompt.rules_guidelines_examples : [],
        prohibitions_examples: Array.isArray(prompt.prohibitions_examples) ? prompt.prohibitions_examples : [],
        client_objections_examples: Array.isArray(prompt.client_objections_examples) ? prompt.client_objections_examples : [],
        phrase_tips_examples: Array.isArray(prompt.phrase_tips_examples) ? prompt.phrase_tips_examples : [],
        flow: Array.isArray(prompt.flow) ? prompt.flow : []
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
      console.log('🔄 updatePrompt called with:', { id, updates });
      
      // Ensure all array fields are properly formatted - remove undefined values
      const formattedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      console.log('📝 formattedUpdates:', formattedUpdates);

      const { data, error } = await supabase
        .from('ai_agent_prompts')
        .update(formattedUpdates)
        .eq('id', id)
        .select();

      console.log('📊 Supabase response:', { data, error });

      if (error) throw error;
      
      console.log('✅ updatePrompt success');
      return true;
    } catch (error) {
      console.error('❌ Error updating AI agent prompt:', error);
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
