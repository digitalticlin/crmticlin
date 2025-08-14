
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PQExample } from "@/types/aiAgent";

export interface AIAgentPrompt {
  id?: string;
  created_by_user_id?: string;
  created_at?: string;
  updated_at?: string;
  agent_id: string;
  agent_function: string;
  agent_objective: string;
  communication_style: string;
  communication_style_examples: PQExample[];
  company_info: string;
  products_services: string;
  products_services_examples: PQExample[];
  rules_guidelines: string;
  rules_guidelines_examples: PQExample[];
  prohibitions: string;
  prohibitions_examples: PQExample[];
  client_objections: string;
  client_objections_examples: PQExample[];
  phrase_tips: string;
  phrase_tips_examples: PQExample[];
  flow: any[];
}

export const useAIAgentPrompts = () => {
  const { user } = useAuth();

  const {
    data: prompts = [],
    error,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['ai-agent-prompts', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('[useAIAgentPrompts] 🔍 Buscando prompts para usuário:', user.id);

      const { data, error } = await supabase
        .from('ai_agent_prompts')
        .select('*')
        .eq('created_by_user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[useAIAgentPrompts] ❌ Erro ao buscar prompts:', error);
        throw error;
      }

      console.log('[useAIAgentPrompts] ✅ Prompts encontrados:', data?.length || 0);
      
      // Convert examples from Json to PQExample[] format
      const convertedData = data?.map(prompt => ({
        ...prompt,
        communication_style_examples: Array.isArray(prompt.communication_style_examples) 
          ? (prompt.communication_style_examples as any[]).map((ex, idx) => ({
              id: `comm_${idx}`,
              question: typeof ex === 'object' ? ex.user || ex.question || '' : '',
              answer: typeof ex === 'object' ? ex.agent || ex.answer || '' : ''
            }))
          : [],
        products_services_examples: Array.isArray(prompt.products_services_examples) 
          ? (prompt.products_services_examples as any[]).map((ex, idx) => ({
              id: `prod_${idx}`,
              question: typeof ex === 'object' ? ex.user || ex.question || '' : '',
              answer: typeof ex === 'object' ? ex.agent || ex.answer || '' : ''
            }))
          : [],
        rules_guidelines_examples: Array.isArray(prompt.rules_guidelines_examples) 
          ? (prompt.rules_guidelines_examples as any[]).map((ex, idx) => ({
              id: `rule_${idx}`,
              question: typeof ex === 'object' ? ex.user || ex.question || '' : '',
              answer: typeof ex === 'object' ? ex.agent || ex.answer || '' : ''
            }))
          : [],
        prohibitions_examples: Array.isArray(prompt.prohibitions_examples) 
          ? (prompt.prohibitions_examples as any[]).map((ex, idx) => ({
              id: `prob_${idx}`,
              question: typeof ex === 'object' ? ex.user || ex.question || '' : '',
              answer: typeof ex === 'object' ? ex.agent || ex.answer || '' : ''
            }))
          : [],
        client_objections_examples: Array.isArray(prompt.client_objections_examples) 
          ? (prompt.client_objections_examples as any[]).map((ex, idx) => ({
              id: `obj_${idx}`,
              question: typeof ex === 'object' ? ex.user || ex.question || '' : '',
              answer: typeof ex === 'object' ? ex.agent || ex.answer || '' : ''
            }))
          : [],
        phrase_tips_examples: Array.isArray(prompt.phrase_tips_examples) 
          ? (prompt.phrase_tips_examples as any[]).map((ex, idx) => ({
              id: `tip_${idx}`,
              question: typeof ex === 'object' ? ex.user || ex.question || '' : '',
              answer: typeof ex === 'object' ? ex.agent || ex.answer || '' : ''
            }))
          : [],
        flow: Array.isArray(prompt.flow) ? prompt.flow : []
      })) || [];

      return convertedData as AIAgentPrompt[];
    },
    enabled: !!user?.id,
  });

  const getPromptByAgentId = async (agentId: string): Promise<AIAgentPrompt | null> => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('ai_agent_prompts')
      .select('*')
      .eq('agent_id', agentId)
      .eq('created_by_user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[useAIAgentPrompts] ❌ Erro ao buscar prompt por agent_id:', error);
      throw error;
    }

    return {
      ...data,
      communication_style_examples: Array.isArray(data.communication_style_examples) 
        ? (data.communication_style_examples as any[]).map((ex, idx) => ({
            id: `comm_${idx}`,
            question: typeof ex === 'object' ? ex.user || ex.question || '' : '',
            answer: typeof ex === 'object' ? ex.agent || ex.answer || '' : ''
          }))
        : [],
      products_services_examples: Array.isArray(data.products_services_examples) 
        ? (data.products_services_examples as any[]).map((ex, idx) => ({
            id: `prod_${idx}`,
            question: typeof ex === 'object' ? ex.user || ex.question || '' : '',
            answer: typeof ex === 'object' ? ex.agent || ex.answer || '' : ''
          }))
        : [],
      rules_guidelines_examples: Array.isArray(data.rules_guidelines_examples) 
        ? (data.rules_guidelines_examples as any[]).map((ex, idx) => ({
            id: `rule_${idx}`,
            question: typeof ex === 'object' ? ex.user || ex.question || '' : '',
            answer: typeof ex === 'object' ? ex.agent || ex.answer || '' : ''
          }))
        : [],
      prohibitions_examples: Array.isArray(data.prohibitions_examples) 
        ? (data.prohibitions_examples as any[]).map((ex, idx) => ({
            id: `prob_${idx}`,
            question: typeof ex === 'object' ? ex.user || ex.question || '' : '',
            answer: typeof ex === 'object' ? ex.agent || ex.answer || '' : ''
          }))
        : [],
      client_objections_examples: Array.isArray(data.client_objections_examples) 
        ? (data.client_objections_examples as any[]).map((ex, idx) => ({
            id: `obj_${idx}`,
            question: typeof ex === 'object' ? ex.user || ex.question || '' : '',
            answer: typeof ex === 'object' ? ex.agent || ex.answer || '' : ''
          }))
        : [],
      phrase_tips_examples: Array.isArray(data.phrase_tips_examples) 
        ? (data.phrase_tips_examples as any[]).map((ex, idx) => ({
            id: `tip_${idx}`,
            question: typeof ex === 'object' ? ex.user || ex.question || '' : '',
            answer: typeof ex === 'object' ? ex.agent || ex.answer || '' : ''
          }))
        : [],
      flow: Array.isArray(data.flow) ? data.flow : []
    } as AIAgentPrompt;
  };

  const createPromptMutation = useMutation({
    mutationFn: async (promptData: Omit<AIAgentPrompt, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('[useAIAgentPrompts] ➕ Criando novo prompt:', promptData.agent_function);

      // Convert PQExample[] back to database format
      const dataForDatabase = {
        ...promptData,
        communication_style_examples: promptData.communication_style_examples.map(ex => ({
          user: ex.question,
          agent: ex.answer
        })),
        products_services_examples: promptData.products_services_examples.map(ex => ({
          user: ex.question,
          agent: ex.answer
        })),
        rules_guidelines_examples: promptData.rules_guidelines_examples.map(ex => ({
          user: ex.question,
          agent: ex.answer
        })),
        prohibitions_examples: promptData.prohibitions_examples.map(ex => ({
          user: ex.question,
          agent: ex.answer
        })),
        client_objections_examples: promptData.client_objections_examples.map(ex => ({
          user: ex.question,
          agent: ex.answer
        })),
        phrase_tips_examples: promptData.phrase_tips_examples.map(ex => ({
          user: ex.question,
          agent: ex.answer
        })),
        created_by_user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('ai_agent_prompts')
        .insert(dataForDatabase)
        .select()
        .single();

      if (error) {
        console.error('[useAIAgentPrompts] ❌ Erro ao criar prompt:', error);
        throw error;
      }

      console.log('[useAIAgentPrompts] ✅ Prompt criado:', data.id);
      return data;
    },
    onSuccess: () => {
      refetch();
      toast.success('Prompt criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('[useAIAgentPrompts] ❌ Erro na mutação de criar:', error);
      toast.error('Erro ao criar prompt: ' + error.message);
    },
  });

  const updatePromptMutation = useMutation({
    mutationFn: async ({ id, ...promptData }: Partial<AIAgentPrompt> & { id: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('[useAIAgentPrompts] 🔄 Atualizando prompt:', id);

      // Convert PQExample[] back to database format for fields that exist
      const dataForDatabase: any = {
        ...promptData,
        updated_at: new Date().toISOString()
      };

      if (promptData.communication_style_examples) {
        dataForDatabase.communication_style_examples = promptData.communication_style_examples.map(ex => ({
          user: ex.question,
          agent: ex.answer
        }));
      }

      if (promptData.products_services_examples) {
        dataForDatabase.products_services_examples = promptData.products_services_examples.map(ex => ({
          user: ex.question,
          agent: ex.answer
        }));
      }

      if (promptData.rules_guidelines_examples) {
        dataForDatabase.rules_guidelines_examples = promptData.rules_guidelines_examples.map(ex => ({
          user: ex.question,
          agent: ex.answer
        }));
      }

      if (promptData.prohibitions_examples) {
        dataForDatabase.prohibitions_examples = promptData.prohibitions_examples.map(ex => ({
          user: ex.question,
          agent: ex.answer
        }));
      }

      if (promptData.client_objections_examples) {
        dataForDatabase.client_objections_examples = promptData.client_objections_examples.map(ex => ({
          user: ex.question,
          agent: ex.answer
        }));
      }

      if (promptData.phrase_tips_examples) {
        dataForDatabase.phrase_tips_examples = promptData.phrase_tips_examples.map(ex => ({
          user: ex.question,
          agent: ex.answer
        }));
      }

      const { data, error } = await supabase
        .from('ai_agent_prompts')
        .update(dataForDatabase)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useAIAgentPrompts] ❌ Erro ao atualizar prompt:', error);
        throw error;
      }

      console.log('[useAIAgentPrompts] ✅ Prompt atualizado:', data.id);
      return data;
    },
    onSuccess: () => {
      refetch();
      toast.success('Prompt atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('[useAIAgentPrompts] ❌ Erro na mutação de atualizar:', error);
      toast.error('Erro ao atualizar prompt: ' + error.message);
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('[useAIAgentPrompts] 🗑️ Deletando prompt:', id);

      const { data, error } = await supabase
        .from('ai_agent_prompts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useAIAgentPrompts] ❌ Erro ao deletar prompt:', error);
        throw error;
      }

      console.log('[useAIAgentPrompts] ✅ Prompt deletado:', id);
      return data;
    },
    onSuccess: () => {
      refetch();
      toast.success('Prompt deletado com sucesso!');
    },
    onError: (error: any) => {
      console.error('[useAIAgentPrompts] ❌ Erro na mutação de deletar:', error);
      toast.error('Erro ao deletar prompt: ' + error.message);
    },
  });

  return {
    prompts,
    error,
    isLoading,
    refetch,
    getPromptByAgentId,
    createPrompt: createPromptMutation.mutateAsync,
    updatePrompt: updatePromptMutation.mutateAsync,
    deletePrompt: deletePromptMutation.mutateAsync,
    isCreating: createPromptMutation.isPending,
    isUpdating: updatePromptMutation.isPending,
    isDeleting: deletePromptMutation.isPending,
  };
};
