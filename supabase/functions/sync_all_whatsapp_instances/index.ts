import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";

// ===== Definições diretas Evolution API =====
const EVOLUTION_API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";
const EVOLUTION_API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host";

// Consulta status da instância na Evolution API
async function checkInstanceStatus(instanceName: string, detailed = false) {
  // /instance/connectionState ou /instance/fetchInstances
  const url = `${EVOLUTION_API_URL}/instance/connectionState/${encodeURIComponent(instanceName)}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: { "API-KEY": EVOLUTION_API_KEY }
  });
  if (!resp.ok) throw new Error(`Evolution API connectionState failed: ${resp.status}`);
  const result = await resp.json();
  // Retorna "open", "connecting", "disconnected", etc.
  if (detailed) return result;
  return result?.instance?.state;
}

// Busca informações do device, incluindo telefone
async function getDeviceInfo(instanceName: string) {
  const url = `${EVOLUTION_API_URL}/instance/deviceInfo/${encodeURIComponent(instanceName)}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: { "API-KEY": EVOLUTION_API_KEY }
  });
  if (!resp.ok) throw new Error(`Evolution API getDeviceInfo failed: ${resp.status}`);
  return await resp.json();
}

// ====== Fim Evolution API helpers ======

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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Buscar todas as instâncias WhatsApp do banco
    const { data: instancesDb, error: loadError } = await supabase
      .from("whatsapp_numbers")
      .select("id, instance_name, evolution_instance_name, status, phone");

    if (loadError) throw loadError;

    const results: Record<string, any> = {};
    for (const instance of instancesDb || []) {
      // Usa sempre evolution_instance_name para integração API
      const evoName = instance.evolution_instance_name || instance.instance_name;
      let newStatus = "disconnected";
      let newPhone = instance.phone;
      let updatedFields: Record<string, any> = {};

      try {
        // Consulta Evolution API para status
        const status = await checkInstanceStatus(evoName, true);
        const statusValue = typeof status === "object" ? status?.instance?.state : status;
        if (statusValue === "open" || statusValue === "connected") {
          newStatus = "connected";
        } else if (statusValue === "connecting") {
          newStatus = "connecting";
        }

        // Se conectado, tenta buscar telefone atualizado
        if (newStatus === "connected") {
          const info = await getDeviceInfo(evoName);
          if (info?.phone?.number && info.phone.number !== instance.phone) {
            newPhone = info.phone.number;
            updatedFields.phone = newPhone;
          }
        }

        // Atualizar evolution_instance_name se faltar
        if (!instance.evolution_instance_name && instance.instance_name) {
          updatedFields.evolution_instance_name = instance.instance_name;
        }

        // Sempre atualiza status, data_connected, data_disconnected
        updatedFields.status = newStatus;
        updatedFields.date_connected = newStatus === "connected" ? new Date().toISOString() : null;
        updatedFields.date_disconnected = newStatus === "disconnected" ? new Date().toISOString() : null;

        // Atualiza no banco apenas se mudou algo relevante
        const { error: updateError } = await supabase
          .from("whatsapp_numbers")
          .update(updatedFields)
          .eq("id", instance.id);

        if (updateError) throw updateError;

        console.log(
          `[SYNC][${instance.id}] Atualizado: status=${newStatus}, phone=${newPhone}, evolution_instance_name=${updatedFields.evolution_instance_name || instance.evolution_instance_name
          }`
        );

        results[instance.id] = { status: newStatus, ok: true, phone: newPhone, evolution_instance_name: updatedFields.evolution_instance_name || instance.evolution_instance_name };
      } catch (e) {
        console.error(`[SYNC][${instance.id}] Falha ao atualizar:`, e);
        results[instance.id] = { status: "error", ok: false, error: String(e) };
      }
    }

    console.log("[SYNC] Fim do ciclo. Resumo das instâncias:", results);

    return new Response(
      JSON.stringify({ success: true, count: instancesDb?.length || 0, results }),
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro inesperado no sync global." }),
      { status: 500, headers: corsHeaders }
    );
  }
});
