
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "@/hooks/useCompanyData";

export interface TemporalDataPoint {
  name: string;
  leads: number;
  converted: number;
}

export const useTemporalData = (periodDays: string) => {
  const [temporalData, setTemporalData] = useState<TemporalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { companyId } = useCompanyData();

  useEffect(() => {
    if (companyId) {
      loadTemporalData();
    }
  }, [companyId, periodDays]);

  const getDateRanges = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const ranges = [];
    const intervalDays = days <= 7 ? 1 : days <= 30 ? 7 : 30; // Diário, semanal ou mensal
    
    for (let i = 0; i < days; i += intervalDays) {
      const rangeStart = new Date(startDate);
      rangeStart.setDate(rangeStart.getDate() + i);
      
      const rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeEnd.getDate() + intervalDays - 1);
      
      if (rangeEnd > endDate) {
        rangeEnd.setTime(endDate.getTime());
      }

      ranges.push({
        start: rangeStart,
        end: rangeEnd,
        name: formatRangeName(rangeStart, rangeEnd, intervalDays)
      });
    }

    return ranges;
  };

  const formatRangeName = (start: Date, end: Date, intervalDays: number) => {
    if (intervalDays === 1) {
      return start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else if (intervalDays === 7) {
      return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
    } else {
      return start.toLocaleDateString('pt-BR', { month: 'short' });
    }
  };

  const loadTemporalData = async () => {
    try {
      setLoading(true);
      
      const daysAgo = parseInt(periodDays);
      const ranges = getDateRanges(daysAgo);

      const temporalPoints: TemporalDataPoint[] = [];

      for (const range of ranges) {
        // Buscar leads criados no período
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select(`
            id,
            created_at,
            kanban_stages!inner(is_won)
          `)
          .eq('company_id', companyId)
          .gte('created_at', range.start.toISOString())
          .lte('created_at', range.end.toISOString());

        if (leadsError) throw leadsError;

        const totalLeads = leadsData?.length || 0;
        const convertedLeads = leadsData?.filter(lead => lead.kanban_stages?.is_won).length || 0;

        temporalPoints.push({
          name: range.name,
          leads: totalLeads,
          converted: convertedLeads
        });
      }

      setTemporalData(temporalPoints);

    } catch (error) {
      console.error("Erro ao carregar dados temporais:", error);
      setTemporalData([]);
    } finally {
      setLoading(false);
    }
  };

  return { temporalData, loading, refresh: loadTemporalData };
};
