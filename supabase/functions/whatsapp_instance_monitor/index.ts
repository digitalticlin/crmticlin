
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VPS Configuration - MELHORADO com retry
const VPS_CONFIG = {
  host: '31.97.24.222',
  port: '3001',
  baseUrl: 'http://31.97.24.222:3001',
  authToken: 'default-token',
  timeout: 15000,
  retries: 3
};

const getVPSHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
  'User-Agent': 'Supabase-Monitor/2.0',
  'Accept': 'application/json'
});

// Função para buscar instâncias da VPS com retry
async function fetchVPSInstancesWithRetry() {
  let lastError;
  
  for (let attempt = 1; attempt <= VPS_CONFIG.retries; attempt++) {
    try {
      console.log(`[Monitor] 🔍 Tentativa ${attempt}/${VPS_CONFIG.retries} para buscar instâncias da VPS...`);
      
      const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
        method: 'GET',
        headers: getVPSHeaders(),
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });

      if (!response.ok) {
        throw new Error(`VPS responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Monitor] ✅ ${data.instances?.length || 0} instâncias encontradas na VPS (tentativa ${attempt})`);
      
      return data.instances || [];
    } catch (error) {
      console.error(`[Monitor] ❌ Tentativa ${attempt} falhou:`, error);
      lastError = error;
      
      if (attempt < VPS_CONFIG.retries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
        console.log(`[Monitor] ⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`[Monitor] ❌ Todas as ${VPS_CONFIG.retries} tentativas falharam:`, lastError);
  return [];
}

// Função para deletar instância da VPS
async function deleteVPSInstance(instanceId: string) {
  try {
    console.log(`[Monitor] 🗑️ Deletando instância ${instanceId} da VPS...`);
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/delete`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId }),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`[Monitor] ✅ Instância ${instanceId} deletada da VPS`);
      return true;
    } else {
      console.error(`[Monitor] ❌ Erro ao deletar ${instanceId}:`, result.error);
      return false;
    }
  } catch (error) {
    console.error(`[Monitor] ❌ Erro ao deletar instância ${instanceId}:`, error);
    return false;
  }
}

// Função para tentar reativar conexão
async function attemptReconnect(instanceId: string) {
  try {
    console.log(`[Monitor] 🔄 Tentando reativar ${instanceId}...`);
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/status`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId }),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    const result = await response.json();
    
    if (result.success && result.status?.connectionStatus === 'ready') {
      console.log(`[Monitor] ✅ ${instanceId} reativada com sucesso`);
      return true;
    }
    
    console.log(`[Monitor] ⚠️ ${instanceId} não conseguiu reativar`);
    return false;
  } catch (error) {
    console.error(`[Monitor] ❌ Erro ao tentar reativar ${instanceId}:`, error);
    return false;
  }
}

// FUNÇÃO PRINCIPAL DE MONITORAMENTO MELHORADA
async function monitorInstancesImproved(supabase: any) {
  const monitorId = `monitor_${Date.now()}`;
  console.log(`[Monitor] 🚀 Iniciando monitoramento melhorado [${monitorId}]...`);
  
  try {
    // 1. Buscar instâncias da VPS com retry
    const vpsInstances = await fetchVPSInstancesWithRetry();
    const vpsHealthy = vpsInstances.length > 0;
    
    // 2. Buscar instâncias do Supabase
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('connection_type', 'web');

    if (dbError) {
      console.error('[Monitor] ❌ Erro ao buscar instâncias do Supabase:', dbError);
      return { success: false, error: dbError.message };
    }

    console.log(`[Monitor] 📊 VPS: ${vpsInstances.length}, Supabase: ${dbInstances?.length || 0}, VPS Healthy: ${vpsHealthy}`);
    
    const results = {
      monitorId,
      vpsHealthy,
      monitored: vpsInstances.length,
      supabaseInstances: dbInstances?.length || 0,
      orphans_found: 0,
      adopted: 0,
      deleted: 0,
      updated: 0,
      errors: 0,
      actions: []
    };

    // 3. Se VPS não estiver saudável, apenas marcar instâncias como desconectadas
    if (!vpsHealthy) {
      console.log(`[Monitor] ⚠️ VPS não saudável - marcando instâncias como desconectadas`);
      
      for (const dbInstance of dbInstances || []) {
        if (dbInstance.connection_status !== 'disconnected') {
          await supabase
            .from('whatsapp_instances')
            .update({
              connection_status: 'disconnected',
              web_status: 'disconnected',
              date_disconnected: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', dbInstance.id);
            
          results.updated++;
          results.actions.push(`Marcado como desconectado: ${dbInstance.instance_name}`);
        }
      }
      
      return {
        success: true,
        results,
        message: 'Monitoramento concluído em modo degradado (VPS não saudável)',
        timestamp: new Date().toISOString()
      };
    }

    // 4. Identificar instâncias órfãs na VPS
    const orphanInstances = vpsInstances.filter((vpsInstance: any) => 
      !dbInstances?.some(db => db.vps_instance_id === vpsInstance.instanceId)
    );

    results.orphans_found = orphanInstances.length;
    console.log(`[Monitor] 🔍 ${orphanInstances.length} instâncias órfãs encontradas`);
    
    // 5. Processar instâncias órfãs - MELHORADO
    for (const orphan of orphanInstances) {
      console.log(`[Monitor] 🔄 Processando órfã: ${orphan.instanceId} (status: ${orphan.status}, phone: ${orphan.phone || 'N/A'})`);
      
      if (orphan.status === 'open' && orphan.phone) {
        // Tentar vincular pelo telefone a uma empresa existente
        console.log(`[Monitor] 📞 Tentando vincular órfã pelo telefone: ${orphan.phone}`);
        
        // Buscar empresa através de leads com esse telefone
        const { data: existingLead } = await supabase
          .from('leads')
          .select('company_id')
          .eq('phone', orphan.phone)
          .limit(1)
          .single();

        let targetCompanyId = null;

        if (existingLead?.company_id) {
          targetCompanyId = existingLead.company_id;
          console.log(`[Monitor] 🎯 Empresa encontrada via lead: ${targetCompanyId}`);
        } else {
          // Se não encontrou via lead, usar primeira empresa ativa
          const { data: defaultCompany } = await supabase
            .from('companies')
            .select('id')
            .eq('active', true)
            .limit(1)
            .single();
            
          if (defaultCompany) {
            targetCompanyId = defaultCompany.id;
            console.log(`[Monitor] 🏢 Usando empresa padrão: ${targetCompanyId}`);
          }
        }

        if (targetCompanyId) {
          // Adotar instância órfã
          const adoptedInstance = {
            instance_name: `adopted_${orphan.instanceId.slice(-8)}`,
            vps_instance_id: orphan.instanceId,
            connection_type: 'web',
            connection_status: 'ready',
            web_status: 'ready',
            phone: orphan.phone,
            profile_name: orphan.profileName || null,
            server_url: VPS_CONFIG.baseUrl,
            company_id: targetCompanyId,
            date_connected: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: insertError } = await supabase
            .from('whatsapp_instances')
            .insert(adoptedInstance);

          if (!insertError) {
            console.log(`[Monitor] ✅ Órfã ${orphan.instanceId} adotada e vinculada à empresa ${targetCompanyId}`);
            results.adopted++;
            results.actions.push(`Adotado: ${orphan.instanceId} → empresa ${targetCompanyId}`);
          } else {
            console.error(`[Monitor] ❌ Erro ao adotar órfã ${orphan.instanceId}:`, insertError);
            results.errors++;
            results.actions.push(`Erro ao adotar: ${orphan.instanceId} - ${insertError.message}`);
          }
        } else {
          console.log(`[Monitor] ⚠️ Nenhuma empresa encontrada para órfã ${orphan.instanceId}`);
          results.actions.push(`Órfã sem empresa: ${orphan.instanceId}`);
        }
      } else if (orphan.status !== 'open') {
        // Tentar reativar se não estiver conectada
        console.log(`[Monitor] 🔄 Órfã ${orphan.instanceId} não está conectada, tentando reativar...`);
        
        const reactivated = await attemptReconnect(orphan.instanceId);
        
        if (!reactivated) {
          // Se não conseguiu reativar, deletar da VPS para limpeza
          console.log(`[Monitor] 🗑️ Não foi possível reativar ${orphan.instanceId}, deletando para limpeza...`);
          
          const deleted = await deleteVPSInstance(orphan.instanceId);
          
          if (deleted) {
            results.deleted++;
            results.actions.push(`Deletado da VPS: ${orphan.instanceId}`);
            console.log(`[Monitor] ✅ Órfã ${orphan.instanceId} deletada da VPS`);
          } else {
            results.errors++;
            results.actions.push(`Erro ao deletar: ${orphan.instanceId}`);
            console.error(`[Monitor] ❌ Falha ao deletar órfã ${orphan.instanceId}`);
          }
        } else {
          results.actions.push(`Reativado: ${orphan.instanceId}`);
        }
      }
    }

    // 6. Atualizar status das instâncias conhecidas - OTIMIZADO
    for (const dbInstance of dbInstances || []) {
      const vpsInstance = vpsInstances.find((vps: any) => vps.instanceId === dbInstance.vps_instance_id);
      
      if (vpsInstance) {
        // Mapear status VPS para Supabase
        const newConnectionStatus = vpsInstance.status === 'open' ? 'ready' : 'disconnected';
        const newWebStatus = vpsInstance.status === 'open' ? 'ready' : 'disconnected';
        
        // Só atualizar se houve mudança
        if (dbInstance.connection_status !== newConnectionStatus || dbInstance.web_status !== newWebStatus) {
          console.log(`[Monitor] 🔄 Atualizando status ${dbInstance.instance_name}: ${dbInstance.connection_status} -> ${newConnectionStatus}`);
          
          const updateData: any = {
            connection_status: newConnectionStatus,
            web_status: newWebStatus,
            updated_at: new Date().toISOString()
          };
          
          // Atualizar timestamps de conexão/desconexão
          if (newConnectionStatus === 'ready' && !dbInstance.date_connected) {
            updateData.date_connected = new Date().toISOString();
          } else if (newConnectionStatus === 'disconnected') {
            updateData.date_disconnected = new Date().toISOString();
          }
          
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update(updateData)
            .eq('id', dbInstance.id);

          if (!updateError) {
            results.updated++;
            results.actions.push(`Status atualizado: ${dbInstance.instance_name} → ${newConnectionStatus}`);
          } else {
            console.error(`[Monitor] ❌ Erro ao atualizar ${dbInstance.instance_name}:`, updateError);
            results.errors++;
            results.actions.push(`Erro ao atualizar: ${dbInstance.instance_name} - ${updateError.message}`);
          }
        }
      } else if (dbInstance.connection_status !== 'disconnected') {
        // Instância não existe mais na VPS, marcar como desconectada
        console.log(`[Monitor] ⚠️ ${dbInstance.instance_name} não encontrada na VPS, marcando como desconectada`);
        
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({
            connection_status: 'disconnected',
            web_status: 'disconnected',
            date_disconnected: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', dbInstance.id);

        if (!updateError) {
          results.updated++;
          results.actions.push(`Marcado como desconectado: ${dbInstance.instance_name}`);
        } else {
          console.error(`[Monitor] ❌ Erro ao marcar ${dbInstance.instance_name} como desconectada:`, updateError);
          results.errors++;
          results.actions.push(`Erro ao desconectar: ${dbInstance.instance_name} - ${updateError.message}`);
        }
      }
    }

    console.log(`[Monitor] 📊 Resultados do monitoramento [${monitorId}]:`, results);
    
    return {
      success: true,
      results,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`[Monitor] ❌ Erro geral no monitoramento [${monitorId}]:`, error);
    return {
      success: false,
      monitorId,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Monitor] 🔧 WhatsApp Instance Monitor V2 iniciado');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const result = await monitorInstancesImproved(supabase);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: result.success ? 200 : 500
      }
    );

  } catch (error) {
    console.error('[Monitor] ❌ Erro na edge function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});
