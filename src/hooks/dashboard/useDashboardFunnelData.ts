import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessControl } from "@/hooks/useAccessControl";

interface DashboardFunnelData {
  id: string;
  name: string;
}

interface DashboardStage {
  id: string;
  name: string;
  order_position: number;
  is_won: boolean;
  is_lost: boolean;
  funnel_id: string;
}

/**
 * Hook leve para buscar apenas dados necessários para gráficos do Dashboard
 * Evita carregar o hook pesado useSalesFunnelDirect no Dashboard
 */
export function useDashboardFunnelData() {
  const { user } = useAuth();
  const { userFunnels, canViewAllFunnels, isLoading: accessLoading } = useAccessControl();

  // Buscar primeiro funil acessível (para gráficos)
  const { data: selectedFunnel = null, isLoading: funnelLoading } = useQuery({
    queryKey: ['dashboard-funnel', user?.id, canViewAllFunnels, userFunnels],
    queryFn: async (): Promise<DashboardFunnelData | null> => {
      if (!user?.id || accessLoading) return null;
      
      try {
        let accessibleFunnels: string[] = [];
        
        if (canViewAllFunnels) {
          // Admin: buscar todos os funis
          const { data: allFunnels, error } = await supabase
            .from('funnels')
            .select('id, name')
            .order('created_at', { ascending: true })
            .limit(1);
            
          if (error) throw error;
          return allFunnels?.[0] || null;
        } else {
          // Operacional: buscar apenas funis atribuídos
          if (userFunnels.length === 0) return null;
          
          const { data: assignedFunnel, error } = await supabase
            .from('funnels')
            .select('id, name')
            .in('id', userFunnels)
            .order('created_at', { ascending: true })
            .limit(1);
            
          if (error) throw error;
          return assignedFunnel?.[0] || null;
        }
      } catch (error) {
        console.error('[useDashboardFunnelData] ❌ Erro ao buscar funil:', error);
        return null;
      }
    },
    enabled: !!user?.id && !accessLoading,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000
  });

  // Buscar estágios do funil selecionado (para gráficos)
  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['dashboard-stages', selectedFunnel?.id],
    queryFn: async (): Promise<DashboardStage[]> => {
      if (!selectedFunnel?.id) return [];
      
      const { data, error } = await supabase
        .from('kanban_stages')
        .select(`id, title, order_position, is_won, is_lost, funnel_id`)
        .eq('funnel_id', selectedFunnel.id)
        .order('order_position', { ascending: true });
      
      return (data || []).map(stage => ({
        ...stage,
        name: stage.title
      }));
    },
    enabled: !!selectedFunnel?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  return {
    selectedFunnel,
    stages,
    loading: funnelLoading || stagesLoading || accessLoading,
  };
}