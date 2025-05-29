
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

// Função para mapear status da Evolution API para status do banco
function mapEvolutionStatusToConnectionStatus(evolutionStatus: string): string {
  console.log(`[SYNC] Mapeando status da Evolution: "${evolutionStatus}"`);
  
  // Mapear diferentes possíveis status da Evolution API
  switch (evolutionStatus?.toLowerCase()) {
    case 'open':
    case 'connected':
    case 'ready':
    case 'authenticated':
      return 'open';
    case 'connecting':
    case 'initializing':
    case 'pairing':
      return 'connecting';
    case 'close':
    case 'closed':
    case 'disconnected':
    case 'logout':
    case 'refused':
      return 'closed';
    default:
      console.warn(`[SYNC] Status desconhecido da Evolution API: "${evolutionStatus}" - assumindo 'closed'`);
      return 'closed';
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Função para registrar logs da sincronização
async function logSyncExecution(supabase: any, status: string, result: any, error?: string, executionTime?: number) {
  try {
    await supabase
      .from("sync_logs")
      .insert({
        function_name: "sync_all_whatsapp_instances",
        status,
        execution_time: executionTime ? `${executionTime} milliseconds` : null,
        result: result || null,
        error_message: error || null
      });
  } catch (logError) {
    console.error("[SYNC][LOG ERROR]", logError);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const startTime = Date.now();
  let isAutoSync = false;

  try {
    // Verificar se é uma execução automática
    const body = await req.text();
    if (body) {
      try {
        const parsedBody = JSON.parse(body);
        isAutoSync = parsedBody.auto_sync === true;
      } catch (e) {
        // Ignorar erro de parsing se não for JSON válido
      }
    }

    console.log(`[SYNC] Iniciando sincronização ${isAutoSync ? 'AUTOMÁTICA' : 'MANUAL'} de instâncias WhatsApp`);

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
        let newConnectionStatus = "closed";
        let newPhone = "";
        let rawEvolutionStatus = "";

        // Verificar status da conexão com logging detalhado
        try {
          const statusResponse = await checkInstanceStatus(instanceName, true);
          rawEvolutionStatus = statusResponse?.instance?.state || "unknown";
          
          console.log(`[SYNC][${instanceName}] Status bruto da Evolution API:`, JSON.stringify(statusResponse));
          console.log(`[SYNC][${instanceName}] Status extraído: "${rawEvolutionStatus}"`);
          
          newConnectionStatus = mapEvolutionStatusToConnectionStatus(rawEvolutionStatus);
          console.log(`[SYNC][${instanceName}] Status mapeado: "${newConnectionStatus}"`);
          
        } catch (statusError) {
          console.error(`[SYNC][${instanceName}] Erro ao verificar status:`, statusError);
          // Continue with closed status mas log o erro
          syncResults[instanceName] = { 
            ...syncResults[instanceName], 
            status_check_error: statusError.message 
          };
        }

        // Buscar telefone se conectado ou em processo de conexão
        if (newConnectionStatus === "open") {
          try {
            const deviceInfo = await getDeviceInfo(instanceName);
            newPhone = deviceInfo?.phone?.number || "";
            console.log(`[SYNC][${instanceName}] Device info obtido - telefone: "${newPhone}"`);
          } catch (deviceError) {
            console.warn(`[SYNC][${instanceName}] Erro ao buscar deviceInfo (não crítico):`, deviceError);
            // Não é crítico, continue sem telefone
            syncResults[instanceName] = { 
              ...syncResults[instanceName], 
              device_info_error: deviceError.message 
            };
          }
        }

        // Extrair telefone do ownerJid se não tiver phone
        if (!newPhone && evoInstance.ownerJid) {
          const match = evoInstance.ownerJid.match(/^(\d+)@/);
          newPhone = match ? match[1] : "";
          if (newPhone) {
            console.log(`[SYNC][${instanceName}] Telefone extraído do ownerJid: "${newPhone}"`);
          }
        }

        // Dados para inserir/atualizar
        const instanceData = {
          instance_name: instanceName,
          evolution_instance_name: evoInstance.instanceName || evoInstance.name,
          evolution_instance_id: evoInstance.id,
          phone: newPhone || evoInstance.number || evoInstance.phone || "",
          connection_status: newConnectionStatus,
          owner_jid: evoInstance.ownerJid,
          profile_name: evoInstance.profileName,
          profile_pic_url: evoInstance.profilePicUrl,
          client_name: evoInstance.clientName,
          evolution_token: evoInstance.token,
          date_connected: newConnectionStatus === "open" ? new Date().toISOString() : null,
          date_disconnected: newConnectionStatus === "closed" ? new Date().toISOString() : null,
        };

        console.log(`[SYNC][${instanceName}] Dados a serem salvos:`, JSON.stringify(instanceData, null, 2));

        // Verificar se já existe no banco
        if (dbInstancesMap.has(instanceName)) {
          // Atualizar existente
          const dbInstance = dbInstancesMap.get(instanceName);
          
          console.log(`[SYNC][${instanceName}] ANTES DO UPDATE - Status atual no banco: "${dbInstance.connection_status}"`);
          console.log(`[SYNC][${instanceName}] EXECUTANDO UPDATE para status: "${newConnectionStatus}"`);
          
          const { data: updateResult, error: updateError, count } = await supabase
            .from("whatsapp_instances")
            .update(instanceData)
            .eq("id", dbInstance.id)
            .select();

          console.log(`[SYNC][${instanceName}] Resultado do UPDATE:`, {
            error: updateError,
            count,
            updateResult: updateResult ? JSON.stringify(updateResult) : 'null'
          });

          if (updateError) {
            console.error(`[SYNC][${instanceName}] ERRO CRÍTICO no UPDATE:`, updateError);
            syncResults[instanceName] = { 
              status: "error", 
              action: "update", 
              error: updateError.message,
              raw_evolution_status: rawEvolutionStatus,
              critical_update_error: true
            };
          } else {
            // Verificar se o UPDATE foi efetivamente aplicado
            const { data: verificationData, error: verificationError } = await supabase
              .from("whatsapp_instances")
              .select("connection_status")
              .eq("id", dbInstance.id)
              .single();

            console.log(`[SYNC][${instanceName}] VERIFICAÇÃO PÓS-UPDATE:`, {
              verificationError,
              statusAtualNoBanco: verificationData?.connection_status,
              statusEsperado: newConnectionStatus,
              updateFoiEfetivo: verificationData?.connection_status === newConnectionStatus
            });

            if (verificationError) {
              console.error(`[SYNC][${instanceName}] Erro na verificação pós-UPDATE:`, verificationError);
            }

            if (verificationData?.connection_status !== newConnectionStatus) {
              console.error(`[SYNC][${instanceName}] FALHA: UPDATE não foi efetivo! Status continua "${verificationData?.connection_status}" em vez de "${newConnectionStatus}"`);
              syncResults[instanceName] = { 
                status: "error", 
                action: "update", 
                error: `UPDATE não foi efetivo - status continua ${verificationData?.connection_status}`,
                raw_evolution_status: rawEvolutionStatus,
                previous_status: dbInstance.connection_status,
                expected_status: newConnectionStatus,
                actual_status: verificationData?.connection_status,
                update_failed: true
              };
            } else {
              console.log(`[SYNC][${instanceName}] ✅ UPDATE EFETIVO - Status atualizado com sucesso para "${newConnectionStatus}"`);
              syncResults[instanceName] = { 
                status: "updated", 
                phone: newPhone, 
                connection_status: newConnectionStatus,
                raw_evolution_status: rawEvolutionStatus,
                previous_status: dbInstance.connection_status,
                update_verified: true
              };
            }
          }
        } else {
          // Criar novo - precisamos definir company_id
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
            console.log(`[SYNC][${instanceName}] EXECUTANDO INSERT para nova instância`);
            
            const { data: insertResult, error: insertError } = await supabase
              .from("whatsapp_instances")
              .insert(insertData)
              .select();

            console.log(`[SYNC][${instanceName}] Resultado do INSERT:`, {
              error: insertError,
              insertResult: insertResult ? JSON.stringify(insertResult) : 'null'
            });

            if (insertError) {
              console.error(`[SYNC][${instanceName}] Erro ao inserir:`, insertError);
              syncResults[instanceName] = { 
                status: "error", 
                action: "insert", 
                error: insertError.message,
                raw_evolution_status: rawEvolutionStatus
              };
            } else {
              console.log(`[SYNC][${instanceName}] ✅ Inserido com sucesso`);
              syncResults[instanceName] = { 
                status: "inserted", 
                phone: newPhone, 
                connection_status: newConnectionStatus,
                raw_evolution_status: rawEvolutionStatus
              };
            }
          } else {
            console.warn(`[SYNC][${instanceName}] Company não encontrada para a instância`);
            syncResults[instanceName] = { 
              status: "skipped", 
              reason: "company_not_found",
              raw_evolution_status: rawEvolutionStatus
            };
          }
        }

      } catch (error) {
        console.error(`[SYNC][${instanceName}] Erro durante sincronização:`, error);
        syncResults[instanceName] = { 
          status: "error", 
          action: "sync", 
          error: String(error) 
        };
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

    const executionTime = Date.now() - startTime;
    const summary = {
      updated: Object.values(syncResults).filter(r => r.status === "updated").length,
      inserted: Object.values(syncResults).filter(r => r.status === "inserted").length,
      deleted: Object.values(syncResults).filter(r => r.status === "deleted").length,
      errors: Object.values(syncResults).filter(r => r.status === "error").length,
      skipped: Object.values(syncResults).filter(r => r.status === "skipped").length,
      update_failures: Object.values(syncResults).filter(r => r.update_failed).length,
    };

    const finalResult = {
      success: true,
      auto_sync: isAutoSync,
      execution_time_ms: executionTime,
      total_evolution_instances: evolutionInstances.length,
      total_db_instances_before: dbInstances?.length || 0,
      sync_results: syncResults,
      zombies_removed: zombiesRemoved,
      summary,
      detailed_debug_info: {
        critical_issues: Object.values(syncResults).filter(r => r.critical_update_error || r.update_failed),
        verification_results: Object.values(syncResults).filter(r => r.update_verified !== undefined)
      }
    };

    // Registrar log da execução
    await logSyncExecution(supabase, summary.errors > 0 ? "warning" : "success", finalResult, undefined, executionTime);

    console.log(`[SYNC] Sincronização ${isAutoSync ? 'AUTOMÁTICA' : 'MANUAL'} completa finalizada`);
    console.log(`[SYNC] Instâncias sincronizadas: ${Object.keys(syncResults).length}`);
    console.log(`[SYNC] Instâncias removidas: ${zombiesRemoved.length}`);
    console.log(`[SYNC] Falhas críticas de UPDATE: ${summary.update_failures}`);
    console.log(`[SYNC] Tempo de execução: ${executionTime}ms`);
    console.log(`[SYNC] Resumo detalhado:`, JSON.stringify(summary, null, 2));

    return new Response(
      JSON.stringify(finalResult),
      { headers: corsHeaders }
    );

  } catch (err: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[SYNC][FATAL ERROR] ${isAutoSync ? 'AUTOMÁTICA' : 'MANUAL'}`, err);
    
    // Registrar log do erro
    await logSyncExecution(supabase, "error", null, err.message || "Erro inesperado no sync global.", executionTime);
    
    return new Response(
      JSON.stringify({ 
        error: err.message || "Erro inesperado no sync global.",
        auto_sync: isAutoSync,
        execution_time_ms: executionTime
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
