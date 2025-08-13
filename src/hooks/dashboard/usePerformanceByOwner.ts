import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OwnerPerformanceRow {
  name: string;
  activeLeads: number;
  wonInPeriod: number;
}

export function usePerformanceByOwner(periodFilter: string) {
  const { user } = useAuth();

  return useQuery<{ data: OwnerPerformanceRow[] }, any, OwnerPerformanceRow[]>({
    queryKey: ["performance-by-owner", user?.id, periodFilter],
    queryFn: async () => {
      if (!user?.id) return { data: [] } as any;

      const days = parseInt(periodFilter);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 1) Buscar estágios ativos (não ganho/perdido)
      const { data: activeStages, error: stagesError } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('is_won', false)
        .eq('is_lost', false);
      if (stagesError) throw stagesError;
      const activeStageIds = (activeStages || []).map(s => s.id);

      // 2) Agregar leads ativos por responsável
      // Nota: usamos paginação em lote se necessário, mas supabase conta não precisa baixar tudo
      const { data: activeLeadsData, error: activeLeadsError } = await supabase
        .from('leads')
        .select('owner_id', { count: 'exact' })
        .eq('created_by_user_id', user.id)
        .not('funnel_id', 'is', null)
        .in('kanban_stage_id', activeStageIds);
      if (activeLeadsError) throw activeLeadsError;

      const activeCountByOwner: Record<string, number> = {};
      (activeLeadsData || []).forEach((row: any) => {
        const ownerId = row.owner_id || 'sem-responsavel';
        activeCountByOwner[ownerId] = (activeCountByOwner[ownerId] || 0) + 1;
      });

      // 3) Agregar vendas ganhas no período por responsável
      const { data: wonDeals, error: wonDealsError } = await supabase
        .from('deals')
        .select('lead_id, value, date')
        .eq('created_by_user_id', user.id)
        .eq('status', 'won')
        .gte('date', startDate.toISOString());
      if (wonDealsError) throw wonDealsError;

      // 3.a) Map lead_id -> owner_id
      const leadIds = Array.from(new Set((wonDeals || []).map(d => d.lead_id).filter(Boolean)));
      let ownerByLead: Record<string, string> = {};
      if (leadIds.length > 0) {
        const { data: leadsOwners, error: ownersError } = await supabase
          .from('leads')
          .select('id, owner_id')
          .in('id', leadIds);
        if (ownersError) throw ownersError;
        (leadsOwners || []).forEach(row => {
          if (row.id) ownerByLead[row.id] = row.owner_id || 'sem-responsavel';
        });
      }

      const wonCountByOwner: Record<string, number> = {};
      (wonDeals || []).forEach(d => {
        const ownerId = ownerByLead[d.lead_id] || 'sem-responsavel';
        wonCountByOwner[ownerId] = (wonCountByOwner[ownerId] || 0) + 1;
      });

      // 4) Resolver nomes dos responsáveis a partir de profiles (id == owner_id)
      const ownerIds = Array.from(new Set([ ...Object.keys(activeCountByOwner), ...Object.keys(wonCountByOwner) ]))
        .filter(Boolean);

      let nameByOwner: Record<string, string> = {};
      if (ownerIds.length > 0) {
        // Tentar tabela profiles (id, full_name / name)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, name')
          .in('id', ownerIds);
        if (profilesError) {
          // fallback silencioso
          console.warn('[usePerformanceByOwner] profiles lookup error:', profilesError.message);
        }
        (profiles || []).forEach(p => {
          const displayName = (p.full_name || p.name || '').trim();
          nameByOwner[p.id] = displayName || p.id;
        });
      }

      const rows: OwnerPerformanceRow[] = ownerIds.map(ownerId => ({
        name: nameByOwner[ownerId] || ownerId,
        activeLeads: activeCountByOwner[ownerId] || 0,
        wonInPeriod: wonCountByOwner[ownerId] || 0,
      }));

      // Ordenar por activeLeads desc para melhor leitura
      rows.sort((a, b) => (b.activeLeads - a.activeLeads));
      return rows as any;
    },
    select: (data) => data as any,
    enabled: !!user?.id,
  });
}


