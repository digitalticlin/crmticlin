
import { supabase } from "@/integrations/supabase/client";

/**
 * Recupera nomes já existentes no Supabase (CRM).
 */
export async function fetchLocalInstanceNames(): Promise<string[]> {
  const { data } = await supabase.from("whatsapp_numbers").select("instance_name");
  return (data || []).map((r: any) => (r?.instance_name || "").toLowerCase());
}

/**
 * Recupera nomes existentes na Evolution API.
 */
export async function fetchEvolutionInstanceNames(): Promise<string[]> {
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
}

/**
 * Gera próximo nome incremental disponível baseado nos já existentes e baseName.
 */
export async function getNextAvailableInstanceName(baseName: string, maxAttempts = 20): Promise<string> {
  const base = baseName.toLowerCase();
  const localNames = await fetchLocalInstanceNames();
  const evolutionNames = await fetchEvolutionInstanceNames();
  const allNames = [...new Set([...localNames, ...evolutionNames])];
  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const candidate = base + (attempts === 0 ? "" : String(attempts));
    if (!allNames.includes(candidate)) {
      return candidate;
    }
  }
  throw new Error("Não foi possível encontrar um nome de instância disponível.");
}
