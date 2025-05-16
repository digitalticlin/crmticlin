
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Funnel {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  created_at?: string;
}

export function useFunnelManagement(companyId: string) {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (companyId) loadFunnels();
    // eslint-disable-next-line
  }, [companyId]);

  const loadFunnels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("funnels")
      .select("*")
      .eq("company_id", companyId);
    if (!error && data) {
      setFunnels(data);
      if (data.length && !selectedFunnel) setSelectedFunnel(data[0]);
    }
    setLoading(false);
  };

  const createFunnel = async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from("funnels")
      .insert({ company_id: companyId, name, description })
      .select()
      .single();
    if (!error && data) {
      setFunnels((prev) => [...prev, data]);
      setSelectedFunnel(data);
    }
  };

  return { funnels, selectedFunnel, setSelectedFunnel, loading, createFunnel, loadFunnels };
}
