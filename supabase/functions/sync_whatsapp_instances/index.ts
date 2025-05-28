
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";
import { getCompanyPrefixes, resolveCompanyId } from "./prefixUtils.ts";
import { fetchEvolutionInstances } from "./evolutionApi.ts";
import { insertMissingInstances } from "./dataMapper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  console.log("[SYNC] Função sync_whatsapp_instances iniciada!");

  if (req.method === "OPTIONS") {
    console.log("[SYNC] Preflight OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const prefix = url.searchParams.get("prefix")?.toLowerCase() || null;
  console.log(`[SYNC] Iniciando sync. Prefixo buscado:`, prefix);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const prefixMap = await getCompanyPrefixes(supabase);
    console.log(`[SYNC] Mapeamento de prefixos carregado:`, prefixMap);

    // Buscar nomes já cadastrados
    const { data: existingRecords, error: fetchDbError } = await supabase
      .from("whatsapp_instances")
      .select("instance_name");
    if (fetchDbError) {
      console.error("[SYNC] Erro ao buscar instâncias já cadastradas:", fetchDbError);
      throw fetchDbError;
    }
    const existingNames = new Set<string>(
      (existingRecords || []).map((rec: any) => (rec.instance_name || "").toLowerCase())
    );
    console.log(`[SYNC] Instâncias já cadastradas encontradas:`, Array.from(existingNames));

    // Fetch instances from Evolution API
    const evoInstances = await fetchEvolutionInstances();
    console.log(`[SYNC] Instâncias retornadas da Evolution API:`, evoInstances.length);

    // Insert new evolution instances if needed
    const result = await insertMissingInstances({
      supabase,
      evoInstances,
      prefix,
      prefixMap,
      existingNames,
    });

    console.log("[SYNC] Resultado final do sync:", result);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: corsHeaders,
    });
  } catch (err: any) {
    console.error("[SYNC][ERROR]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unexpected error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
