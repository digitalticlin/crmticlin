
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface KPIData {
  novos_leads: number;
  total_leads: number;
  taxa_conversao: number;
  taxa_perda: number;
  valor_pipeline: number;
  ticket_medio: number;
  tempo_resposta: number;
}

export function useDashboardKPIs(periodFilter: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-kpis', user?.id, periodFilter],
    queryFn: async (): Promise<KPIData> => {
      if (!user?.id) {
        return {
          novos_leads: 0,
          total_leads: 0,
          taxa_conversao: 0,
          taxa_perda: 0,
          valor_pipeline: 0,
          ticket_medio: 0,
          tempo_resposta: 0,
        };
      }

      const days = parseInt(periodFilter);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      try {
        // Total de leads
        const { data: allLeads, error: allLeadsError } = await supabase
          .from('leads')
          .select('id, created_at, purchase_value')
          .eq('created_by_user_id', user.id);

        if (allLeadsError) throw allLeadsError;

        // Novos leads no período
        const { data: newLeads, error: newLeadsError } = await supabase
          .from('leads')
          .select('id')
          .eq('created_by_user_id', user.id)
          .gte('created_at', startDate.toISOString());

        if (newLeadsError) throw newLeadsError;

        // Deals no período
        const { data: deals, error: dealsError } = await supabase
          .from('deals')
          .select('status, value, date')
          .eq('created_by_user_id', user.id)
          .gte('date', startDate.toISOString());

        if (dealsError) throw dealsError;

        const totalLeads = allLeads?.length || 0;
        const novosLeads = newLeads?.length || 0;
        const wonDeals = deals?.filter(d => d.status === 'won').length || 0;
        const lostDeals = deals?.filter(d => d.status === 'lost').length || 0;
        const totalDeals = wonDeals + lostDeals;

        const taxaConversao = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;
        const taxaPerda = totalDeals > 0 ? Math.round((lostDeals / totalDeals) * 100) : 0;

        const valorPipeline = allLeads?.reduce((sum, lead) => sum + (Number(lead.purchase_value) || 0), 0) || 0;
        const ticketMedio = wonDeals > 0 ? 
          (deals?.filter(d => d.status === 'won').reduce((sum, d) => sum + (Number(d.value) || 0), 0) || 0) / wonDeals : 0;

        return {
          novos_leads: novosLeads,
          total_leads: totalLeads,
          taxa_conversao: taxaConversao,
          taxa_perda: taxaPerda,
          valor_pipeline: valorPipeline,
          ticket_medio: ticketMedio,
          tempo_resposta: 45, // Valor fixo por enquanto
        };
      } catch (error) {
        console.error('Erro ao buscar KPIs:', error);
        return {
          novos_leads: 0,
          total_leads: 0,
          taxa_conversao: 0,
          taxa_perda: 0,
          valor_pipeline: 0,
          ticket_medio: 0,
          tempo_resposta: 0,
        };
      }
    },
    enabled: !!user?.id,
  });
}
