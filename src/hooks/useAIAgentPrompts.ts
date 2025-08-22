
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AIAgentPrompt, CreateAIAgentPromptData, PQExample, FlowStepEnhanced } from '@/types/aiAgent';

export const useAIAgentPrompts = () => {
  const [prompts, setPrompts] = useState<AIAgentPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('ai_agent_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform the data to match our interface
      const transformedPrompts: AIAgentPrompt[] = (data || []).map(item => ({
        id: item.id,
        agent_id: item.agent_id,
        agent_function: item.agent_function,
        agent_objective: item.agent_objective,
        communication_style: item.communication_style,
        communication_style_examples: Array.isArray(item.communication_style_examples) 
          ? item.communication_style_examples.map(ex => typeof ex === 'object' ? ex as PQExample : { id: '', question: '', answer: String(ex) })
          : [],
        company_info: item.company_info,
        products_services: item.products_services,
        products_services_examples: Array.isArray(item.products_services_examples)
          ? item.products_services_examples.map(ex => typeof ex === 'object' ? ex as PQExample : { id: '', question: '', answer: String(ex) })
          : [],
        rules_guidelines: item.rules_guidelines,
        rules_guidelines_examples: Array.isArray(item.rules_guidelines_examples)
          ? item.rules_guidelines_examples.map(ex => typeof ex === 'object' ? ex as PQExample : { id: '', question: '', answer: String(ex) })
          : [],
        prohibitions: item.prohibitions,
        prohibitions_examples: Array.isArray(item.prohibitions_examples)
          ? item.prohibitions_examples.map(ex => typeof ex === 'object' ? ex as PQExample : { id: '', question: '', answer: String(ex) })
          : [],
        client_objections: item.client_objections,
        client_objections_examples: Array.isArray(item.client_objections_examples)
          ? item.client_objections_examples.map(ex => typeof ex === 'object' ? ex as PQExample : { id: '', question: '', answer: String(ex) })
          : [],
        phrase_tips: item.phrase_tips,
        phrase_tips_examples: Array.isArray(item.phrase_tips_examples)
          ? item.phrase_tips_examples.map(ex => typeof ex === 'object' ? ex as PQExample : { id: '', question: '', answer: String(ex) })
          : [],
        flow: Array.isArray(item.flow)
          ? item.flow.map(step => typeof step === 'object' ? step as FlowStepEnhanced : { id: '', description: String(step), examples: [], order: 0 })
          : [],
        created_by_user_id: item.created_by_user_id,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setPrompts(transformedPrompts);
    } catch (err) {
      console.error('Erro ao buscar prompts:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createPrompt = async (promptData: CreateAIAgentPromptData) => {
    try {
      // Convert PQExample arrays to JSON format for database
      const dbPromptData = {
        ...promptData,
        communication_style_examples: JSON.stringify(promptData.communication_style_examples),
        products_services_examples: JSON.stringify(promptData.products_services_examples),
        rules_guidelines_examples: JSON.stringify(promptData.rules_guidelines_examples),
        prohibitions_examples: JSON.stringify(promptData.prohibitions_examples),
        client_objections_examples: JSON.stringify(promptData.client_objections_examples),
        phrase_tips_examples: JSON.stringify(promptData.phrase_tips_examples),
        flow: JSON.stringify(promptData.flow)
      };

      const { data, error: createError } = await supabase
        .from('ai_agent_prompts')
        .insert([dbPromptData])
        .select()
        .single();

      if (createError) throw createError;

      await fetchPrompts(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Erro ao criar prompt:', err);
      throw err;
    }
  };

  const updatePrompt = async (id: string, updates: Partial<CreateAIAgentPromptData>) => {
    try {
      // Convert PQExample arrays to JSON format for database
      const dbUpdates: any = { ...updates };
      if (updates.communication_style_examples) {
        dbUpdates.communication_style_examples = JSON.stringify(updates.communication_style_examples);
      }
      if (updates.products_services_examples) {
        dbUpdates.products_services_examples = JSON.stringify(updates.products_services_examples);
      }
      if (updates.rules_guidelines_examples) {
        dbUpdates.rules_guidelines_examples = JSON.stringify(updates.rules_guidelines_examples);
      }
      if (updates.prohibitions_examples) {
        dbUpdates.prohibitions_examples = JSON.stringify(updates.prohibitions_examples);
      }
      if (updates.client_objections_examples) {
        dbUpdates.client_objections_examples = JSON.stringify(updates.client_objections_examples);
      }
      if (updates.phrase_tips_examples) {
        dbUpdates.phrase_tips_examples = JSON.stringify(updates.phrase_tips_examples);
      }
      if (updates.flow) {
        dbUpdates.flow = JSON.stringify(updates.flow);
      }

      const { error: updateError } = await supabase
        .from('ai_agent_prompts')
        .update(dbUpdates)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchPrompts(); // Refresh the list
    } catch (err) {
      console.error('Erro ao atualizar prompt:', err);
      throw err;
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('ai_agent_prompts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchPrompts(); // Refresh the list
    } catch (err) {
      console.error('Erro ao deletar prompt:', err);
      throw err;
    }
  };

  const getPromptByAgentId = (agentId: string): AIAgentPrompt | null => {
    return prompts.find(prompt => prompt.agent_id === agentId) || null;
  };

  return {
    prompts,
    loading,
    error,
    fetchPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    getPromptByAgentId
  };
};
