
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFunnelDashboard(funnelId: string) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (funnelId) loadReport();
    // eslint-disable-next-line
  }, [funnelId]);

  const loadReport = async () => {
    setLoading(true);
    // Quantos leads por etapa, ganhos, perdidos etc
    const { data, error } = await supabase
      .from("leads")
      .select("kanban_stage_id, count:id")
      .eq("funnel_id", funnelId)
      .group("kanban_stage_id");
    if (!error && data) setReport(data);
    setLoading(false);
  };

  return { report, loading, loadReport };
}
