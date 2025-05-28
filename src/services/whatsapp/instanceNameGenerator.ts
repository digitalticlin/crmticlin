
import { supabase } from "@/integrations/supabase/client";
import { fetchEvolutionInstanceNames } from "./evolutionApiClient";

/**
 * Generates a unique incremental instance name that doesn't collide with local or Evolution instances
 */
export const generateUniqueInstanceName = async (baseName: string): Promise<string> => {
  const { data: localData } = await supabase.from("whatsapp_instances").select("instance_name");
  const local: string[] = (localData || [])
    .map((row: any) => row.instance_name?.toLowerCase?.() || "")
    .filter(Boolean);

  let evolution: string[] = [];
  try {
    evolution = await fetchEvolutionInstanceNames();
  } catch (err) {
    console.error("Error fetching Evolution instance names:", err);
  }

  let highest = 0;
  let exists = false;
  for (const name of [...local, ...evolution]) {
    if (name === baseName.toLowerCase()) {
      exists = true;
      highest = Math.max(highest, 1);
    } else {
      const regex = new RegExp(`^${baseName.toLowerCase()}(\\d+)$`);
      const match = name.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num)) {
          highest = Math.max(highest, num + 1);
        }
      }
    }
  }
  if (!exists && highest === 0) return baseName;
  return `${baseName}${highest > 0 ? highest : 1}`;
};
