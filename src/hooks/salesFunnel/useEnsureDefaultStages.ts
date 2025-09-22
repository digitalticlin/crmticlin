/**
 * 🎯 HOOK PARA GARANTIR ETAPAS PADRÃO
 *
 * Cria automaticamente etapas padrão se o funil não tiver nenhuma
 */

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_STAGES = [
  { name: 'Entrada de Leads', color: '#3B82F6', order_position: 1, ai_enabled: false },
  { name: 'Qualificação', color: '#10B981', order_position: 2, ai_enabled: false },
  { name: 'Proposta', color: '#F59E0B', order_position: 3, ai_enabled: false },
  { name: 'Negociação', color: '#8B5CF6', order_position: 4, ai_enabled: false },
  { name: 'Fechamento', color: '#EF4444', order_position: 5, ai_enabled: false }
];

export const useEnsureDefaultStages = (funnelId: string | null) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!funnelId || !user?.id) return;

    const checkAndCreateStages = async () => {
      try {
        // Verificar se já existem etapas
        const { data: existingStages, error: checkError } = await supabase
          .from('kanban_stages')
          .select('id')
          .eq('funnel_id', funnelId)
          .limit(1);

        if (checkError) {
          console.error('[EnsureDefaultStages] ❌ Erro ao verificar etapas:', checkError);
          return;
        }

        // Se não existem etapas, criar as padrões
        if (!existingStages || existingStages.length === 0) {
          console.log('[EnsureDefaultStages] 📝 Criando etapas padrão para o funil:', funnelId);

          const stagesToCreate = DEFAULT_STAGES.map(stage => ({
            ...stage,
            funnel_id: funnelId,
            created_by_user_id: user.id
          }));

          const { error: createError } = await supabase
            .from('kanban_stages')
            .insert(stagesToCreate);

          if (createError) {
            console.error('[EnsureDefaultStages] ❌ Erro ao criar etapas:', createError);
          } else {
            console.log('[EnsureDefaultStages] ✅ Etapas padrão criadas com sucesso!');
          }
        } else {
          console.log('[EnsureDefaultStages] ✅ Funil já possui etapas');
        }
      } catch (error) {
        console.error('[EnsureDefaultStages] ❌ Erro geral:', error);
      }
    };

    checkAndCreateStages();
  }, [funnelId, user?.id]);
};