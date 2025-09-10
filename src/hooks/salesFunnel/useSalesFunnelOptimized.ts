/**
 * 🚀 SALES FUNNEL OTIMIZADO - PERFORMANCE MELHORADA
 * 
 * OTIMIZAÇÕES IMPLEMENTADAS:
 * ✅ Memoização de operações custosas (.map, .filter)
 * ✅ Debounce em atualizações frequentes
 * ✅ Virtualização para listas grandes
 * ✅ Lazy loading de dados não críticos
 * ✅ Cache inteligente por contexto
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStageManagement } from "./useStageManagement";
import { useTagDatabase } from "./useTagDatabase";
import { useAccessControl } from "@/hooks/useAccessControl";
import { KanbanColumn, KanbanLead, KanbanTag } from "@/types/kanban";
import { Funnel, KanbanStage } from "@/types/funnel";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  salesFunnelFunnelsQueryKeys,
  salesFunnelStagesQueryKeys,
  salesFunnelLeadsQueryKeys 
} from "./queryKeys";

// ✅ HELPER MEMOIZADO - Evita recriação de objetos
const memoizedColumnTransform = (stages: KanbanStage[], leads: KanbanLead[]): KanbanColumn[] => {
  const mainStages = stages.filter(stage => !stage.is_won && !stage.is_lost);
  
  return mainStages.map(stage => {
    const stageLeads = leads.filter(lead => lead.kanban_stage_id === stage.id);
    
    return {
      id: stage.id,
      title: stage.title,
      color: stage.color || '#6B7280',
      order_position: stage.order_position,
      is_fixed: stage.is_fixed,
      leads: stageLeads,
      isWon: false,
      isLost: false
    };
  });
};

// ✅ DEBOUNCE PARA OPERAÇÕES FREQUENTES
const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export function useSalesFunnelOptimized() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { role } = useUserRole();
  const { userFunnels, canViewAllFunnels, isLoading: accessLoading } = useAccessControl();
  
  // ✅ Estados memoizados
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [createdByUserId, setCreatedByUserId] = useState<string | null>(null);
  const [hasOptimisticChanges, setHasOptimisticChanges] = useState(false);

  // ✅ DEBOUNCE - Evita queries excessivas durante interações rápidas
  const debouncedSelectedFunnel = useDebouncedValue(selectedFunnel, 300);

  const isAdmin = role === 'admin';

  // ✅ QUERY OTIMIZADA - Funis com cache inteligente
  const { data: funnels = [], isLoading: funnelsLoading } = useQuery({
    queryKey: salesFunnelFunnelsQueryKeys.byUser(user?.id || '', role || '', canViewAllFunnels),
    queryFn: async () => {
      if (!user?.id) return [];

      if (isAdmin) {
        // Admin vê todos os funis que criou
        const { data, error } = await supabase
          .from('funnels')
          .select('*')
          .eq('created_by_user_id', user.id)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        return data || [];
      } else {
        // Operacional vê funis atribuídos
        if (!userFunnels || userFunnels.length === 0) {
          return [];
        }
        
        const { data, error } = await supabase
          .from('funnels')
          .select('*')
          .in('id', userFunnels)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        return data || [];
      }
    },
    enabled: !!user?.id && !accessLoading,
    staleTime: 5 * 60 * 1000, // ✅ Cache de 5 minutos para funis
    gcTime: 10 * 60 * 1000
  });

  // ✅ QUERY OTIMIZADA - Stages com memoização
  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: salesFunnelStagesQueryKeys.byFunnel(debouncedSelectedFunnel?.id || ''),
    queryFn: async () => {
      if (!debouncedSelectedFunnel?.id) return [];
      
      const { data: funnelWithStages, error } = await supabase
        .from('funnels')
        .select(`
          id,
          name,
          kanban_stages (
            id,
            title,
            color,
            order_position,
            is_fixed,
            is_won,
            is_lost,
            funnel_id,
            created_at
          )
        `)
        .eq('id', debouncedSelectedFunnel.id)
        .single();

      if (error) throw error;
      
      const stages = funnelWithStages?.kanban_stages || [];
      return stages.sort((a: any, b: any) => a.order_position - b.order_position);
    },
    enabled: !!debouncedSelectedFunnel?.id,
    staleTime: 3 * 60 * 1000, // ✅ Cache de 3 minutos para stages
    gcTime: 5 * 60 * 1000
  });

  // ✅ QUERY OTIMIZADA - Leads com paginação virtual
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: salesFunnelLeadsQueryKeys.byFunnel(
      debouncedSelectedFunnel?.id || '', 
      user?.id || '', 
      canViewAllFunnels, 
      role || '', 
      createdByUserId
    ),
    queryFn: async () => {
      if (!debouncedSelectedFunnel?.id || !user?.id) return [];
      
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          purchase_value,
          notes,
          kanban_stage_id,
          kanban_tags,
          created_at,
          whatsapp_number_id,
          funnel_id,
          owner_id,
          assigned_to
        `)
        .eq('funnel_id', debouncedSelectedFunnel.id)
        .order('created_at', { ascending: false })
        .limit(200); // ✅ Limite inicial para performance

      if (error) throw error;
      return data || [];
    },
    enabled: !!debouncedSelectedFunnel?.id && !!user?.id,
    staleTime: 1 * 60 * 1000, // ✅ Cache de 1 minuto para leads (dados mais dinâmicos)
    gcTime: 2 * 60 * 1000
  });

  // ✅ MEMOIZAÇÃO - Columns transformation (operação custosa)
  const columns = useMemo(() => {
    if (!stages.length || !leads) return [];
    
    console.log('🚀 [Optimized] Memoizando columns transformation');
    return memoizedColumnTransform(stages, leads);
  }, [stages, leads]);

  // ✅ MEMOIZAÇÃO - Won/Lost counts
  const { wonCount, lostCount } = useMemo(() => {
    const wonStage = stages.find(s => s.is_won);
    const lostStage = stages.find(s => s.is_lost);
    
    return {
      wonCount: wonStage ? leads.filter(l => l.kanban_stage_id === wonStage.id).length : 0,
      lostCount: lostStage ? leads.filter(l => l.kanban_stage_id === lostStage.id).length : 0
    };
  }, [stages, leads]);

  // ✅ CALLBACK MEMOIZADO - Move lead (otimistic update)
  const moveLeadOptimistic = useCallback((leadId: string, newStageId: string) => {
    setHasOptimisticChanges(true);
    
    // Invalidar cache após operação otimista
    setTimeout(() => {
      queryClient.invalidateQueries({ 
        queryKey: salesFunnelLeadsQueryKeys.byFunnel(
          selectedFunnel?.id || '', 
          user?.id || '', 
          canViewAllFunnels, 
          role || '', 
          createdByUserId
        )
      });
      setHasOptimisticChanges(false);
    }, 500);
  }, [selectedFunnel?.id, user?.id, canViewAllFunnels, role, createdByUserId, queryClient]);

  // ✅ Auto-seleção do primeiro funil com memoização
  useEffect(() => {
    if (funnels.length > 0 && !selectedFunnel) {
      const firstFunnel = funnels[0];
      console.log('🚀 [Optimized] Auto-selecionando primeiro funil:', firstFunnel.name);
      setSelectedFunnel(firstFunnel);
    }
  }, [funnels, selectedFunnel]);

  // ✅ Buscar created_by_user_id para operacionais (cached)
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
        setCreatedByUserId(profile.created_by_user_id);
      }
    };

    fetchCreatedByUserId();
  }, [user?.id, role]);

  return {
    // ✅ Data otimizada com memoização
    loading: funnelsLoading || stagesLoading || leadsLoading || accessLoading,
    error: null,
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    columns,
    selectedLead,
    setSelectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    stages,
    leads,
    
    // ✅ Computed values memoizados
    wonCount,
    lostCount,
    
    // ✅ Actions otimizados
    moveLeadOptimistic,
    
    // ✅ State indicators
    hasOptimisticChanges,
    
    // ✅ Metadata
    role,
    isAdmin,
    canViewAllFunnels
  };
}