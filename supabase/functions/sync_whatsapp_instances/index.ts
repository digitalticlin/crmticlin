
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EVOLUTION_API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host/instance/fetchInstances";
const EVOLUTION_API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";

// Utilitário: mapping de prefixos (nome de empresa -> company_id)
async function getCompanyPrefixes(supabase: any): Promise<{ [prefix: string]: string }> {
  const { data, error } = await supabase
    .from("companies")
    .select("id,name");

  if (error) {
    console.error("Error fetching companies:", error);
    return {};
  }

  const mapping: { [prefix: string]: string } = {};
  for (const c of data) {
    if (!c.name) continue;
    const prefix = c.name.split(/[\s\-_]+/)[0].toLowerCase();
    mapping[prefix] = c.id;
  }
  return mapping;
}

function resolveCompanyId(instanceName: string, prefixMap: { [prefix: string]: string }): string | null {
  const name = instanceName.toLowerCase();
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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const prefixMap = await getCompanyPrefixes(supabase);

    // Buscar nomes já cadastrados
    const { data: existingRecords, error: fetchDbError } = await supabase
      .from("whatsapp_numbers")
      .select("instance_name");
    if (fetchDbError) throw fetchDbError;
    const existingNames = new Set<string>(
      (existingRecords || []).map((rec: any) => (rec.instance_name || "").toLowerCase())
    );

    // FETCH correto para a Evolution API
    const evoResp = await fetch(EVOLUTION_API_URL, {
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
    // Suporte tanto para array brute quanto para objs .instances
    const evoInstances: Array<any> = Array.isArray(data) ? data : Array.isArray(data.instances) ? data.instances : [];

    const filteredEvoInstances = prefix
      ? evoInstances.filter(inst => (inst.name || inst.instanceName || "").toLowerCase().startsWith(prefix))
      : evoInstances;

    // Mapear e inserir (apenas os que não existem ainda)
    const inserts = [];
    let numInserted = 0;
    for (const instRaw of filteredEvoInstances) {
      // Suporte a diversas keys possíveis de nome...
      const instanceName = (instRaw.name || instRaw.instanceName || "").toLowerCase();
      if (!instanceName) continue;
      if (existingNames.has(instanceName)) continue;

      const company_id = resolveCompanyId(instanceName, prefixMap);
      if (!company_id) {
        console.warn(`No company_id found for instance ${instanceName}, skipping`);
        continue;
      }
      inserts.push({
        company_id,
        instance_name: instanceName,
        phone: instRaw.number || instRaw.phone || null,
        status: "disconnected",
        qr_code: null,
        evolution_instance_id: instRaw.id || null,
        evolution_instance_name: instRaw.name || null,
        evolution_token: instRaw.token || null,
        connection_status: instRaw.connectionStatus || null,
        owner_jid: instRaw.ownerJid || null,
        profile_name: instRaw.profileName || null,
        profile_pic_url: instRaw.profilePicUrl || null,
        client_name: instRaw.clientName || null,
      });
    }
    if (inserts.length > 0) {
      const { error: insertErr } = await supabase
        .from("whatsapp_numbers")
        .insert(inserts);
      if (insertErr) throw insertErr;
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

