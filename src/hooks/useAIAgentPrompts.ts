
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
      console.log('🔄 [useAIAgentPrompts] Buscando dados do agente:', targetAgentId || agentId);
      
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', targetAgentId || agentId)
        .single();

      if (error) throw error;
      
      // Convert ai_agents record para formato AIAgentPrompt compatível
      const typedPrompt: AIAgentPrompt = {
        id: data.id,
        agent_id: data.id,
        agent_function: data.agent_function || '',
        agent_objective: data.agent_objective || '',
        communication_style: data.communication_style || '',
        communication_style_examples: Array.isArray(data.communication_style_examples) ? data.communication_style_examples : [],
        company_info: data.company_info || '',
        products_services: data.products_services || '',
        products_services_examples: [], // Campo não existe na tabela consolidada
        rules_guidelines: Array.isArray(data.rules_guidelines) ? data.rules_guidelines : [],
        rules_guidelines_examples: [], // Campo não existe na tabela consolidada
        prohibitions: Array.isArray(data.prohibitions) ? data.prohibitions : [],
        prohibitions_examples: [], // Campo não existe na tabela consolidada
        client_objections: Array.isArray(data.client_objections) ? data.client_objections : [],
        client_objections_examples: [], // Campo não existe na tabela consolidada
        phrase_tips: '', // Campo não existe na tabela consolidada
        phrase_tips_examples: [], // Campo não existe na tabela consolidada
        flow: Array.isArray(data.flow) ? data.flow : [],
        created_by_user_id: data.created_by_user_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      console.log('✅ [useAIAgentPrompts] Dados carregados:', typedPrompt);
      setPrompts([typedPrompt]);
    } catch (error) {
      console.error('❌ [useAIAgentPrompts] Erro ao carregar prompts:', error);
      toast.error('Erro ao carregar prompts do agente');
    } finally {
      setIsLoading(false);
    }
  };

  // CORRIGIDO: Criar/atualizar prompts diretamente na tabela ai_agents
  const createPrompt = async (data: CreateAIAgentPromptData): Promise<AIAgentPrompt | null> => {
    try {
      console.log('➕ [useAIAgentPrompts] createPrompt chamado com:', data);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      console.log('👤 [useAIAgentPrompts] Usuário autenticado:', user.user.id);

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
        products_services_examples: [],
        rules_guidelines: Array.isArray(updatedAgent.rules_guidelines) ? updatedAgent.rules_guidelines : [],
        rules_guidelines_examples: [],
        prohibitions: Array.isArray(updatedAgent.prohibitions) ? updatedAgent.prohibitions : [],
        prohibitions_examples: [],
        client_objections: Array.isArray(updatedAgent.client_objections) ? updatedAgent.client_objections : [],
        client_objections_examples: [],
        phrase_tips: '',
        phrase_tips_examples: [],
        flow: Array.isArray(updatedAgent.flow) ? updatedAgent.flow : [],
        created_by_user_id: updatedAgent.created_by_user_id,
        created_at: updatedAgent.created_at,
        updated_at: updatedAgent.updated_at
      };
      
      // Atualizar estado local
      await fetchPrompts(data.agent_id);
      return typedPrompt;
    } catch (error) {
      console.error('❌ [useAIAgentPrompts] Error creating AI agent prompt:', error);
      throw error;
    }
  };

  // CORRIGIDO: Atualizar prompts diretamente na tabela ai_agents com logs detalhados
  const updatePrompt = async (id: string, updates: Partial<AIAgentPrompt>): Promise<boolean> => {
    try {
      console.log('\n=== 🔄 [useAIAgentPrompts] UPDATE PROMPT INICIADO ===');
      console.log('🆔 Agent ID:', id);
      console.log('📝 Updates recebidos:', Object.keys(updates));
      console.log('📊 Dados completos dos updates:', updates);
      
      const formattedUpdates: any = {};
      
      // ✅ CORREÇÃO PRINCIPAL: Mapear TODOS os campos corretamente
      if (updates.agent_function !== undefined) {
        formattedUpdates.agent_function = updates.agent_function;
        console.log('📌 Mapeando agent_function:', updates.agent_function);
      }
      
      if (updates.agent_objective !== undefined) {
        formattedUpdates.agent_objective = updates.agent_objective;
        console.log('📌 Mapeando agent_objective:', updates.agent_objective);
      }
      
      if (updates.communication_style !== undefined) {
        formattedUpdates.communication_style = updates.communication_style;
        console.log('📌 Mapeando communication_style:', updates.communication_style);
      }
      
      if (updates.communication_style_examples !== undefined) {
        const examples = Array.isArray(updates.communication_style_examples) ? updates.communication_style_examples : [];
        formattedUpdates.communication_style_examples = examples;
        console.log('📌 Mapeando communication_style_examples:', examples.length, 'itens');
      }
      
      if (updates.company_info !== undefined) {
        formattedUpdates.company_info = updates.company_info;
        console.log('📌 Mapeando company_info:', updates.company_info);
      }
      
      if (updates.products_services !== undefined) {
        formattedUpdates.products_services = updates.products_services;
        console.log('📌 Mapeando products_services:', updates.products_services);
      }
      
      // ✅ CORREÇÃO: Mapear arrays JSONB corretamente
      if (updates.rules_guidelines !== undefined) {
        const rules = Array.isArray(updates.rules_guidelines) ? updates.rules_guidelines : [];
        formattedUpdates.rules_guidelines = rules;
        console.log('📌 Mapeando rules_guidelines:', rules.length, 'itens');
      }
      
      if (updates.prohibitions !== undefined) {
        const prohibitions = Array.isArray(updates.prohibitions) ? updates.prohibitions : [];
        formattedUpdates.prohibitions = prohibitions;
        console.log('📌 Mapeando prohibitions:', prohibitions.length, 'itens');
      }
      
      if (updates.client_objections !== undefined) {
        const objections = Array.isArray(updates.client_objections) ? updates.client_objections : [];
        formattedUpdates.client_objections = objections;
        console.log('📌 Mapeando client_objections:', objections.length, 'itens');
      }
      
      if (updates.flow !== undefined) {
        const flow = Array.isArray(updates.flow) ? updates.flow : [];
        formattedUpdates.flow = flow;
        console.log('📌 Mapeando flow:', flow.length, 'itens');
      }
      
      // Adicionar updated_at
      formattedUpdates.updated_at = new Date().toISOString();
      
      console.log('💾 [useAIAgentPrompts] Dados finais para Supabase:', formattedUpdates);

      // ✅ CORREÇÃO: Usar o ID correto e aguardar resposta
      const { data, error } = await supabase
        .from('ai_agents')
        .update(formattedUpdates)
        .eq('id', id)
        .select();

      console.log('📊 [useAIAgentPrompts] Resposta do Supabase:');
      console.log('  - Data:', data ? `${data.length} registro(s) atualizado(s)` : 'null');
      console.log('  - Error:', error || 'nenhum erro');

      if (error) {
        console.error('❌ [useAIAgentPrompts] Erro do Supabase:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('❌ [useAIAgentPrompts] Nenhum registro foi atualizado');
        throw new Error('Nenhum registro foi atualizado - verifique se o ID do agente está correto');
      }
      
      console.log('✅ [useAIAgentPrompts] UPDATE CONCLUÍDO COM SUCESSO!');
      
      // ✅ CORREÇÃO: Refrescar dados após salvamento para garantir sincronização
      await fetchPrompts(id);
      
      console.log('=== FIM UPDATE PROMPT ===\n');
      return true;
    } catch (error) {
      console.error('❌ [useAIAgentPrompts] Error updating AI agent prompt:', error);
      toast.error('Erro ao salvar alterações', {
        description: 'Tente novamente em alguns segundos'
      });
      throw error;
    }
  };

  // ATUALIZADO: Buscar prompts diretamente da tabela ai_agents
  const getPromptByAgentId = async (targetAgentId: string): Promise<AIAgentPrompt | null> => {
    try {
      console.log('\n=== 🔍 [useAIAgentPrompts] GET PROMPT BY AGENT ID ===');
      console.log('🆔 Buscando dados do agente ID:', targetAgentId);
      
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', targetAgentId)
        .maybeSingle();

      console.log('📊 [useAIAgentPrompts] Resposta da busca:', { data: data ? 'ENCONTRADO' : 'NÃO ENCONTRADO', error: error || 'NENHUM' });
      
      if (error) {
        console.error('❌ [useAIAgentPrompts] Erro ao buscar agente:', error);
        throw error;
      }
      
      if (!data) {
        console.log('⚠️ [useAIAgentPrompts] Agente não encontrado');
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
        products_services_examples: [],
        rules_guidelines: Array.isArray(data.rules_guidelines) ? data.rules_guidelines : [],
        rules_guidelines_examples: [],
        prohibitions: Array.isArray(data.prohibitions) ? data.prohibitions : [],
        prohibitions_examples: [],
        client_objections: Array.isArray(data.client_objections) ? data.client_objections : [],
        client_objections_examples: [],
        phrase_tips: '',
        phrase_tips_examples: [],
        flow: Array.isArray(data.flow) ? data.flow : [],
        created_by_user_id: data.created_by_user_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      console.log('✅ [useAIAgentPrompts] Dados do agente convertidos com sucesso');
      console.log('=== FIM GET PROMPT (COM SUCESSO) ===\n');
      return typedPrompt;
    } catch (error) {
      console.error('❌ [useAIAgentPrompts] ERRO AO BUSCAR DADOS DO AGENTE:', error);
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
