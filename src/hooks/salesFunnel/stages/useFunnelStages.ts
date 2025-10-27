/**
 * 🎯 HOOK DE LEITURA - BUSCAR STAGES/ETAPAS DO FUNIL
 *
 * ARQUITETURA REFATORADA:
 * ✅ NÃO faz query HTTP própria
 * ✅ Usa cache compartilhado do useFunnelData
 * ✅ Derivar dados específicos de stages
 * ✅ Mesma queryKey = mesma requisição HTTP
 *
 * RESPONSABILIDADES:
 * ✅ Ler stages do cache compartilhado
 * ✅ Filtrar e organizar stages
 * ✅ Identificar stages especiais (ganho/perdido)
 * ✅ Retornar dados úteis pré-processados
 *
 * NÃO FAZ:
 * ❌ Query HTTP (useFunnelData faz isso)
 * ❌ CRUD de etapas (useStageActions faz isso)
 * ❌ Mutações ou updates
 */

import { useQuery } from '@tanstack/react-query';
import { funnelDataQueryKeys } from '../core/useFunnelData';
import { KanbanStage } from '@/types/funnel';

// ✅ Manter compatibilidade com código existente
export const funnelStagesQueryKeys = funnelDataQueryKeys;

interface UseFunnelStagesParams {
  funnelId: string | null;
  enabled?: boolean;
}

/**
 * Hook que deriva dados de stages do cache compartilhado
 * React Query deduplica automaticamente - não faz requisição HTTP se cache existe
 */
export function useFunnelStages({
  funnelId,
  enabled = true
}: UseFunnelStagesParams) {
  // ✅ USA MESMA QUERY KEY - React Query retorna cache compartilhado
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: funnelDataQueryKeys.byId(funnelId || ''),
    enabled: !!funnelId && enabled,
    // queryFn vazio - apenas lê cache, nunca executa
    queryFn: () => {
      console.log('[useFunnelStages] ⚠️ queryFn chamado - não deveria acontecer!');
      return null;
    },
    // Apenas lê cache, nunca refetch automaticamente
    staleTime: Infinity,
    gcTime: Infinity
  });

  // Derivar dados de stages do cache
  const stages: KanbanStage[] = data?.stages || [];

  // Identificar etapas especiais
  const wonStage = stages.find(s => s.is_won);
  const lostStage = stages.find(s => s.is_lost);
  const firstStage = stages.find(s => !s.is_won && !s.is_lost);

  // Etapas principais (não ganho nem perdido)
  const mainStages = stages.filter(s => !s.is_won && !s.is_lost);

  console.log('[useFunnelStages] 📖 Lendo do cache compartilhado:', {
    total: stages.length,
    mainStages: mainStages.length,
    hasWon: !!wonStage,
    hasLost: !!lostStage,
    cacheHit: !isLoading // Se não está loading, é cache hit
  });

  return {
    // Dados
    stages,
    mainStages,

    // Etapas especiais
    wonStage,
    lostStage,
    firstStage,
    wonStageId: wonStage?.id,
    lostStageId: lostStage?.id,
    firstStageId: firstStage?.id,

    // Estados
    isLoading,
    error,

    // Ações
    refetch
  };
}
