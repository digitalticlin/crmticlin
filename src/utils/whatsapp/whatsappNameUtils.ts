
import { supabase } from "@/integrations/supabase/client";

// Utility para buscar todos os nomes ocupados no CRM e na Evolution
export const fetchAllWhatsAppInstanceNames = async (): Promise<string[]> => {
  const { data } = await supabase
    .from("whatsapp_numbers")
    .select("instance_name");
  const localNames = (data || []).map((r: any) => (r?.instance_name || "").toLowerCase());

  let evolutionNames: string[] = [];
  try {
    const resp = await fetch("https://ticlin-evolution-api.eirfpl.easypanel.host/instance/fetchInstances", {
      method: "GET",
      headers: {
        "apikey": "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t",
        "Content-Type": "application/json"
      }
    });
    if (resp.ok) {
      const d = await resp.json();
      if (Array.isArray(d.instances)) {
        evolutionNames = d.instances.map((i: any) => (i.instanceName || "").toLowerCase());
      }
    }
  } catch {
    // ignore
  }
  return [...new Set([...localNames, ...evolutionNames])];
};
