
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "@/hooks/useCompanyData";

export interface FunnelStageData {
  name: string;
  value: number;
  color: string;
}

export const useFunnelData = (periodDays: string) => {
  const [funnelData, setFunnelData] = useState<FunnelStageData[]>([]);
  const [loading, setLoading] = useState(true);
  const { companyId } = useCompanyData();

  useEffect(() => {
    if (companyId) {
      loadFunnelData();
    }
  }, [companyId, periodDays]);

  const loadFunnelData = async () => {
    try {
      setLoading(true);
      
      const daysAgo = parseInt(periodDays);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Buscar estágios do kanban
      const { data: stagesData, error: stagesError } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('company_id', companyId)
        .order('order_position', { ascending: true });

      if (stagesError) throw stagesError;

      // Buscar leads por estágio
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('kanban_stage_id')
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString());

      if (leadsError) throw leadsError;

      // Contar leads por estágio
      const stageCount = new Map();
      leadsData?.forEach(lead => {
        if (lead.kanban_stage_id) {
          const count = stageCount.get(lead.kanban_stage_id) || 0;
          stageCount.set(lead.kanban_stage_id, count + 1);
        }
      });

      // Gerar cores gradientes
      const generateColor = (index: number, total: number) => {
        const hue = 54; // Amarelo base (#d3d800)
        const saturation = 100;
        const lightness = 50 + (index * 20); // Variação na luminosidade
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      };

      // Mapear dados do funil
      const mappedData = stagesData?.map((stage, index) => ({
        name: stage.title,
        value: stageCount.get(stage.id) || 0,
        color: stage.color || generateColor(index, stagesData.length)
      })) || [];

      setFunnelData(mappedData);

    } catch (error) {
      console.error("Erro ao carregar dados do funil:", error);
      setFunnelData([]);
    } finally {
      setLoading(false);
    }
  };

  return { funnelData, loading, refresh: loadFunnelData };
};
