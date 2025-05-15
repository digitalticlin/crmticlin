
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EVOLUTION_API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host";
const EVOLUTION_API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";

/**
 * Find all company prefixes and their IDs
 * Example: { 'digitalticlin': 'uuid...', ... }
 */
async function getCompanyPrefixes(supabase: any): Promise<{ [prefix: string]: string }> {
  const { data, error } = await supabase
    .from("companies")
    .select("id,name");

  if (error) {
    console.error("Error fetching companies:", error);
    return {};
  }

  // For simplicity, assume prefix is first word (can be changed!)
  const mapping: { [prefix: string]: string } = {};
  for (const c of data) {
    if (!c.name) continue;
    const prefix = c.name.split(/[\s\-_]+/)[0].toLowerCase();
    mapping[prefix] = c.id;
  }
  return mapping;
}

/**
 * Given an instance name, try to resolve company_id by prefix.
 */
function resolveCompanyId(instanceName: string, prefixMap: { [prefix: string]: string }): string | null {
  const name = instanceName.toLowerCase();
  // Try exact match, then startsWith match
  for (const prefix in prefixMap) {
    if (name === prefix || name.startsWith(prefix)) {
      return prefixMap[prefix];
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const prefix = url.searchParams.get("prefix")?.toLowerCase() || null;

  // Initiate Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Fetch all companies to build prefix -> company_id mapping
    const prefixMap = await getCompanyPrefixes(supabase);

    // 2. Fetch all existing instance_names from Supabase
    const { data: existingRecords, error: fetchDbError } = await supabase
      .from("whatsapp_numbers")
      .select("instance_name");
    if (fetchDbError) throw fetchDbError;

    const existingNames = new Set<string>(
      (existingRecords || []).map((rec: any) => (rec.instance_name || "").toLowerCase())
    );

    // 3. Fetch all instances from Evolution API
    const evoResp = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: "GET",
      headers: {
        "apikey": EVOLUTION_API_KEY,
        "Content-Type": "application/json"
      }
    });
    if (!evoResp.ok) {
      console.error("Error fetching Evolution instances:", evoResp.status, await evoResp.text());
      return new Response(JSON.stringify({ error: "Failed to fetch from Evolution API" }), { status: 500, headers: corsHeaders });
    }
    const data = await evoResp.json();
    const evoInstances: Array<any> = Array.isArray(data.instances) ? data.instances : [];

    // 4. Optionally filter by prefix (if requested)
    const filteredEvoInstances = prefix
      ? evoInstances.filter(inst => inst.instanceName && inst.instanceName.toLowerCase().startsWith(prefix))
      : evoInstances;

    // 5. For each missing instance, insert in whatsapp_numbers
    const inserts = [];
    let numInserted = 0;
    for (const inst of filteredEvoInstances) {
      const name = (inst.instanceName || "").toLowerCase();
      if (!name) continue;
      if (existingNames.has(name)) continue; // already exists

      const company_id = resolveCompanyId(name, prefixMap);
      if (!company_id) {
        console.warn(`No company_id found for instance ${name}, skipping`);
        continue;
      }
      // Insert with minimal info (can expand!)
      inserts.push({
        company_id,
        instance_name: name,
        phone: inst.phone || null,
        status: "disconnected", // default; can try to map state
        qr_code: null,
        evolution_instance_name: inst.instanceName,
      });
    }
    if (inserts.length > 0) {
      const { error: insertErr } = await supabase
        .from("whatsapp_numbers")
        .insert(inserts);
      if (insertErr) {
        throw insertErr;
      }
      numInserted = inserts.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: filteredEvoInstances.length,
        inserted: numInserted,
        skipped: filteredEvoInstances.length - numInserted,
        details: inserts.map(i => i.instance_name),
      }),
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Sync error", err);
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), { status: 500, headers: corsHeaders });
  }
});

