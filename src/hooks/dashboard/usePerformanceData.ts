
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "@/hooks/useCompanyData";

export interface PerformanceData {
  name: string;
  leads: number;
  conversoes: number;
  vendas: number;
}

export const usePerformanceData = (periodDays: string) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const { companyId } = useCompanyData();

  useEffect(() => {
    if (companyId) {
      loadPerformanceData();
    }
  }, [companyId, periodDays]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      const daysAgo = parseInt(periodDays);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Buscar vendedores da empresa
      const { data: salespeople, error: salespeopleError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', companyId)
        .in('role', ['seller', 'admin']);

      if (salespeopleError) throw salespeopleError;

      // Buscar leads com informações de conversão
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          owner_id,
          purchase_value,
          kanban_stages!inner(is_won)
        `)
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString());

      if (leadsError) throw leadsError;

      // Processar dados de performance
      const performanceMap = new Map();

      salespeople?.forEach(person => {
        performanceMap.set(person.id, {
          name: person.full_name || 'Vendedor sem nome',
          leads: 0,
          conversoes: 0,
          vendas: 0
        });
      });

      leadsData?.forEach(lead => {
        if (lead.owner_id && performanceMap.has(lead.owner_id)) {
          const performance = performanceMap.get(lead.owner_id);
          performance.leads += 1;
          
          if (lead.kanban_stages?.is_won) {
            performance.conversoes += 1;
            performance.vendas += lead.purchase_value || 0;
          }
        }
      });

      const result = Array.from(performanceMap.values())
        .filter(data => data.leads > 0) // Apenas vendedores com leads
        .sort((a, b) => b.leads - a.leads); // Ordenar por número de leads

      setPerformanceData(result);

    } catch (error) {
      console.error("Erro ao carregar dados de performance:", error);
      setPerformanceData([]);
    } finally {
      setLoading(false);
    }
  };

  return { performanceData, loading, refresh: loadPerformanceData };
};
