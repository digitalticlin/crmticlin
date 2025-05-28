
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";

// ===== Definições diretas Evolution API =====
const EVOLUTION_API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";
const EVOLUTION_API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host";

// Consulta status da instância na Evolution API
async function checkInstanceStatus(instanceName: string, detailed = false) {
  const url = `${EVOLUTION_API_URL}/instance/connectionState/${encodeURIComponent(instanceName)}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: { 
      "apikey": EVOLUTION_API_KEY,
      "Content-Type": "application/json"
    }
  });
  if (!resp.ok) throw new Error(`Evolution API connectionState failed: ${resp.status}`);
  const result = await resp.json();
  if (detailed) return result;
  return result?.instance?.state;
}

// Busca informações do device, incluindo telefone
async function getDeviceInfo(instanceName: string) {
  const url = `${EVOLUTION_API_URL}/instance/deviceInfo/${encodeURIComponent(instanceName)}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: { 
      "apikey": EVOLUTION_API_KEY,
      "Content-Type": "application/json"
    }
  });
  if (!resp.ok) throw new Error(`Evolution API getDeviceInfo failed: ${resp.status}`);
  return await resp.json();
}

// Busca todas as instâncias da Evolution API
async function fetchAllEvolutionInstances() {
  const url = `${EVOLUTION_API_URL}/instance/fetchInstances`;
  const resp = await fetch(url, {
    method: "GET",
    headers: { 
      "apikey": EVOLUTION_API_KEY,
      "Content-Type": "application/json"
    }
  });
  if (!resp.ok) throw new Error(`Evolution API fetchInstances failed: ${resp.status}`);
  const data = await resp.json();
  
  // Normaliza formato: array ou objeto com "instances"
  return Array.isArray(data)
    ? data
    : Array.isArray(data.instances)
      ? data.instances
      : [];
}

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
    console.log("[SYNC] Iniciando sincronização completa de instâncias WhatsApp");

    // 1. Buscar TODAS as instâncias da Evolution API (source of truth)
    const evolutionInstances = await fetchAllEvolutionInstances();
    console.log(`[SYNC] Encontradas ${evolutionInstances.length} instâncias na Evolution API`);

    // 2. Buscar todas as instâncias do banco de dados atual
    const { data: dbInstances, error: loadError } = await supabase
      .from("whatsapp_instances")
      .select("*");

    if (loadError) throw loadError;

    console.log(`[SYNC] Encontradas ${dbInstances?.length || 0} instâncias no banco de dados`);

    // 3. Criar mapa das instâncias da Evolution por nome
    const evolutionInstancesMap = new Map();
    const evolutionNamesSet = new Set();
    
    evolutionInstances.forEach(evoInstance => {
      const instanceName = (evoInstance.instanceName || evoInstance.name || "").toLowerCase();
      if (instanceName) {
        evolutionInstancesMap.set(instanceName, evoInstance);
        evolutionNamesSet.add(instanceName);
      }
    });

    console.log(`[SYNC] Instâncias válidas na Evolution: ${Array.from(evolutionNamesSet).join(', ')}`);

    // 4. Sincronizar/atualizar instâncias existentes no banco
    const syncResults: Record<string, any> = {};
    const dbInstancesMap = new Map();
    
    // Criar mapa das instâncias do banco
    (dbInstances || []).forEach(dbInstance => {
      const instanceName = (dbInstance.evolution_instance_name || dbInstance.instance_name || "").toLowerCase();
      if (instanceName) {
        dbInstancesMap.set(instanceName, dbInstance);
      }
    });

    // Sincronizar cada instância da Evolution
    for (const [instanceName, evoInstance] of evolutionInstancesMap) {
      try {
        let newStatus = "disconnected";
        let newPhone = "";

        // Verificar status da conexão
        try {
          const status = await checkInstanceStatus(instanceName, true);
          const statusValue = typeof status === "object" ? status?.instance?.state : status;
          
          if (statusValue === "open" || statusValue === "connected") {
            newStatus = "connected";
          } else if (statusValue === "connecting") {
            newStatus = "connecting";
          }
        } catch (statusError) {
          console.warn(`[SYNC][${instanceName}] Erro ao verificar status:`, statusError);
          // Continue with disconnected status
        }

        // Buscar telefone se conectado
        if (newStatus === "connected") {
          try {
            const deviceInfo = await getDeviceInfo(instanceName);
            newPhone = deviceInfo?.phone?.number || "";
          } catch (error) {
            console.warn(`[SYNC][${instanceName}] Erro ao buscar deviceInfo:`, error);
          }
        }

        // Extrair telefone do ownerJid se não tiver phone
        if (!newPhone && evoInstance.ownerJid) {
          const match = evoInstance.ownerJid.match(/^(\d+)@/);
          newPhone = match ? match[1] : "";
        }

        // Dados para inserir/atualizar
        const instanceData = {
          instance_name: instanceName,
          evolution_instance_name: evoInstance.instanceName || evoInstance.name,
          evolution_instance_id: evoInstance.id,
          phone: newPhone || evoInstance.number || evoInstance.phone || "",
          status: newStatus,
          connection_status: evoInstance.connectionStatus,
          owner_jid: evoInstance.ownerJid,
          profile_name: evoInstance.profileName,
          profile_pic_url: evoInstance.profilePicUrl,
          client_name: evoInstance.clientName,
          evolution_token: evoInstance.token,
          date_connected: newStatus === "connected" ? new Date().toISOString() : null,
          date_disconnected: newStatus === "disconnected" ? new Date().toISOString() : null,
        };

        // Verificar se já existe no banco
        if (dbInstancesMap.has(instanceName)) {
          // Atualizar existente
          const dbInstance = dbInstancesMap.get(instanceName);
          const { error: updateError } = await supabase
            .from("whatsapp_instances")
            .update(instanceData)
            .eq("id", dbInstance.id);

          if (updateError) {
            console.error(`[SYNC][${instanceName}] Erro ao atualizar:`, updateError);
            syncResults[instanceName] = { status: "error", action: "update", error: updateError.message };
          } else {
            console.log(`[SYNC][${instanceName}] Atualizado com sucesso`);
            syncResults[instanceName] = { status: "updated", phone: newPhone, connection_status: newStatus };
          }
        } else {
          // Criar novo - precisamos definir company_id
          // Vamos usar uma lógica para determinar o company_id baseado no nome da instância
          let companyId = null;
          
          // Buscar company_id baseado no prefixo do nome da instância
          const { data: companies } = await supabase.from("companies").select("id, name");
          if (companies) {
            for (const company of companies) {
              if (company.name) {
                const prefix = company.name.split(/[\s\-_]+/)[0].toLowerCase();
                if (instanceName.startsWith(prefix)) {
                  companyId = company.id;
                  break;
                }
              }
            }
          }

          if (companyId) {
            const insertData = { ...instanceData, company_id: companyId };
            const { error: insertError } = await supabase
              .from("whatsapp_instances")
              .insert(insertData);

            if (insertError) {
              console.error(`[SYNC][${instanceName}] Erro ao inserir:`, insertError);
              syncResults[instanceName] = { status: "error", action: "insert", error: insertError.message };
            } else {
              console.log(`[SYNC][${instanceName}] Inserido com sucesso`);
              syncResults[instanceName] = { status: "inserted", phone: newPhone, connection_status: newStatus };
            }
          } else {
            console.warn(`[SYNC][${instanceName}] Company não encontrada para a instância`);
            syncResults[instanceName] = { status: "skipped", reason: "company_not_found" };
          }
        }

      } catch (error) {
        console.error(`[SYNC][${instanceName}] Erro durante sincronização:`, error);
        syncResults[instanceName] = { status: "error", action: "sync", error: String(error) };
      }
    }

    // 5. Remover instâncias "zumbi" que não existem mais na Evolution
    const zombieInstances = (dbInstances || []).filter(dbInstance => {
      const instanceName = (dbInstance.evolution_instance_name || dbInstance.instance_name || "").toLowerCase();
      return instanceName && !evolutionNamesSet.has(instanceName);
    });

    const zombiesRemoved: string[] = [];
    for (const zombie of zombieInstances) {
      const instanceName = zombie.evolution_instance_name || zombie.instance_name;
      const { error: deleteError } = await supabase
        .from("whatsapp_instances")
        .delete()
        .eq("id", zombie.id);

      if (deleteError) {
        console.error(`[SYNC][${instanceName}] Erro ao remover instância zumbi:`, deleteError);
        syncResults[instanceName] = { status: "error", action: "delete", error: deleteError.message };
      } else {
        zombiesRemoved.push(instanceName);
        console.log(`[SYNC][${instanceName}] Instância zumbi removida com sucesso`);
        syncResults[instanceName] = { status: "deleted", reason: "not_in_evolution" };
      }
    }

    console.log("[SYNC] Sincronização completa finalizada");
    console.log(`[SYNC] Instâncias sincronizadas: ${Object.keys(syncResults).length}`);
    console.log(`[SYNC] Instâncias removidas: ${zombiesRemoved.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        total_evolution_instances: evolutionInstances.length,
        total_db_instances_before: dbInstances?.length || 0,
        sync_results: syncResults,
        zombies_removed: zombiesRemoved,
        summary: {
          updated: Object.values(syncResults).filter(r => r.status === "updated").length,
          inserted: Object.values(syncResults).filter(r => r.status === "inserted").length,
          deleted: Object.values(syncResults).filter(r => r.status === "deleted").length,
          errors: Object.values(syncResults).filter(r => r.status === "error").length,
          skipped: Object.values(syncResults).filter(r => r.status === "skipped").length,
        }
      }),
      { headers: corsHeaders }
    );

  } catch (err: any) {
    console.error("[SYNC][FATAL ERROR]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro inesperado no sync global." }),
      { status: 500, headers: corsHeaders }
    );
  }
});
