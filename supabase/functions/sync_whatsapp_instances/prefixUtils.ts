
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";

/**
 * Maps company name prefixes to IDs.
 */
export async function getCompanyPrefixes(
  supabase: SupabaseClient
): Promise<{ [prefix: string]: string }> {
  const { data, error } = await supabase.from("companies").select("id,name");
  if (error) {
    console.error("Error fetching companies:", error);
    return {};
  }
  const mapping: { [prefix: string]: string } = {};
  for (const c of data ?? []) {
    if (!c.name) continue;
    const prefix = c.name.split(/[\s\-_]+/)[0].toLowerCase();
    mapping[prefix] = c.id;
  }
  return mapping;
}

/**
 * Resolves company_id from instanceName and prefix map.
 */
export function resolveCompanyId(
  instanceName: string,
  prefixMap: { [prefix: string]: string }
): string | null {
  const name = instanceName.toLowerCase();
  for (const prefix in prefixMap) {
    if (name === prefix || name.startsWith(prefix)) {
      return prefixMap[prefix];
    }
  }
  return null;
}
