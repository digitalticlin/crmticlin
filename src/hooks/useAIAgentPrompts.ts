import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AIAgentPrompt, CreateAIAgentPromptData } from '@/types/aiAgent';
import { toast } from 'sonner';

export const useAIAgentPrompts = (agentId?: string) => {
  const [prompts, setPrompts] = useState<AIAgentPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ATUALIZADO: Buscar dados diretamente da tabela ai_agents consolidada
  const fetchPrompts = async (targetAgentId?: string) => {
    if (!targetAgentId && !agentId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', targetAgentId || agentId)
        .single();

      if (error) throw error;
      
      // Convert ai_agents record para formato AIAgentPrompt compatível
      const typedPrompt: AIAgentPrompt = {
        id: data.id, // Usando o ID do agente como ID do prompt
        agent_id: data.id,
        agent_function: data.agent_function || '',
        agent_objective: data.agent_objective || '',
        communication_style: data.communication_style || '',
        communication_style_examples: Array.isArray(data.communication_style_examples) ? data.communication_style_examples : [],
        company_info: data.company_info || '',
        products_services: data.products_services || '',
        rules_guidelines: Array.isArray(data.rules_guidelines) ? data.rules_guidelines : [],
        prohibitions: Array.isArray(data.prohibitions) ? data.prohibitions : [],
        client_objections: Array.isArray(data.client_objections) ? data.client_objections : [],
        funnel_configuration: Array.isArray(data.funnel_configuration) ? data.funnel_configuration : [],
        flow: Array.isArray(data.flow) ? data.flow : [],
        created_by_user_id: data.created_by_user_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      setPrompts([typedPrompt]); // Mantém como array para compatibilidade
    } catch (error) {
      console.error('Error fetching AI agent prompts:', error);
      toast.error('Erro ao carregar prompts do agente');
    } finally {
      setIsLoading(false);
    }
  };

  // ATUALIZADO: Criar/atualizar prompts diretamente na tabela ai_agents
  const createPrompt = async (data: CreateAIAgentPromptData): Promise<AIAgentPrompt | null> => {
    try {
      console.log('➕ createPrompt (CONSOLIDADO) chamado com:', data);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      console.log('👤 Usuário autenticado:', user.user.id);

      // Preparar dados para atualizar na tabela ai_agents (estrutura consolidada)
      const formattedData = {
        agent_function: data.agent_function || '',
        agent_objective: data.agent_objective || '',
        communication_style: data.communication_style || '',
        communication_style_examples: Array.isArray(data.communication_style_examples) ? data.communication_style_examples : [],
        company_info: data.company_info || '',
        products_services: data.products_services || '',
        rules_guidelines: Array.isArray(data.rules_guidelines) ? data.rules_guidelines : [],
        prohibitions: Array.isArray(data.prohibitions) ? data.prohibitions : [],
        client_objections: Array.isArray(data.client_objections) ? data.client_objections : [],
        funnel_configuration: Array.isArray(data.funnel_configuration) ? data.funnel_configuration : [],
        flow: Array.isArray(data.flow) ? data.flow : [],
        updated_at: new Date().toISOString()
      };

      console.log('📝 Dados formatados para ai_agents:', formattedData);

      // Atualizar o agente com os dados de prompt
      const { data: updatedAgent, error } = await supabase
        .from('ai_agents')
        .update(formattedData)
        .eq('id', data.agent_id)
        .select()
        .single();

      console.log('📊 Resposta do Supabase:', { updatedAgent, error });

      if (error) {
        console.error('❌ Erro ao atualizar agente:', error);
        throw error;
      }
      
      if (!updatedAgent) {
        console.error('❌ Agente não retornado da operação');
        throw new Error('Agente não retornado da operação');
      }
      
      // Converter registro do banco para objeto AIAgentPrompt
      const typedPrompt: AIAgentPrompt = {
        id: updatedAgent.id,
        agent_id: updatedAgent.id,
        agent_function: updatedAgent.agent_function || '',
        agent_objective: updatedAgent.agent_objective || '',
        communication_style: updatedAgent.communication_style || '',
        communication_style_examples: Array.isArray(updatedAgent.communication_style_examples) ? updatedAgent.communication_style_examples : [],
        company_info: updatedAgent.company_info || '',
        products_services: updatedAgent.products_services || '',
        rules_guidelines: Array.isArray(updatedAgent.rules_guidelines) ? updatedAgent.rules_guidelines : [],
        prohibitions: Array.isArray(updatedAgent.prohibitions) ? updatedAgent.prohibitions : [],
        client_objections: Array.isArray(updatedAgent.client_objections) ? updatedAgent.client_objections : [],
        funnel_configuration: Array.isArray(updatedAgent.funnel_configuration) ? updatedAgent.funnel_configuration : [],
        flow: Array.isArray(updatedAgent.flow) ? updatedAgent.flow : [],
        created_by_user_id: updatedAgent.created_by_user_id,
        created_at: updatedAgent.created_at,
        updated_at: updatedAgent.updated_at
      };
      
      // Atualizar estado local
      await fetchPrompts(data.agent_id);
      return typedPrompt;
    } catch (error) {
      console.error('Error creating AI agent prompt:', error);
      throw error;
    }
  };

  // ATUALIZADO: Atualizar prompts diretamente na tabela ai_agents
  const updatePrompt = async (id: string, updates: Partial<AIAgentPrompt>): Promise<boolean> => {
    try {
      console.log('\n=== UPDATE PROMPT (CONSOLIDADO) INICIADO ===');
      console.log('🔄 updatePrompt chamado para agente ID:', id);
      console.log('📝 Updates recebidos:', Object.keys(updates));
      
      const formattedUpdates: any = {};
      
      // Mapear campos do frontend para a tabela ai_agents consolidada
      if (updates.agent_function !== undefined) formattedUpdates.agent_function = updates.agent_function;
      if (updates.agent_objective !== undefined) formattedUpdates.agent_objective = updates.agent_objective;
      if (updates.communication_style !== undefined) formattedUpdates.communication_style = updates.communication_style;
      if (updates.communication_style_examples !== undefined) formattedUpdates.communication_style_examples = Array.isArray(updates.communication_style_examples) ? updates.communication_style_examples : [];
      if (updates.company_info !== undefined) formattedUpdates.company_info = updates.company_info;
      if (updates.products_services !== undefined) formattedUpdates.products_services = updates.products_services;
      if (updates.rules_guidelines !== undefined) formattedUpdates.rules_guidelines = Array.isArray(updates.rules_guidelines) ? updates.rules_guidelines : [];
      if (updates.prohibitions !== undefined) formattedUpdates.prohibitions = Array.isArray(updates.prohibitions) ? updates.prohibitions : [];
      if (updates.client_objections !== undefined) formattedUpdates.client_objections = Array.isArray(updates.client_objections) ? updates.client_objections : [];
      if (updates.funnel_configuration !== undefined) formattedUpdates.funnel_configuration = Array.isArray(updates.funnel_configuration) ? updates.funnel_configuration : [];
      if (updates.flow !== undefined) formattedUpdates.flow = Array.isArray(updates.flow) ? updates.flow : [];
      
      // Adicionar updated_at
      formattedUpdates.updated_at = new Date().toISOString();
      
      console.log('💾 Dados formatados para ai_agents:', formattedUpdates);

      // Atualizar diretamente na tabela ai_agents
      const { data, error } = await supabase
        .from('ai_agents')
        .update(formattedUpdates)
        .eq('id', id)
        .select();

      console.log('📊 Resposta do Supabase:', { data: data ? `${data.length} registro(s)` : 'nenhum', error: error || 'nenhum erro' });

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('❌ Nenhum registro atualizado');
        throw new Error('Nenhum registro foi atualizado');
      }
      
      console.log('✅ UPDATE CONCLUÍDO COM SUCESSO!');
      console.log('=== FIM UPDATE PROMPT ===\n');
      return true;
    } catch (error) {
      console.error('❌ Error updating AI agent prompt:', error);
      throw error;
    }
  };

  // ATUALIZADO: Buscar prompts diretamente da tabela ai_agents
  const getPromptByAgentId = async (targetAgentId: string): Promise<AIAgentPrompt | null> => {
    try {
      console.log('\n=== GET PROMPT BY AGENT ID (CONSOLIDADO) ===');
      console.log('🔍 Buscando dados do agente ID:', targetAgentId);
      
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', targetAgentId)
        .maybeSingle();

      console.log('📊 Resposta da busca:', { data: data ? 'SIM' : 'NÃO', error: error || 'NENHUM' });
      
      if (error) {
        console.error('❌ Erro ao buscar agente:', error);
        throw error;
      }
      
      if (!data) {
        console.log('⚠️ Agente não encontrado');
        console.log('=== FIM GET PROMPT (SEM DADOS) ===\n');
        return null;
      }
      
      // Converter registro do agente para formato AIAgentPrompt
      const typedPrompt: AIAgentPrompt = {
        id: data.id,
        agent_id: data.id,
        agent_function: data.agent_function || '',
        agent_objective: data.agent_objective || '',
        communication_style: data.communication_style || '',
        communication_style_examples: Array.isArray(data.communication_style_examples) ? data.communication_style_examples : [],
        company_info: data.company_info || '',
        products_services: data.products_services || '',
        rules_guidelines: Array.isArray(data.rules_guidelines) ? data.rules_guidelines : [],
        prohibitions: Array.isArray(data.prohibitions) ? data.prohibitions : [],
        client_objections: Array.isArray(data.client_objections) ? data.client_objections : [],
        funnel_configuration: Array.isArray(data.funnel_configuration) ? data.funnel_configuration : [],
        flow: Array.isArray(data.flow) ? data.flow : [],
        created_by_user_id: data.created_by_user_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      console.log('✅ Dados do agente convertidos com sucesso');
      console.log('=== FIM GET PROMPT (COM SUCESSO) ===\n');
      return typedPrompt;
    } catch (error) {
      console.error('❌ ERRO AO BUSCAR DADOS DO AGENTE:', error);
      console.log('=== FIM GET PROMPT (COM ERRO) ===\n');
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
