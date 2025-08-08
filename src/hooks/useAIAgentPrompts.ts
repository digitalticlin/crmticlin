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
      const typedPrompts: AIAgentPrompt[] = (data || []).map(prompt => {
        // Parse objectives JSON if it exists
        let parsedObjectives: any = {};
        try {
          parsedObjectives = typeof prompt.objectives === 'string' ? JSON.parse(prompt.objectives) : prompt.objectives || {};
        } catch {
          parsedObjectives = {};
        }

        return {
          id: prompt.id,
          agent_id: prompt.agent_id,
          agent_function: prompt.agent_function,
          agent_objective: parsedObjectives.agent_objective || '',
          communication_style: prompt.communication_style || '',
          communication_style_examples: parsedObjectives.communication_style_examples || [],
          company_info: prompt.company_info || '',
          products_services: prompt.product_service_info || '',
          products_services_examples: parsedObjectives.products_services_examples || [],
          rules_guidelines: parsedObjectives.rules_guidelines || '',
          rules_guidelines_examples: parsedObjectives.rules_guidelines_examples || [],
          prohibitions: prompt.prohibitions || '',
          prohibitions_examples: parsedObjectives.prohibitions_examples || [],
          client_objections: parsedObjectives.client_objections || '',
          client_objections_examples: parsedObjectives.client_objections_examples || [],
          phrase_tips: parsedObjectives.phrase_tips || '',
          phrase_tips_examples: parsedObjectives.phrase_tips_examples || [],
          flow: parsedObjectives.flow || [],
          created_by_user_id: prompt.created_by_user_id,
          created_at: prompt.created_at,
          updated_at: prompt.updated_at
        };
      });
      
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

      // Prepare objectives data as a plain object (compatible with Json type)
      const objectivesData = {
        agent_objective: data.agent_objective || '',
        communication_style_examples: Array.isArray(data.communication_style_examples) ? data.communication_style_examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer })) : [],
        products_services_examples: Array.isArray(data.products_services_examples) ? data.products_services_examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer })) : [],
        rules_guidelines: data.rules_guidelines || '',
        rules_guidelines_examples: Array.isArray(data.rules_guidelines_examples) ? data.rules_guidelines_examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer })) : [],
        prohibitions_examples: Array.isArray(data.prohibitions_examples) ? data.prohibitions_examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer })) : [],
        client_objections: data.client_objections || '',
        client_objections_examples: Array.isArray(data.client_objections_examples) ? data.client_objections_examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer })) : [],
        phrase_tips: data.phrase_tips || '',
        phrase_tips_examples: Array.isArray(data.phrase_tips_examples) ? data.phrase_tips_examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer })) : [],
        flow: Array.isArray(data.flow) ? data.flow.map(step => ({
          id: step.id,
          description: step.description,
          examples: step.examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer })),
          order: step.order
        })) : []
      };

      const formattedData = {
        agent_id: data.agent_id,
        agent_function: data.agent_function,
        communication_style: data.communication_style || '',
        company_info: data.company_info || '',
        product_service_info: data.products_services || '',
        prohibitions: data.prohibitions || '',
        objectives: objectivesData as any, // Cast to any to satisfy Json type
        created_by_user_id: user.user.id
      };

      console.log('📝 formattedData:', formattedData);

      const { data: prompt, error } = await supabase
        .from('ai_agent_prompts')
        .insert(formattedData)
        .select()
        .single();

      console.log('📊 Supabase response:', { prompt, error });

      if (error) throw error;
      
      // Convert database record back to typed AIAgentPrompt object
      let parsedObjectives: any = {};
      try {
        parsedObjectives = typeof prompt.objectives === 'string' ? JSON.parse(prompt.objectives) : prompt.objectives || {};
      } catch {
        parsedObjectives = {};
      }

      const typedPrompt: AIAgentPrompt = {
        id: prompt.id,
        agent_id: prompt.agent_id,
        agent_function: prompt.agent_function,
        agent_objective: parsedObjectives.agent_objective || '',
        communication_style: prompt.communication_style || '',
        communication_style_examples: parsedObjectives.communication_style_examples || [],
        company_info: prompt.company_info || '',
        products_services: prompt.product_service_info || '',
        products_services_examples: parsedObjectives.products_services_examples || [],
        rules_guidelines: parsedObjectives.rules_guidelines || '',
        rules_guidelines_examples: parsedObjectives.rules_guidelines_examples || [],
        prohibitions: prompt.prohibitions || '',
        prohibitions_examples: parsedObjectives.prohibitions_examples || [],
        client_objections: parsedObjectives.client_objections || '',
        client_objections_examples: parsedObjectives.client_objections_examples || [],
        phrase_tips: parsedObjectives.phrase_tips || '',
        phrase_tips_examples: parsedObjectives.phrase_tips_examples || [],
        flow: parsedObjectives.flow || [],
        created_by_user_id: prompt.created_by_user_id,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at
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
      
      // Prepare objectives data as a plain object (compatible with Json type)
      const objectivesData: any = {};
      
      if (updates.agent_objective !== undefined) objectivesData.agent_objective = updates.agent_objective;
      if (updates.communication_style_examples !== undefined) {
        objectivesData.communication_style_examples = Array.isArray(updates.communication_style_examples) 
          ? updates.communication_style_examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer }))
          : [];
      }
      if (updates.products_services_examples !== undefined) {
        objectivesData.products_services_examples = Array.isArray(updates.products_services_examples)
          ? updates.products_services_examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer }))
          : [];
      }
      if (updates.rules_guidelines !== undefined) objectivesData.rules_guidelines = updates.rules_guidelines;
      if (updates.rules_guidelines_examples !== undefined) {
        objectivesData.rules_guidelines_examples = Array.isArray(updates.rules_guidelines_examples)
          ? updates.rules_guidelines_examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer }))
          : [];
      }
      if (updates.prohibitions_examples !== undefined) {
        objectivesData.prohibitions_examples = Array.isArray(updates.prohibitions_examples)
          ? updates.prohibitions_examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer }))
          : [];
      }
      if (updates.client_objections !== undefined) objectivesData.client_objections = updates.client_objections;
      if (updates.client_objections_examples !== undefined) {
        objectivesData.client_objections_examples = Array.isArray(updates.client_objections_examples)
          ? updates.client_objections_examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer }))
          : [];
      }
      if (updates.phrase_tips !== undefined) objectivesData.phrase_tips = updates.phrase_tips;
      if (updates.phrase_tips_examples !== undefined) {
        objectivesData.phrase_tips_examples = Array.isArray(updates.phrase_tips_examples)
          ? updates.phrase_tips_examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer }))
          : [];
      }
      if (updates.flow !== undefined) {
        objectivesData.flow = Array.isArray(updates.flow)
          ? updates.flow.map(step => ({
              id: step.id,
              description: step.description,
              examples: step.examples.map(ex => ({ id: ex.id, question: ex.question, answer: ex.answer })),
              order: step.order
            }))
          : [];
      }

      const formattedUpdates: any = {};
      
      // Map frontend fields to database fields
      if (updates.communication_style !== undefined) formattedUpdates.communication_style = updates.communication_style;
      if (updates.company_info !== undefined) formattedUpdates.company_info = updates.company_info;
      if (updates.products_services !== undefined) formattedUpdates.product_service_info = updates.products_services;
      if (updates.prohibitions !== undefined) formattedUpdates.prohibitions = updates.prohibitions;
      if (updates.agent_function !== undefined) formattedUpdates.agent_function = updates.agent_function;
      
      // Only update objectives if there are changes
      if (Object.keys(objectivesData).length > 0) {
        formattedUpdates.objectives = objectivesData;
      }

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
      
      // Convert database record to typed AIAgentPrompt object
      let parsedObjectives: any = {};
      try {
        parsedObjectives = typeof data.objectives === 'string' ? JSON.parse(data.objectives) : data.objectives || {};
      } catch {
        parsedObjectives = {};
      }

      const typedPrompt: AIAgentPrompt = {
        id: data.id,
        agent_id: data.agent_id,
        agent_function: data.agent_function,
        agent_objective: parsedObjectives.agent_objective || '',
        communication_style: data.communication_style || '',
        communication_style_examples: parsedObjectives.communication_style_examples || [],
        company_info: data.company_info || '',
        products_services: data.product_service_info || '',
        products_services_examples: parsedObjectives.products_services_examples || [],
        rules_guidelines: parsedObjectives.rules_guidelines || '',
        rules_guidelines_examples: parsedObjectives.rules_guidelines_examples || [],
        prohibitions: data.prohibitions || '',
        prohibitions_examples: parsedObjectives.prohibitions_examples || [],
        client_objections: parsedObjectives.client_objections || '',
        client_objections_examples: parsedObjectives.client_objections_examples || [],
        phrase_tips: parsedObjectives.phrase_tips || '',
        phrase_tips_examples: parsedObjectives.phrase_tips_examples || [],
        flow: parsedObjectives.flow || [],
        created_by_user_id: data.created_by_user_id,
        created_at: data.created_at,
        updated_at: data.updated_at
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
