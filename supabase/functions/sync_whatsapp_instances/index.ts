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

    // FETCH correto para Evolution API
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
    const evoInstances: Array<any> = Array.isArray(data) ? data : Array.isArray(data.instances) ? data.instances : [];

    const filteredEvoInstances = prefix
      ? evoInstances.filter(inst => (inst.name || inst.instanceName || "").toLowerCase().startsWith(prefix))
      : evoInstances;

    // Novo: para depuração, logar quantas e exemplos do que veio da Evolution:
    console.log(`[SYNC] Fetched from Evolution: count=${filteredEvoInstances.length}`);
    if (filteredEvoInstances.length) {
      console.log(`[SYNC] First examples:`, filteredEvoInstances.slice(0, 2));
    }

    // Mapear e inserir (apenas os que não existem ainda)
    const inserts = [];
    let skippedNotFound = 0;
    let skippedAlreadyExists = 0;
    let createdCount = 0;
    let errors: any[] = [];

    for (const instRaw of filteredEvoInstances) {
      const instanceName = (instRaw.name || instRaw.instanceName || "").toLowerCase();
      if (!instanceName) {
        console.warn(`[SYNC][skip] Instância sem nome, objeto:`, instRaw);
        continue;
      }
      if (existingNames.has(instanceName)) {
        skippedAlreadyExists++;
        continue;
      }

      // Buscar company_id por prefixo do nome (ex: "digitalticlin-atend" pega "digitalticlin" da tabela companies)
      const company_id = resolveCompanyId(instanceName, prefixMap);
      if (!company_id) {
        console.warn(`[SYNC][skip] Sem company_id correspondente para: ${instanceName}. prefixMap=`, prefixMap);
        skippedNotFound++;
        continue;
      }

      inserts.push({
        company_id,
        instance_name: instanceName,
        phone: instRaw.number || instRaw.phone || null, // pode vir como null da evolution...
        status: instRaw.connectionStatus ? (instRaw.connectionStatus === "open" ? "connected" : "disconnected") : "disconnected",
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
      if (insertErr) {
        errors.push(insertErr);
        console.error("[SYNC][error-insert]", insertErr);
        return new Response(JSON.stringify({ error: insertErr.message || "Error inserting whatsapp_numbers" }), { status: 500, headers: corsHeaders });
      }
      createdCount = inserts.length;
      console.log(`[SYNC] Inseridos:`, inserts.map(i => i.instance_name));
    }

    // Resposta inclui tudo logável → o frontend/usuário pode conferir o que foi feito!
    return new Response(
      JSON.stringify({
        success: true,
        checked: filteredEvoInstances.length,
        already_exists: skippedAlreadyExists,
        company_not_found: skippedNotFound,
        inserted: createdCount,
        details_inserted: inserts.map(i => i.instance_name),
        errors
      }),
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Sync error", err);
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), { status: 500, headers: corsHeaders });
  }
});
