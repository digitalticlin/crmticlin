
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
  company_id: string;
}

export function useStageManagement(
  funnelId: string,
  companyId: string,
  limit: number = 7
) {
  const [stages, setStages] = useState<KanbanStage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (funnelId && companyId) loadStages();
    // eslint-disable-next-line
  }, [funnelId, companyId]);

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

  // CREATE
  const addStage = async (title: string, color: string = "#e0e0e0") => {
    if (stages.length >= limit) throw new Error("Limite de etapas atingido.");
    const { data, error } = await supabase
      .from("kanban_stages")
      .insert({
        company_id: companyId,
        funnel_id: funnelId,
        title,
        color,
        is_fixed: false,
        order_position:
          (stages[stages.length - 1]?.order_position || 0) + 1,
      })
      .select()
      .single();
    if (!error && data) {
      setStages((prev) => [...prev, data]);
      await loadStages();
    }
  };

  // UPDATE
  const updateStage = async (stageId: string, updates: Partial<KanbanStage>) => {
    const { data, error } = await supabase
      .from("kanban_stages")
      .update(updates)
      .eq("id", stageId)
      .select()
      .single();
    if (!error && data) {
      setStages((prev) =>
        prev.map((s) => (s.id === stageId ? { ...s, ...updates } : s))
      );
      await loadStages();
    }
  };

  // DELETE
  const removeStage = async (stageId: string) => {
    const { error } = await supabase
      .from("kanban_stages")
      .delete()
      .eq("id", stageId);
    if (!error) {
      setStages((prev) => prev.filter((s) => s.id !== stageId));
      await loadStages();
    }
  };

  return {
    stages,
    loading,
    addStage,
    updateStage,
    removeStage,
    setStages,
    loadStages,
  };
}
