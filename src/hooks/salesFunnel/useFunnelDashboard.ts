
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Retorna um relatório resumido por etapa para um funil.
 *
 * Estrutura retornada: [{ kanban_stage_id: string, count: number }]
 */
export function useFunnelDashboard(funnelId: string) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (funnelId) loadReport();
    // eslint-disable-next-line
  }, [funnelId]);

  const loadReport = async () => {
    setLoading(true);

    // Consulta paginada: conta leads por etapa para um funil específico (evita corte em 1000)
    const PAGE_SIZE = 1000;
    let all: { kanban_stage_id: string }[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("leads")
        .select("kanban_stage_id")
        .eq("funnel_id", funnelId)
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) break;
      all = all.concat(data || []);
      if (!data || data.length < PAGE_SIZE) break;
    }

    if (all.length) {
      // Conta por etapa manualmente
      const countByStage: Record<string, number> = {};
      all.forEach((row: { kanban_stage_id: string }) => {
        if (row.kanban_stage_id)
          countByStage[row.kanban_stage_id] = (countByStage[row.kanban_stage_id] || 0) + 1;
      });
      const reportArr = Object.entries(countByStage).map(([kanban_stage_id, count]) => ({
        kanban_stage_id,
        count
      }));
      setReport(reportArr);
    } else {
      setReport([]);
    }
    setLoading(false);
  };

  return { report, loading, loadReport };
}
