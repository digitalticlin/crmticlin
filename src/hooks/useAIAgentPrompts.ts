import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PQExample {
  user: string;
  agent: string;
}

export interface AIAgentPrompt {
  id?: string;
  created_by_user_id?: string;
  created_at?: string;
  updated_at?: string;
  agent_name: string;
  agent_role: string;
  agent_function: string;
  communication_style: string;
  communication_style_examples: PQExample[];
  additional_instructions: string;
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
      
      // Convert communication_style_examples from Json to PQExample[]
      const convertedData = data?.map(prompt => ({
        ...prompt,
        communication_style_examples: Array.isArray(prompt.communication_style_examples) 
          ? prompt.communication_style_examples as PQExample[]
          : []
      })) || [];

      return convertedData as AIAgentPrompt[];
    },
    enabled: !!user?.id,
  });

  const createPromptMutation = useMutation({
    mutationFn: async (promptData: Omit<AIAgentPrompt, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('[useAIAgentPrompts] ➕ Criando novo prompt:', promptData.agent_function);

      // Convert PQExample[] to Json for database storage
      const dataForDatabase = {
        ...promptData,
        communication_style_examples: promptData.communication_style_examples as any,
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

      // Convert PQExample[] to Json for database storage
      const dataForDatabase = {
        ...promptData,
        communication_style_examples: promptData.communication_style_examples as any,
        updated_at: new Date().toISOString()
      };

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
    createPrompt: createPromptMutation.mutateAsync,
    updatePrompt: updatePromptMutation.mutateAsync,
    deletePrompt: deletePromptMutation.mutateAsync,
    isCreating: createPromptMutation.isPending,
    isUpdating: updatePromptMutation.isPending,
    isDeleting: deletePromptMutation.isPending,
  };
};
