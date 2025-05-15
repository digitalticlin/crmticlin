
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUniqueWhatsAppInstanceName = () => {
  // Busca todos os nomes existentes no CRM (Supabase)
  const fetchLocalInstanceNames = useCallback(async () => {
    const { data } = await supabase
      .from("whatsapp_numbers")
      .select("instance_name");
    return (data || []).map((r: any) => (r?.instance_name || "").toLowerCase());
  }, []);

  // Busca todos os nomes existentes na Evolution API
  const fetchEvolutionInstanceNames = useCallback(async () => {
    try {
      const resp = await fetch("https://ticlin-evolution-api.eirfpl.easypanel.host/instance/fetchInstances", {
        method: "GET",
        headers: {
          "apikey": "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t",
          "Content-Type": "application/json"
        }
      });
      if (!resp.ok) return [];
      const data = await resp.json();
      if (Array.isArray(data.instances)) {
        return data.instances.map((i: any) => (i.instanceName || "").toLowerCase());
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  // Gera o próximo nome incremental disponível, dado um nome base
  const getNextAvailableInstanceName = useCallback(async (baseName: string): Promise<string> => {
    const base = baseName.toLowerCase();
    const localNames = await fetchLocalInstanceNames();
    const evolutionNames = await fetchEvolutionInstanceNames();
    const allNames = [...new Set([...localNames, ...evolutionNames])];
    for (let attempts = 0; attempts < 20; attempts++) {
      const candidate = base + (attempts === 0 ? "" : String(attempts));
      if (!allNames.includes(candidate)) {
        return candidate;
      }
    }
    throw new Error("Não foi possível encontrar um nome de instância disponível.");
  }, [fetchLocalInstanceNames, fetchEvolutionInstanceNames]);

  return { getNextAvailableInstanceName };
};
