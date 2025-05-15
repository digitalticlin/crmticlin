
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

    // Fetch instances from Evolution API
    const evoInstances = await fetchEvolutionInstances();

    // Insert new evolution instances if needed
    const result = await insertMissingInstances({
      supabase,
      evoInstances,
      prefix,
      prefixMap,
      existingNames,
    });

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: corsHeaders,
    });
  } catch (err: any) {
    console.error("Sync error", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unexpected error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
