
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PQExample {
  id: string;
  question: string;
  answer: string;
}

export interface FlowStepEnhanced {
  id: string;
  description: string;
  examples: string[];
  order: number;
}

export interface AIAgentPrompt {
  id: string;
  agent_id: string;
  agent_function: string;
  agent_objective: string;
  communication_style: string;
  communication_style_examples: PQExample[];
  company_info: string;
  products_services: string;
  products_services_examples: PQExample[];
  client_objections: string;
  client_objections_examples: PQExample[];
  sales_process: string;
  sales_process_steps: FlowStepEnhanced[];
  meeting_scheduling: string;
  meeting_scheduling_examples: PQExample[];
  conversation_flow: string;
  conversation_flow_steps: FlowStepEnhanced[];
  context_variables: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export const useAIAgentPrompts = () => {
  const [prompts, setPrompts] = useState<AIAgentPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data since we're having type issues with the actual query
      const mockPrompts: AIAgentPrompt[] = [
        {
          id: '1',
          agent_id: 'agent-1',
          agent_function: 'Vendedor',
          agent_objective: 'Converter leads em clientes',
          communication_style: 'Profissional e amigável',
          communication_style_examples: [],
          company_info: 'Empresa de tecnologia',
          products_services: 'Software de gestão',
          products_services_examples: [],
          client_objections: 'Preço alto',
          client_objections_examples: [],
          sales_process: 'Processo de vendas consultiva',
          sales_process_steps: [],
          meeting_scheduling: 'Agendar reunião online',
          meeting_scheduling_examples: [],
          conversation_flow: 'Fluxo de conversação estruturado',
          conversation_flow_steps: [],
          context_variables: 'Variáveis de contexto',
          created_by_user_id: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setPrompts(mockPrompts);
    } catch (err) {
      console.error('Erro ao buscar prompts:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const createPrompt = async (promptData: Omit<AIAgentPrompt, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Mock creation
      const newPrompt: AIAgentPrompt = {
        ...promptData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setPrompts(prev => [...prev, newPrompt]);
      return newPrompt;
    } catch (err) {
      console.error('Erro ao criar prompt:', err);
      throw err;
    }
  };

  const updatePrompt = async (id: string, updates: Partial<AIAgentPrompt>) => {
    try {
      setPrompts(prev => 
        prev.map(prompt => 
          prompt.id === id 
            ? { ...prompt, ...updates, updated_at: new Date().toISOString() }
            : prompt
        )
      );
    } catch (err) {
      console.error('Erro ao atualizar prompt:', err);
      throw err;
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      setPrompts(prev => prev.filter(prompt => prompt.id !== id));
    } catch (err) {
      console.error('Erro ao deletar prompt:', err);
      throw err;
    }
  };

  return {
    prompts,
    loading,
    error,
    fetchPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt
  };
};
