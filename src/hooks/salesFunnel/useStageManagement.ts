
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface KanbanStage {
  id: string;
  title: string;
  color?: string;
  is_fixed?: boolean;
  is_won?: boolean;
  is_lost?: boolean;
  order_position: number;
  funnel_id: string;
}

export function useStageManagement(funnelId: string, limit: number = 7) {
  const [stages, setStages] = useState<KanbanStage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (funnelId) loadStages();
    // eslint-disable-next-line
  }, [funnelId]);

  const loadStages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kanban_stages")
      .select("*")
      .eq("funnel_id", funnelId)
      .order("order_position", { ascending: true });
    if (!error && data) setStages(data);
    setLoading(false);
  };

  const addStage = async (title: string, color?: string) => {
    if (stages.length >= limit) throw new Error("Limite de etapas atingido.");
    const { data, error } = await supabase
      .from("kanban_stages")
      .insert({
        funnel_id: funnelId,
        title,
        color,
        is_fixed: false,
        order_position: (stages[stages.length - 1]?.order_position || 0) + 1,
      })
      .select()
      .single();
    if (!error && data) setStages((prev) => [...prev, data]);
  };

  // ...funções para editar/remover etapas

  return { stages, loading, addStage, setStages, loadStages };
}
