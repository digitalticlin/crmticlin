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
        return {
          id: prompt.id,
          agent_id: prompt.agent_id,
          agent_function: prompt.agent_function,
          agent_objective: prompt.agent_objective || '',
          communication_style: prompt.communication_style || '',
          communication_style_examples: Array.isArray(prompt.communication_style_examples) ? prompt.communication_style_examples : [],
          company_info: prompt.company_info || '',
          products_services: prompt.products_services || '',
          products_services_examples: Array.isArray(prompt.products_services_examples) ? prompt.products_services_examples : [],
          rules_guidelines: prompt.rules_guidelines || '',
          rules_guidelines_examples: Array.isArray(prompt.rules_guidelines_examples) ? prompt.rules_guidelines_examples : [],
          prohibitions: prompt.prohibitions || '',
          prohibitions_examples: Array.isArray(prompt.prohibitions_examples) ? prompt.prohibitions_examples : [],
          client_objections: prompt.client_objections || '',
          client_objections_examples: Array.isArray(prompt.client_objections_examples) ? prompt.client_objections_examples : [],
          phrase_tips: prompt.phrase_tips || '',
          phrase_tips_examples: Array.isArray(prompt.phrase_tips_examples) ? prompt.phrase_tips_examples : [],
          flow: Array.isArray(prompt.flow) ? prompt.flow : [],
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
      console.log('🔐 User details:', { email: user.user.email, role: user.user.role });


      const formattedData = {
        agent_id: data.agent_id,
        agent_function: data.agent_function,
        agent_objective: data.agent_objective || '',
        communication_style: data.communication_style || '',
        communication_style_examples: Array.isArray(data.communication_style_examples) ? data.communication_style_examples : [],
        company_info: data.company_info || '',
        products_services: data.products_services || '',
        products_services_examples: Array.isArray(data.products_services_examples) ? data.products_services_examples : [],
        rules_guidelines: data.rules_guidelines || '',
        rules_guidelines_examples: Array.isArray(data.rules_guidelines_examples) ? data.rules_guidelines_examples : [],
        prohibitions: data.prohibitions || '',
        prohibitions_examples: Array.isArray(data.prohibitions_examples) ? data.prohibitions_examples : [],
        client_objections: data.client_objections || '',
        client_objections_examples: Array.isArray(data.client_objections_examples) ? data.client_objections_examples : [],
        phrase_tips: data.phrase_tips || '',
        phrase_tips_examples: Array.isArray(data.phrase_tips_examples) ? data.phrase_tips_examples : [],
        flow: Array.isArray(data.flow) ? data.flow : [],
        created_by_user_id: user.user.id
      };

      console.log('📝 formattedData:', formattedData);

      const { data: prompt, error } = await supabase
        .from('ai_agent_prompts')
        .insert(formattedData)
        .select()
        .single();

      console.log('📊 Supabase response:', { prompt, error });

      if (error) {
        console.error('❌ Supabase create error:', error);
        throw error;
      }
      
      if (!prompt) {
        console.error('❌ No prompt returned from create operation');
        throw new Error('No prompt returned from create operation');
      }
      
      // Convert database record back to typed AIAgentPrompt object
      const typedPrompt: AIAgentPrompt = {
        id: prompt.id,
        agent_id: prompt.agent_id,
        agent_function: prompt.agent_function,
        agent_objective: prompt.agent_objective || '',
        communication_style: prompt.communication_style || '',
        communication_style_examples: Array.isArray(prompt.communication_style_examples) ? prompt.communication_style_examples : [],
        company_info: prompt.company_info || '',
        products_services: prompt.products_services || '',
        products_services_examples: Array.isArray(prompt.products_services_examples) ? prompt.products_services_examples : [],
        rules_guidelines: prompt.rules_guidelines || '',
        rules_guidelines_examples: Array.isArray(prompt.rules_guidelines_examples) ? prompt.rules_guidelines_examples : [],
        prohibitions: prompt.prohibitions || '',
        prohibitions_examples: Array.isArray(prompt.prohibitions_examples) ? prompt.prohibitions_examples : [],
        client_objections: prompt.client_objections || '',
        client_objections_examples: Array.isArray(prompt.client_objections_examples) ? prompt.client_objections_examples : [],
        phrase_tips: prompt.phrase_tips || '',
        phrase_tips_examples: Array.isArray(prompt.phrase_tips_examples) ? prompt.phrase_tips_examples : [],
        flow: Array.isArray(prompt.flow) ? prompt.flow : [],
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
      console.log('\n=== UPDATE PROMPT INICIADO ===');
      console.log('🔄 updatePrompt chamado para ID:', id);
      console.log('📝 Updates recebidos:', Object.keys(updates));
      console.log('📊 Conteúdo dos updates:');
      Object.entries(updates).forEach(([key, value]) => {
        if (typeof value === 'string') {
          console.log(`  - ${key}: ${value.length > 0 ? 'PREENCHIDO (' + value.length + ' chars)' : 'VAZIO'}`);
        } else if (Array.isArray(value)) {
          console.log(`  - ${key}: ARRAY com ${value.length} itens`);
        } else {
          console.log(`  - ${key}:`, value);
        }
      });
      
      const formattedUpdates: any = {};
      
      // Map frontend fields to database fields (TODAS as colunas agora existem)
      if (updates.agent_function !== undefined) formattedUpdates.agent_function = updates.agent_function;
      if (updates.agent_objective !== undefined) formattedUpdates.agent_objective = updates.agent_objective;
      if (updates.communication_style !== undefined) formattedUpdates.communication_style = updates.communication_style;
      if (updates.communication_style_examples !== undefined) formattedUpdates.communication_style_examples = Array.isArray(updates.communication_style_examples) ? updates.communication_style_examples : [];
      if (updates.company_info !== undefined) formattedUpdates.company_info = updates.company_info;
      if (updates.products_services !== undefined) formattedUpdates.products_services = updates.products_services;
      if (updates.products_services_examples !== undefined) formattedUpdates.products_services_examples = Array.isArray(updates.products_services_examples) ? updates.products_services_examples : [];
      if (updates.rules_guidelines !== undefined) formattedUpdates.rules_guidelines = updates.rules_guidelines;
      if (updates.rules_guidelines_examples !== undefined) formattedUpdates.rules_guidelines_examples = Array.isArray(updates.rules_guidelines_examples) ? updates.rules_guidelines_examples : [];
      if (updates.prohibitions !== undefined) formattedUpdates.prohibitions = updates.prohibitions;
      if (updates.prohibitions_examples !== undefined) formattedUpdates.prohibitions_examples = Array.isArray(updates.prohibitions_examples) ? updates.prohibitions_examples : [];
      if (updates.client_objections !== undefined) formattedUpdates.client_objections = updates.client_objections;
      if (updates.client_objections_examples !== undefined) formattedUpdates.client_objections_examples = Array.isArray(updates.client_objections_examples) ? updates.client_objections_examples : [];
      if (updates.phrase_tips !== undefined) formattedUpdates.phrase_tips = updates.phrase_tips;
      if (updates.phrase_tips_examples !== undefined) formattedUpdates.phrase_tips_examples = Array.isArray(updates.phrase_tips_examples) ? updates.phrase_tips_examples : [];
      if (updates.flow !== undefined) formattedUpdates.flow = Array.isArray(updates.flow) ? updates.flow : [];
      
      // Adicionar updated_at para forçar atualização
      formattedUpdates.updated_at = new Date().toISOString();
      
      console.log('🔑 Verificando se há dados para atualizar...');
      if (Object.keys(formattedUpdates).length === 1) { // Apenas updated_at
        console.log('⚠️ NENHUMA ALTERAÇÃO DETECTADA!');
        console.log('  - formattedUpdates contém apenas:', Object.keys(formattedUpdates));
        // Mesmo assim, vamos prosseguir para testar a conectividade
      }

      console.log('\n💾 DADOS FORMATADOS PARA SUPABASE:');
      console.log('📝 formattedUpdates:', formattedUpdates);
      console.log('🔑 Tentando atualizar registro ID:', id);
      
      // Verificar se o registro existe antes de tentar atualizar
      console.log('\n🔍 PRE-VERIFICAÇÃO: Confirmando existência do registro...');
      const { data: existingRecord, error: checkError } = await supabase
        .from('ai_agent_prompts')
        .select('id, created_by_user_id, agent_id')
        .eq('id', id)
        .single();
        
      if (checkError) {
        console.error('❌ ERRO NA PRE-VERIFICAÇÃO:', checkError);
        throw new Error(`Erro ao verificar existência do prompt: ${checkError.message}`);
      }
      
      if (!existingRecord) {
        console.error('❌ REGISTRO NÃO ENCONTRADO!');
        throw new Error(`Prompt com ID ${id} não foi encontrado`);
      }
      
      console.log('✅ Registro encontrado:', {
        id: existingRecord.id,
        agent_id: existingRecord.agent_id,
        owner: existingRecord.created_by_user_id
      });

      console.log('\n📤 EXECUTANDO ATUALIZAÇÃO...');
      const { data, error } = await supabase
        .from('ai_agent_prompts')
        .update(formattedUpdates)
        .eq('id', id)
        .select();

      console.log('\n📊 RESPOSTA DO SUPABASE:');
      console.log('  - Data:', data ? `${data.length} registro(s) afetado(s)` : 'NENHUM DADO');
      console.log('  - Error:', error || 'NENHUM ERRO');

      if (error) {
        console.error('❌ ERRO DO SUPABASE:', error);
        console.error('  - Mensagem:', error.message);
        console.error('  - Detalhes:', error.details);
        console.error('  - Hint:', error.hint);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('❌ NENHUM REGISTRO ATUALIZADO!');
        console.error('  - Possíveis causas: ID não existe, sem permissão, ou RLS bloqueando');
        throw new Error('Nenhum registro foi atualizado - verifique se o prompt existe e você tem permissão');
      }
      
      console.log('✅ UPDATE CONCLUÍDO COM SUCESSO!');
      console.log('=== FIM UPDATE PROMPT ===\n');
      return true;
    } catch (error) {
      console.error('❌ Error updating AI agent prompt:', error);
      throw error;
    }
  };

  const getPromptByAgentId = async (targetAgentId: string): Promise<AIAgentPrompt | null> => {
    try {
      console.log('\n=== GET PROMPT BY AGENT ID ===');
      console.log('🔍 Buscando prompt para agente ID:', targetAgentId);
      
      const { data, error } = await supabase
        .from('ai_agent_prompts')
        .select('*')
        .eq('agent_id', targetAgentId)
        .maybeSingle();

      console.log('📊 Resposta da busca:');
      console.log('  - Data encontrado:', data ? 'SIM' : 'NÃO');
      console.log('  - Error:', error || 'NENHUM');
      
      if (error) {
        console.error('❌ Erro ao buscar prompt:', error);
        throw error;
      }
      
      if (!data) {
        console.log('⚠️ Nenhum prompt encontrado para este agente');
        console.log('=== FIM GET PROMPT (SEM DADOS) ===\n');
        return null;
      }
      
      // Convert database record to typed AIAgentPrompt object
      const typedPrompt: AIAgentPrompt = {
        id: data.id,
        agent_id: data.agent_id,
        agent_function: data.agent_function,
        agent_objective: data.agent_objective || '',
        communication_style: data.communication_style || '',
        communication_style_examples: Array.isArray(data.communication_style_examples) ? data.communication_style_examples : [],
        company_info: data.company_info || '',
        products_services: data.products_services || '',
        products_services_examples: Array.isArray(data.products_services_examples) ? data.products_services_examples : [],
        rules_guidelines: data.rules_guidelines || '',
        rules_guidelines_examples: Array.isArray(data.rules_guidelines_examples) ? data.rules_guidelines_examples : [],
        prohibitions: data.prohibitions || '',
        prohibitions_examples: Array.isArray(data.prohibitions_examples) ? data.prohibitions_examples : [],
        client_objections: data.client_objections || '',
        client_objections_examples: Array.isArray(data.client_objections_examples) ? data.client_objections_examples : [],
        phrase_tips: data.phrase_tips || '',
        phrase_tips_examples: Array.isArray(data.phrase_tips_examples) ? data.phrase_tips_examples : [],
        flow: Array.isArray(data.flow) ? data.flow : [],
        created_by_user_id: data.created_by_user_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      console.log('✅ Prompt encontrado e convertido com sucesso');
      console.log('=== FIM GET PROMPT (COM SUCESSO) ===\n');
      return typedPrompt;
    } catch (error) {
      console.error('❌ ERRO AO BUSCAR PROMPT POR AGENT ID:', error);
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
