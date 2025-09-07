import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AIAgent, AIAgentPrompt, CreateAIAgentPromptData, PQExample, FlowStepEnhanced, FunnelStageConfig } from '@/types/aiAgent';

export function useAIAgentPrompts() {
  const [isLoading, setIsLoading] = useState(false);

  const createPromptFromAgent = async (agent: AIAgent): Promise<AIAgentPrompt> => {
    try {
      console.log('🎯 [useAIAgentPrompts] Criando prompt a partir do agente:', agent);

      // ✅ PRIMEIRO: Buscar dados existentes do agent na tabela ai_agents
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agent.id)
        .single();

      if (error) {
        console.error('❌ [useAIAgentPrompts] Erro ao buscar dados do agente:', error);
        throw error;
      }

      console.log('📊 [useAIAgentPrompts] Dados do agente encontrados:', data);

      // ✅ SEGUNDO: Criar estrutura AIAgentPrompt com dados existentes
      const promptData: AIAgentPrompt = {
        id: agent.id,
        agent_id: agent.id,
        agent_function: (data.agent_function as string) || '',
        agent_objective: (data.agent_objective as string) || '',
        communication_style: (data.communication_style as string) || '',
        communication_style_examples: Array.isArray(data.communication_style_examples) ? (data.communication_style_examples as unknown) as PQExample[] : [],
        company_info: (data.company_info as string) || '',
        products_services: (data.products_services as string) || '',
        products_services_examples: [],
        rules_guidelines: Array.isArray(data.rules_guidelines) ? data.rules_guidelines as (string[] | PQExample[]) : [],
        rules_guidelines_examples: [],
        prohibitions: Array.isArray(data.prohibitions) ? data.prohibitions as (string[] | PQExample[]) : [],
        prohibitions_examples: [],
        client_objections: Array.isArray(data.client_objections) ? data.client_objections as (string[] | PQExample[]) : [],
        client_objections_examples: [],
        phrase_tips: '',
        phrase_tips_examples: [],
        flow: Array.isArray(data.flow) ? (data.flow as unknown) as FlowStepEnhanced[] : [],
        created_by_user_id: data.created_by_user_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      console.log('✅ [useAIAgentPrompts] Prompt criado com sucesso:', promptData);
      return promptData;

    } catch (error) {
      console.error('❌ [useAIAgentPrompts] Erro ao criar prompt:', error);
      throw error;
    }
  };

  const updateAIAgentPrompt = async (data: Partial<CreateAIAgentPromptData>): Promise<AIAgent> => {
    try {
      console.log('💾 [useAIAgentPrompts] Iniciando atualização do agente:', data);
      setIsLoading(true);

      if (!data.agent_id) {
        throw new Error('ID do agente é obrigatório para atualização');
      }

      // ✅ Preparar dados para ai_agents (cast explícito para Json)
      const formattedData = {
        agent_function: data.agent_function || '',
        agent_objective: data.agent_objective || '',
        communication_style: data.communication_style || '',
        communication_style_examples: data.communication_style_examples as any || [],
        company_info: data.company_info || '',
        products_services: data.products_services || '',
        rules_guidelines: data.rules_guidelines as any || [],
        prohibitions: data.prohibitions as any || [],
        client_objections: data.client_objections as any || [],
        flow: data.flow as any || [],
        funnel_configuration: data.funnel_configuration as any || [],
        updated_at: new Date().toISOString()
      };

      console.log('📝 [useAIAgentPrompts] Dados formatados para ai_agents:', formattedData);

      // Atualizar o agente com os dados de prompt
      const { data: updatedAgent, error } = await supabase
        .from('ai_agents')
        .update(formattedData)
        .eq('id', data.agent_id)
        .select()
        .single();

      console.log('📊 [useAIAgentPrompts] Resposta do Supabase:', { updatedAgent, error });

      if (error) {
        console.error('❌ [useAIAgentPrompts] Erro ao atualizar agente:', error);
        throw error;
      }
      
      if (!updatedAgent) {
        console.error('❌ [useAIAgentPrompts] Agente não retornado da operação');
        throw new Error('Agente não retornado da operação');
      }

      console.log('✅ [useAIAgentPrompts] Agente atualizado com sucesso:', updatedAgent);
      
      // Converter dados do Supabase para o tipo AIAgent esperado
      const convertedAgent: AIAgent = {
        id: updatedAgent.id,
        name: updatedAgent.name,
        type: updatedAgent.type as 'attendance' | 'sales' | 'support' | 'custom',
        status: updatedAgent.status as 'active' | 'inactive',
        funnel_id: updatedAgent.funnel_id,
        whatsapp_number_id: updatedAgent.whatsapp_number_id,
        messages_count: updatedAgent.messages_count,
        created_by_user_id: updatedAgent.created_by_user_id,
        created_at: updatedAgent.created_at,
        updated_at: updatedAgent.updated_at
      };

      return convertedAgent;

    } catch (error) {
      console.error('❌ [useAIAgentPrompts] Erro no updateAIAgentPrompt:', error);
      toast.error('Erro ao atualizar configuração do agente');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getAIAgentPrompt = async (agentId: string): Promise<AIAgentPrompt | null> => {
    try {
      console.log('🔍 [useAIAgentPrompts] Buscando prompt do agente:', agentId);

      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('❌ [useAIAgentPrompts] Erro ao buscar prompt:', error);
        return null;
      }

      if (!data) {
        console.log('⚠️ [useAIAgentPrompts] Nenhum prompt encontrado para o agente');
        return null;
      }

      console.log('📊 [useAIAgentPrompts] Dados do agente encontrados:', data);

      const promptData: AIAgentPrompt = {
        id: data.id,
        agent_id: data.id,
        agent_function: (data.agent_function as string) || '',
        agent_objective: (data.agent_objective as string) || '',
        communication_style: (data.communication_style as string) || '',
        communication_style_examples: Array.isArray(data.communication_style_examples) ? (data.communication_style_examples as unknown) as PQExample[] : [],
        company_info: (data.company_info as string) || '',
        products_services: (data.products_services as string) || '',
        products_services_examples: [],
        rules_guidelines: Array.isArray(data.rules_guidelines) ? data.rules_guidelines as (string[] | PQExample[]) : [],
        rules_guidelines_examples: [],
        prohibitions: Array.isArray(data.prohibitions) ? data.prohibitions as (string[] | PQExample[]) : [],
        prohibitions_examples: [],
        client_objections: Array.isArray(data.client_objections) ? data.client_objections as (string[] | PQExample[]) : [],
        client_objections_examples: [],
        phrase_tips: '',
        phrase_tips_examples: [],
        flow: Array.isArray(data.flow) ? (data.flow as unknown) as FlowStepEnhanced[] : [],
        created_by_user_id: data.created_by_user_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      console.log('✅ [useAIAgentPrompts] Prompt encontrado:', promptData);
      return promptData;

    } catch (error) {
      console.error('❌ [useAIAgentPrompts] Erro ao buscar prompt:', error);
      return null;
    }
  };

  // ✅ NOVA: Função para salvar configuração de funil
  const saveFunnelConfiguration = async (agentId: string, funnelConfig: FunnelStageConfig[]): Promise<void> => {
    try {
      console.log('🎯 [useAIAgentPrompts] Salvando configuração do funil:', { agentId, funnelConfig });

      const { error } = await supabase
        .from('ai_agents')
        .update({
          funnel_configuration: funnelConfig as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId);

      if (error) {
        console.error('❌ [useAIAgentPrompts] Erro ao salvar configuração do funil:', error);
        throw error;
      }

      console.log('✅ [useAIAgentPrompts] Configuração do funil salva com sucesso');
      toast.success('Configuração do funil salva com sucesso');

    } catch (error) {
      console.error('❌ [useAIAgentPrompts] Erro ao salvar configuração do funil:', error);
      toast.error('Erro ao salvar configuração do funil');
      throw error;
    }
  };

  const getFunnelConfiguration = async (agentId: string): Promise<FunnelStageConfig[]> => {
    try {
      console.log('🔍 [useAIAgentPrompts] Buscando configuração do funil para agente:', agentId);

      const { data, error } = await supabase
        .from('ai_agents')
        .select('funnel_configuration')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('❌ [useAIAgentPrompts] Erro ao buscar configuração do funil:', error);
        return [];
      }

      const config = Array.isArray(data.funnel_configuration) ? 
        (data.funnel_configuration as unknown) as FunnelStageConfig[] : [];

      console.log('✅ [useAIAgentPrompts] Configuração do funil encontrada:', config);
      return config;

    } catch (error) {
      console.error('❌ [useAIAgentPrompts] Erro ao buscar configuração do funil:', error);
      return [];
    }
  };

  return {
    createPromptFromAgent,
    updateAIAgentPrompt,
    getAIAgentPrompt,
    saveFunnelConfiguration,
    getFunnelConfiguration,
    isLoading
  };
}