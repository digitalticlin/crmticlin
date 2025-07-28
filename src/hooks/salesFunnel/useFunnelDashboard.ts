
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

    // Consulta: conta leads por etapa para um funil específico
    const { data, error } = await supabase
      .from("leads")
      .select("kanban_stage_id")
      .eq("funnel_id", funnelId);

    if (!error && data) {
      // Conta por etapa manualmente
      const countByStage: Record<string, number> = {};
      data.forEach((row: { kanban_stage_id: string }) => {
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
