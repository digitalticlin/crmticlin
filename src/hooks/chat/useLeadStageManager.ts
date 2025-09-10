import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  chatStagesQueryKeys, 
  chatContactsQueryKeys, 
  chatLeadsQueryKeys,
  chatClientsQueryKeys 
} from './queryKeys';
import { useUserRole } from '@/hooks/useUserRole';

export interface StageOption {
  id: string;
  title: string;
  color: string;
  is_fixed: boolean;
  is_won: boolean;
  is_lost: boolean;
  funnel_id: string;
  funnel_name?: string;
}

export const useLeadStageManager = (leadId: string | null, currentStageId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { role } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);
  const [localCurrentStageId, setLocalCurrentStageId] = useState(currentStageId);
  const [createdByUserId, setCreatedByUserId] = useState<string | null>(null);

  // Sincronizar localCurrentStageId quando currentStageId muda
  if (localCurrentStageId !== currentStageId) {
    setLocalCurrentStageId(currentStageId);
  }

  // Buscar created_by_user_id do perfil se for operacional
  useEffect(() => {
    const fetchCreatedByUserId = async () => {
      if (!user?.id || role !== 'operational') {
        setCreatedByUserId(null);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_by_user_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.created_by_user_id) {
        console.log('[LeadStageManager] 👤 Operacional - created_by_user_id:', profile.created_by_user_id);
        setCreatedByUserId(profile.created_by_user_id);
      }
    };
    
    fetchCreatedByUserId();
  }, [user?.id, role]);

  // Buscar todas as etapas disponíveis para o usuário
  const { data: stages = [], isLoading } = useQuery({
    queryKey: chatStagesQueryKeys.byUser(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('kanban_stages')
        .select(`
          id,
          title,
          color,
          is_fixed,
          is_won,
          is_lost,
          funnel_id,
          funnels!inner(name, created_by_user_id)
        `);

      // MULTITENANT: Aplicar filtro correto baseado no role
      if (role === 'admin') {
        // Admin vê etapas dos funis onde created_by_user_id = seu ID
        query = query.eq('funnels.created_by_user_id', user.id);
      } else if (role === 'operational' && createdByUserId) {
        // Operacional vê etapas dos funis do admin ao qual pertence
        // E que foram atribuídos a ele via user_funnels
        const { data: userFunnels } = await supabase
          .from('user_funnels')
          .select('funnel_id')
          .eq('profile_id', user.id);
        
        const funnelIds = userFunnels?.map(uf => uf.funnel_id) || [];
        
        if (funnelIds.length > 0) {
          query = query
            .in('funnel_id', funnelIds)
            .eq('funnels.created_by_user_id', createdByUserId);
        } else {
          // Se não tem funis atribuídos, retorna vazio
          return [];
        }
      } else {
        // Fallback seguro
        query = query.eq('funnels.created_by_user_id', user.id);
      }

      const { data: stagesData, error } = await query
        .order('order_position', { ascending: true });

      if (error) {
        console.error('Erro ao buscar etapas:', error);
        throw error;
      }

      return (stagesData || []).map(stage => ({
        id: stage.id,
        title: stage.title,
        color: stage.color || '#e0e0e0',
        is_fixed: stage.is_fixed || false,
        is_won: stage.is_won || false,
        is_lost: stage.is_lost || false,
        funnel_id: stage.funnel_id,
        funnel_name: (stage.funnels as any)?.name || 'Funil'
      }));
    },
    enabled: !!user?.id && (role === 'admin' || (role === 'operational' && !!createdByUserId))
  });

  // Mutação para alterar etapa do lead
  const changeStage = useMutation({
    mutationFn: async ({ stageId, stageName }: { stageId: string; stageName: string }) => {
      if (!leadId) throw new Error('Lead não selecionado');

      console.log('[LeadStageManager] 🔄 Alterando etapa do lead:', {
        leadId,
        stageId,
        stageName,
        currentStageId: localCurrentStageId
      });

      const { error } = await supabase
        .from('leads')
        .update({ 
          kanban_stage_id: stageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) {
        console.error('[LeadStageManager] ❌ Erro na mutação:', error);
        throw error;
      }

      console.log('[LeadStageManager] ✅ Etapa alterada com sucesso no banco');
      return { stageId, stageName };
    },
    onMutate: async ({ stageId, stageName }) => {
      // 🚀 ATUALIZAÇÃO OTIMISTA - Atualizar UI imediatamente
      console.log('[LeadStageManager] ⚡ Atualizando UI otimisticamente:', { stageId, stageName });
      setLocalCurrentStageId(stageId);
      
      // Cancelar queries em andamento para evitar conflitos
      await queryClient.cancelQueries({ queryKey: chatContactsQueryKeys.base });
      
      return { previousStageId: localCurrentStageId };
    },
    onSuccess: ({ stageName, stageId }) => {
      console.log('[LeadStageManager] 🔄 Invalidando caches após sucesso...');
      
      // Invalidar queries ISOLADAS do chat (não interfere com Sales Funnel)
      queryClient.invalidateQueries({ queryKey: chatLeadsQueryKeys.base });
      queryClient.invalidateQueries({ queryKey: chatClientsQueryKeys.base });
      queryClient.invalidateQueries({ queryKey: chatContactsQueryKeys.base });
      queryClient.invalidateQueries({ queryKey: chatStagesQueryKeys.base });
      
      // Refetch específico para garantir sincronização
      queryClient.refetchQueries({ queryKey: chatContactsQueryKeys.base });
      
      // 🚀 CORREÇÃO: Só fazer refresh de contatos se realmente necessário
      // Mudanças de etapa não afetam a ordem da lista de contatos
      console.log('[LeadStageManager] ℹ️ Etapa alterada - não é necessário resetar lista de contatos');
      
      // 🚀 NOVO: Disparar evento específico para atualizar o contato selecionado
      window.dispatchEvent(new CustomEvent('updateSelectedContactStage', {
        detail: { leadId, newStageId: stageId, newStageName: stageName }
      }));
      
      toast.success(`Lead movido para: ${stageName}`);
      setIsOpen(false);
      
      console.log('[LeadStageManager] ✅ Caches invalidados e UI atualizada');
    },
    onError: (error: any, variables, context) => {
      // 🔄 REVERTER MUDANÇA OTIMISTA EM CASO DE ERRO
      console.error('[LeadStageManager] ❌ Erro ao mover lead, revertendo:', error);
      if (context?.previousStageId) {
        setLocalCurrentStageId(context.previousStageId);
      }
      toast.error('Erro ao mover lead de etapa');
    }
  });

  // Agrupar etapas por funil
  const stagesByFunnel = stages.reduce((acc, stage) => {
    const funnelName = stage.funnel_name || 'Funil';
    if (!acc[funnelName]) {
      acc[funnelName] = [];
    }
    acc[funnelName].push(stage);
    return acc;
  }, {} as Record<string, StageOption[]>);

  // Usar localCurrentStageId em vez de currentStageId para ter atualizações em tempo real
  const currentStage = stages.find(stage => stage.id === localCurrentStageId);

  return {
    stages,
    stagesByFunnel,
    currentStage,
    isLoading,
    isChanging: changeStage.isPending,
    isOpen,
    setIsOpen,
    changeStage: changeStage.mutate
  };
};
