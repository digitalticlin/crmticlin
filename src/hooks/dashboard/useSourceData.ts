
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "@/hooks/useCompanyData";

export interface SourceData {
  name: string;
  value: number;
  color: string;
}

export const useSourceData = (periodDays: string) => {
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const { companyId } = useCompanyData();

  useEffect(() => {
    if (companyId) {
      loadSourceData();
    }
  }, [companyId, periodDays]);

  const loadSourceData = async () => {
    try {
      setLoading(true);
      
      const daysAgo = parseInt(periodDays);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Buscar leads com informações da instância WhatsApp
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          created_at,
          whatsapp_number_id,
          whatsapp_instances!inner(instance_name)
        `)
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString());

      if (leadsError) throw leadsError;

      // Contar leads por fonte
      const sourceCount = new Map();
      const sourceColors = {
        'WhatsApp': '#25D366',
        'Site': '#d3d800',
        'Indicação': '#0088FE',
        'Outros': '#FF8042'
      };

      leadsData?.forEach(lead => {
        const instanceName = lead.whatsapp_instances?.instance_name || 'Outros';
        
        // Categorizar fonte baseada no nome da instância
        let source = 'Outros';
        if (instanceName.toLowerCase().includes('whatsapp') || instanceName.toLowerCase().includes('zap')) {
          source = 'WhatsApp';
        } else if (instanceName.toLowerCase().includes('site') || instanceName.toLowerCase().includes('web')) {
          source = 'Site';
        } else if (instanceName.toLowerCase().includes('indicação') || instanceName.toLowerCase().includes('indica')) {
          source = 'Indicação';
        }

        const count = sourceCount.get(source) || 0;
        sourceCount.set(source, count + 1);
      });

      // Calcular total para percentuais
      const total = Array.from(sourceCount.values()).reduce((sum, count) => sum + count, 0);

      // Mapear dados de fonte
      const mappedData: SourceData[] = Array.from(sourceCount.entries()).map(([source, count]) => ({
        name: source,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        color: sourceColors[source as keyof typeof sourceColors] || '#FF8042'
      }));

      // Ordenar por valor
      mappedData.sort((a, b) => b.value - a.value);

      setSourceData(mappedData);

    } catch (error) {
      console.error("Erro ao carregar dados de fonte:", error);
      setSourceData([]);
    } finally {
      setLoading(false);
    }
  };

  return { sourceData, loading, refresh: loadSourceData };
};
