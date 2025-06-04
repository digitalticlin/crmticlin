
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VPS Configuration - BLINDADO (não alterar)
const VPS_CONFIG = {
  host: '31.97.24.222',
  port: '3001',
  baseUrl: 'http://31.97.24.222:3001',
  authToken: 'default-token',
  timeout: 30000
};

const getVPSHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
  'User-Agent': 'Supabase-Monitor/1.0',
  'Accept': 'application/json'
});

// Função para buscar instâncias da VPS
async function fetchVPSInstances() {
  try {
    console.log('[Monitor] 🔍 Buscando instâncias da VPS...');
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: getVPSHeaders(),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    if (!response.ok) {
      throw new Error(`VPS responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Monitor] ✅ ${data.instances?.length || 0} instâncias encontradas na VPS`);
    
    return data.instances || [];
  } catch (error) {
    console.error('[Monitor] ❌ Erro ao buscar instâncias VPS:', error);
    return [];
  }
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

// Função principal de monitoramento
async function monitorInstances(supabase: any) {
  console.log('[Monitor] 🚀 Iniciando monitoramento de instâncias...');
  
  try {
    // 1. Buscar instâncias da VPS
    const vpsInstances = await fetchVPSInstances();
    
    // 2. Buscar instâncias do Supabase
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('connection_type', 'web');

    if (dbError) {
      console.error('[Monitor] ❌ Erro ao buscar instâncias do Supabase:', dbError);
      return { success: false, error: dbError.message };
    }

    console.log(`[Monitor] 📊 VPS: ${vpsInstances.length}, Supabase: ${dbInstances?.length || 0}`);
    
    // 3. Identificar instâncias órfãs na VPS
    const orphanInstances = vpsInstances.filter((vpsInstance: any) => 
      !dbInstances?.some(db => db.vps_instance_id === vpsInstance.instanceId)
    );

    console.log(`[Monitor] 🔍 ${orphanInstances.length} instâncias órfãs encontradas`);
    
    const results = {
      monitored: vpsInstances.length,
      orphans_found: orphanInstances.length,
      adopted: 0,
      deleted: 0,
      errors: 0
    };

    // 4. Processar instâncias órfãs
    for (const orphan of orphanInstances) {
      console.log(`[Monitor] 🔄 Processando órfã: ${orphan.instanceId} (status: ${orphan.status})`);
      
      if (orphan.status === 'open' && orphan.phone) {
        // Tentar vincular pelo telefone
        console.log(`[Monitor] 📞 Tentando vincular órfã pelo telefone: ${orphan.phone}`);
        
        const { data: existingLead } = await supabase
          .from('leads')
          .select('company_id')
          .eq('phone', orphan.phone)
          .limit(1)
          .single();

        if (existingLead?.company_id) {
          // Adotar instância órfã
          const adoptedInstance = {
            instance_name: `adopted_${orphan.instanceId.slice(-8)}`,
            vps_instance_id: orphan.instanceId,
            connection_type: 'web',
            connection_status: 'open',
            web_status: 'ready',
            phone: orphan.phone,
            profile_name: orphan.profileName || null,
            server_url: VPS_CONFIG.baseUrl,
            company_id: existingLead.company_id,
            date_connected: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: insertError } = await supabase
            .from('whatsapp_instances')
            .insert(adoptedInstance);

          if (!insertError) {
            console.log(`[Monitor] ✅ Órfã ${orphan.instanceId} adotada e vinculada à empresa ${existingLead.company_id}`);
            results.adopted++;
          } else {
            console.error(`[Monitor] ❌ Erro ao adotar órfã ${orphan.instanceId}:`, insertError);
            results.errors++;
          }
        } else {
          console.log(`[Monitor] ⚠️ Telefone ${orphan.phone} não encontrado nos leads`);
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
            console.log(`[Monitor] ✅ Órfã ${orphan.instanceId} deletada da VPS`);
          } else {
            results.errors++;
            console.error(`[Monitor] ❌ Falha ao deletar órfã ${orphan.instanceId}`);
          }
        }
      }
    }

    // 5. Atualizar status das instâncias conhecidas
    for (const dbInstance of dbInstances || []) {
      const vpsInstance = vpsInstances.find((vps: any) => vps.instanceId === dbInstance.vps_instance_id);
      
      if (vpsInstance) {
        // Atualizar status se diferente
        const newStatus = vpsInstance.status === 'open' ? 'open' : 'disconnected';
        const newWebStatus = vpsInstance.status === 'open' ? 'ready' : 'disconnected';
        
        if (dbInstance.connection_status !== newStatus || dbInstance.web_status !== newWebStatus) {
          console.log(`[Monitor] 🔄 Atualizando status ${dbInstance.instance_name}: ${dbInstance.connection_status} -> ${newStatus}`);
          
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({
              connection_status: newStatus,
              web_status: newWebStatus,
              updated_at: new Date().toISOString(),
              ...(newStatus === 'open' && !dbInstance.date_connected ? { date_connected: new Date().toISOString() } : {}),
              ...(newStatus === 'disconnected' ? { date_disconnected: new Date().toISOString() } : {})
            })
            .eq('id', dbInstance.id);

          if (updateError) {
            console.error(`[Monitor] ❌ Erro ao atualizar ${dbInstance.instance_name}:`, updateError);
            results.errors++;
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

        if (updateError) {
          console.error(`[Monitor] ❌ Erro ao marcar ${dbInstance.instance_name} como desconectada:`, updateError);
          results.errors++;
        }
      }
    }

    console.log('[Monitor] 📊 Resultados do monitoramento:', results);
    
    return {
      success: true,
      results,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Monitor] ❌ Erro geral no monitoramento:', error);
    return {
      success: false,
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
    console.log('[Monitor] 🔧 WhatsApp Instance Monitor iniciado');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const result = await monitorInstances(supabase);

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
