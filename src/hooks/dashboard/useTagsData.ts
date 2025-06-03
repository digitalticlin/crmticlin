
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "@/hooks/useCompanyData";

export interface TagData {
  name: string;
  value: number;
  color: string;
}

export const useTagsData = (periodDays: string) => {
  const [tagsData, setTagsData] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const { companyId } = useCompanyData();

  useEffect(() => {
    if (companyId) {
      loadTagsData();
    }
  }, [companyId, periodDays]);

  const loadTagsData = async () => {
    try {
      setLoading(true);
      
      const daysAgo = parseInt(periodDays);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Buscar tags com contagem de leads no período
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select(`
          id,
          name,
          color,
          lead_tags!inner(
            lead_id,
            leads!inner(created_at)
          )
        `)
        .eq('company_id', companyId);

      if (tagsError) throw tagsError;

      // Processar dados das tags
      const processedTags: TagData[] = [];

      tagsData?.forEach(tag => {
        // Filtrar leads criados no período
        const leadsInPeriod = tag.lead_tags?.filter(leadTag => {
          const leadCreatedAt = new Date(leadTag.leads.created_at);
          return leadCreatedAt >= startDate;
        }) || [];

        if (leadsInPeriod.length > 0) {
          processedTags.push({
            name: tag.name,
            value: leadsInPeriod.length,
            color: tag.color
          });
        }
      });

      // Ordenar por valor (maior para menor)
      processedTags.sort((a, b) => b.value - a.value);

      // Limitar a 5 tags principais
      setTagsData(processedTags.slice(0, 5));

    } catch (error) {
      console.error("Erro ao carregar dados de tags:", error);
      setTagsData([]);
    } finally {
      setLoading(false);
    }
  };

  return { tagsData, loading, refresh: loadTagsData };
};
