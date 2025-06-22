
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO: Configuração VPS real com porta 3002
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 30000
};

console.log('[Auto WhatsApp Sync] 🤖 SINCRONIZAÇÃO AUTOMÁTICA E MANUAL DISPONÍVEL');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body para verificar se é chamada manual
    let requestBody: any = {};
    const rawBody = await req.text();
    
    if (rawBody) {
      try {
        requestBody = JSON.parse(rawBody);
      } catch (e) {
        // Se não conseguir parsear, assume que é chamada automática via cron
        console.log('[Auto WhatsApp Sync] 📅 Chamada automática via cron');
      }
    }

    const { action } = requestBody;
    const isManualCall = action === 'sync_all_instances';
    
    console.log(`[Auto WhatsApp Sync] ${isManualCall ? '👤 SINCRONIZAÇÃO MANUAL' : '🤖 SINCRONIZAÇÃO AUTOMÁTICA'} INICIADA`);

    // Executar sincronização global completa
    const result = await syncAllInstances(supabase);

    if (isManualCall) {
      // Para chamadas manuais, retornar resultado detalhado
      return result;
    } else {
      // Para chamadas automáticas (cron), retornar estatísticas
      const resultData = await result.json();
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sincronização automática global executada com sucesso',
          data: resultData,
          summary: {
            sync_type: 'global_complete',
            auto_sync: true,
            execution_time_ms: resultData?.execution_time_ms || 0
          },
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[Auto WhatsApp Sync] ❌ Erro na sincronização:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        sync_type: 'global_complete'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Sincronização global completa de instâncias
 * CORREÇÃO: Usar requisição real para VPS
 */
async function syncAllInstances(supabase: any) {
  const startTime = Date.now();
  
  try {
    console.log('[Sync All] 🌐 INICIANDO SINCRONIZAÇÃO GLOBAL COMPLETA');

    // CORREÇÃO: Buscar instâncias reais da VPS
    const vpsInstances = await getVPSInstances();
    console.log(`[Sync All] 📡 VPS: ${vpsInstances.length} instâncias encontradas`);

    // Buscar instâncias do Supabase
    const { data: supabaseInstances, error: selectError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('connection_type', 'web');

    if (selectError) {
      throw new Error(`Erro ao buscar instâncias do Supabase: ${selectError.message}`);
    }

    console.log(`[Sync All] 🗄️ Supabase: ${supabaseInstances?.length || 0} instâncias encontradas`);

    const results = {
      added: 0,
      updated: 0,
      orphans_linked: 0,
      orphans_deleted: 0,
      preserved_links: 0,
      errors: []
    };

    // Processar cada instância da VPS
    for (const vpsInstance of vpsInstances) {
      try {
        const existingInstance = supabaseInstances?.find(
          (si: any) => si.vps_instance_id === vpsInstance.id || si.instance_name === vpsInstance.name
        );

        if (existingInstance) {
          // Atualizar instância existente
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({
              connection_status: vpsInstance.status || 'unknown',
              web_status: vpsInstance.web_status || vpsInstance.status,
              phone: vpsInstance.phone,
              profile_name: vpsInstance.profile_name,
              qr_code: vpsInstance.qr_code,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingInstance.id);

          if (updateError) {
            results.errors.push(`Erro ao atualizar ${vpsInstance.name}: ${updateError.message}`);
          } else {
            if (existingInstance.created_by_user_id) {
              results.preserved_links++;
            }
            results.updated++;
            console.log(`[Sync All] ✅ Atualizada: ${vpsInstance.name}`);
          }
        } else {
          // Adicionar nova instância órfã
          const { error: insertError } = await supabase
            .from('whatsapp_instances')
            .insert({
              instance_name: vpsInstance.name,
              vps_instance_id: vpsInstance.id,
              connection_type: 'web',
              connection_status: vpsInstance.status || 'unknown',
              web_status: vpsInstance.web_status || vpsInstance.status,
              phone: vpsInstance.phone,
              profile_name: vpsInstance.profile_name,
              qr_code: vpsInstance.qr_code,
              created_by_user_id: null, // Órfã
              company_id: null
            });

          if (insertError) {
            results.errors.push(`Erro ao adicionar ${vpsInstance.name}: ${insertError.message}`);
          } else {
            results.added++;
            console.log(`[Sync All] ➕ Adicionada órfã: ${vpsInstance.name}`);
          }
        }
      } catch (instanceError: any) {
        results.errors.push(`Erro ao processar ${vpsInstance.name}: ${instanceError.message}`);
      }
    }

    // Limpar instâncias órfãs antigas
    if (vpsInstances.length > 0) {
      const vpsInstanceIds = vpsInstances.map(vi => vi.id);
      const { data: orphansToDelete } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, vps_instance_id')
        .eq('connection_type', 'web')
        .is('created_by_user_id', null)
        .not('vps_instance_id', 'in', `(${vpsInstanceIds.join(',')})`);

      for (const orphan of orphansToDelete || []) {
        const { error: deleteError } = await supabase
          .from('whatsapp_instances')
          .delete()
          .eq('id', orphan.id);

        if (!deleteError) {
          results.orphans_deleted++;
          console.log(`[Sync All] 🗑️ Órfã removida: ${orphan.instance_name}`);
        }
      }
    }

    const executionTime = Date.now() - startTime;
    
    console.log(`[Sync All] ✅ SINCRONIZAÇÃO CONCLUÍDA em ${executionTime}ms`);
    console.log(`[Sync All] 📊 Resultados:`, results);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          vps_instances: vpsInstances.length,
          supabase_instances: supabaseInstances?.length || 0
        },
        results,
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error('[Sync All] ❌ Erro na sincronização global:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * CORREÇÃO: Buscar instâncias reais da VPS na porta 3002
 */
async function getVPSInstances() {
  try {
    console.log('[VPS Request] 📡 Buscando instâncias na VPS...');
    
    const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'X-API-Token': VPS_CONFIG.authToken
      },
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    if (!response.ok) {
      console.error(`[VPS Request] ❌ Erro HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    console.log(`[VPS Request] ✅ Resposta recebida:`, data);

    // Adaptar resposta dependendo do formato retornado pela VPS
    const instances = Array.isArray(data) ? data : (data.instances || data.data || []);
    
    return instances.map((instance: any) => ({
      id: instance.id || instance.instanceId || instance.instance_id,
      name: instance.name || instance.instanceName || instance.instance_name,
      status: instance.status || instance.state || 'unknown',
      web_status: instance.web_status || instance.connectionStatus || instance.status,
      phone: instance.phone || instance.phoneNumber,
      profile_name: instance.profile_name || instance.profileName || instance.pushname,
      qr_code: instance.qr_code || instance.qrCode || instance.qr
    }));

  } catch (error: any) {
    console.error('[VPS Request] ❌ Erro ao buscar instâncias da VPS:', error.message);
    return [];
  }
}
