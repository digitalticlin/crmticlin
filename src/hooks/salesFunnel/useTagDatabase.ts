
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KanbanTag } from "@/types/kanban";

export function useTagDatabase(companyId: string) {
  const [tags, setTags] = useState<KanbanTag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (companyId) loadTags();
    // eslint-disable-next-line
  }, [companyId]);

  const loadTags = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("company_id", companyId);
    if (!error && data) setTags(data);
    setLoading(false);
  };

  const createTag = async (name: string, color: string) => {
    const { data, error } = await supabase
      .from("tags")
      .insert({ company_id: companyId, name, color })
      .select()
      .single();
    if (!error && data) setTags((prev) => [...prev, data]);
    return data;
  };

  return { tags, loading, createTag, loadTags };
}
