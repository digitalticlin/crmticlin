import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const [isOpen, setIsOpen] = useState(false);
  const [localCurrentStageId, setLocalCurrentStageId] = useState(currentStageId);

  // Sincronizar localCurrentStageId quando currentStageId muda
  if (localCurrentStageId !== currentStageId) {
    setLocalCurrentStageId(currentStageId);
  }

  // Buscar todas as etapas disponíveis para o usuário
  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['lead-stages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Buscar todas as etapas dos funis do usuário
      const { data: stagesData, error } = await supabase
        .from('kanban_stages')
        .select(`
          id,
          title,
          color,
          is_fixed,
          is_won,
          is_lost,
          funnel_id,
          funnels!inner(name)
        `)
        .eq('created_by_user_id', user.id)
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
    enabled: !!user?.id
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
      await queryClient.cancelQueries({ queryKey: ['whatsapp-contacts'] });
      
      return { previousStageId: localCurrentStageId };
    },
    onSuccess: ({ stageName, stageId }) => {
      console.log('[LeadStageManager] 🔄 Invalidando caches após sucesso...');
      
      // Invalidar todas as queries relevantes para buscar dados atualizados
      queryClient.invalidateQueries({ queryKey: ['kanban-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stages'] });
      
      // Refetch específico para garantir sincronização
      queryClient.refetchQueries({ queryKey: ['whatsapp-contacts'] });
      
      // Forçar refresh dos contatos do WhatsApp
      window.dispatchEvent(new CustomEvent('refreshWhatsAppContacts'));
      
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
