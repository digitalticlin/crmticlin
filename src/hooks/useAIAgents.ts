
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AIAgent, CreateAIAgentData } from '@/types/aiAgent';
import { toast } from 'sonner';

export const useAIAgents = () => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      console.log('🔄 Buscando agentes atualizados do banco...');
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert database records to typed AIAgent objects
      const typedAgents: AIAgent[] = (data || []).map(agent => ({
        ...agent,
        type: agent.type as 'attendance' | 'sales' | 'support' | 'custom',
        status: agent.status as 'active' | 'inactive'
      }));
      
      console.log(`✅ ${typedAgents.length} agentes carregados do banco`);
      setAgents(typedAgents);
    } catch (error) {
      console.error('❌ Error fetching AI agents:', error);
      toast.error('Erro ao carregar agentes de IA');
    } finally {
      setIsLoading(false);
    }
  };

  const createAgent = async (data: CreateAIAgentData): Promise<AIAgent | null> => {
    try {
      console.log('🔄 useAIAgents.createAgent chamado:', data);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        console.error('❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      console.log('👤 Usuário autenticado:', user.user.id);

      const insertData = {
        ...data,
        created_by_user_id: user.user.id
      };
      
      console.log('📝 Dados para inserção:', insertData);

      const { data: agent, error } = await supabase
        .from('ai_agents')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro no Supabase insert:', error);
        throw error;
      }
      
      console.log('✅ Agente criado no banco:', agent);
      
      // Convert database record to typed AIAgent object
      const typedAgent: AIAgent = {
        ...agent,
        type: agent.type as 'attendance' | 'sales' | 'support' | 'custom',
        status: agent.status as 'active' | 'inactive'
      };
      
      console.log('🔄 Atualizando lista de agentes...');
      await fetchAgents();
      console.log('✅ Lista de agentes atualizada');
      
      // Não mostrar toast aqui pois é mostrado no componente
      return typedAgent;
    } catch (error) {
      console.error('❌ Error creating AI agent:', error);
      toast.error('Erro ao criar agente');
      return null;
    }
  };

  const updateAgent = async (id: string, updates: Partial<AIAgent>): Promise<boolean> => {
    try {
      console.log('🔄 useAIAgents.updateAgent chamado:', { id, updates });
      
      const { data, error } = await supabase
        .from('ai_agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro no Supabase update:', error);
        throw error;
      }
      
      console.log('✅ Agente atualizado no banco:', data);
      
      // NÃO chamar fetchAgents aqui - será chamado pelo componente via refetch
      console.log('💡 Updatent concluído - aguardando refetch do componente');
      
      // Não mostrar toast aqui pois é mostrado no componente
      return true;
    } catch (error) {
      console.error('❌ Error updating AI agent:', error);
      toast.error('Erro ao atualizar agente');
      return false;
    }
  };

  const deleteAgent = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchAgents();
      toast.success('Agente removido com sucesso');
      return true;
    } catch (error) {
      console.error('Error deleting AI agent:', error);
      toast.error('Erro ao remover agente');
      return false;
    }
  };

  const toggleAgentStatus = async (id: string): Promise<boolean> => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return false;

    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    
    console.log(`🔄 Toggling agent ${id} status: ${agent.status} → ${newStatus}`);
    
    // Atualização otimista - atualizar UI imediatamente
    const updatedAgents = agents.map(a => 
      a.id === id ? { ...a, status: newStatus as 'active' | 'inactive' } : a
    );
    setAgents(updatedAgents);
    
    try {
      // Atualizar no banco de dados
      const { data, error } = await supabase
        .from('ai_agents')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar status no banco:', error);
        
        // Reverter mudança otimista em caso de erro
        const revertedAgents = agents.map(a => 
          a.id === id ? { ...a, status: agent.status } : a
        );
        setAgents(revertedAgents);
        
        toast.error('Erro ao alterar status do agente');
        return false;
      }
      
      console.log('✅ Status atualizado no banco com sucesso');
      toast.success(`Agente ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`);
      return true;
      
    } catch (error) {
      console.error('❌ Erro crítico ao toggle status:', error);
      
      // Reverter mudança otimista em caso de erro
      const revertedAgents = agents.map(a => 
        a.id === id ? { ...a, status: agent.status } : a
      );
      setAgents(revertedAgents);
      
      toast.error('Erro ao alterar status do agente');
      return false;
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return {
    agents,
    isLoading,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
    refetch: fetchAgents
  };
};
