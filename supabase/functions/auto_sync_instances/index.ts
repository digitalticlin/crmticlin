
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CONFIGURAÇÃO ATUALIZADA: Servidor Webhook na porta 3002
const WEBHOOK_SERVER_URL = 'http://31.97.24.222:3002';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Auto Sync] 🔄 Iniciando sincronização automática com servidor webhook...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const syncResults = {
      vps_instances: 0,
      db_instances: 0,
      updated_instances: 0,
      new_instances: 0,
      errors: []
    };

    // 1. Buscar instâncias do servidor webhook (porta 3002)
    let vpsInstances = [];
    try {
      const vpsResponse = await fetch(`${WEBHOOK_SERVER_URL}/instances`, { timeout: 15000 });
      if (vpsResponse.ok) {
        const vpsData = await vpsResponse.json();
        vpsInstances = vpsData.instances || [];
        syncResults.vps_instances = vpsInstances.length;
        console.log(`[Auto Sync] 📡 Encontradas ${vpsInstances.length} instâncias na VPS`);
      } else {
        throw new Error('Servidor webhook não responde');
      }
    } catch (error) {
      syncResults.errors.push(`VPS Error: ${error.message}`);
      console.error('[Auto Sync] ❌ Erro ao buscar instâncias da VPS:', error);
    }

    // 2. Buscar instâncias do banco
    let dbInstances = [];
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web');

      if (error) throw error;
      
      dbInstances = data || [];
      syncResults.db_instances = dbInstances.length;
      console.log(`[Auto Sync] 💾 Encontradas ${dbInstances.length} instâncias no banco`);
    } catch (error) {
      syncResults.errors.push(`Database Error: ${error.message}`);
      console.error('[Auto Sync] ❌ Erro ao buscar instâncias do banco:', error);
    }

    // CORREÇÃO: Buscar o primeiro usuário ativo para instâncias órfãs
    let defaultUserId = null;
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (profilesError) {
        console.error('[Auto Sync] ⚠️ Erro ao buscar usuário padrão:', profilesError);
      } else if (profiles && profiles.length > 0) {
        defaultUserId = profiles[0].id;
        console.log(`[Auto Sync] 👤 Usuário padrão encontrado para órfãs: ${defaultUserId}`);
      }
    } catch (error) {
      console.error('[Auto Sync] ⚠️ Erro ao buscar usuário padrão:', error);
    }

    // 3. Sincronizar status das instâncias existentes
    for (const vpsInstance of vpsInstances) {
      try {
        const dbInstance = dbInstances.find(db => db.vps_instance_id === vpsInstance.instanceId);
        
        if (dbInstance) {
          // Atualizar instância existente se status mudou
          if (dbInstance.connection_status !== vpsInstance.status) {
            const { error } = await supabase
              .from('whatsapp_instances')
              .update({
                connection_status: vpsInstance.status,
                updated_at: new Date().toISOString(),
                server_url: WEBHOOK_SERVER_URL
              })
              .eq('id', dbInstance.id);

            if (!error) {
              syncResults.updated_instances++;
              console.log(`[Auto Sync] 🔄 Atualizada: ${vpsInstance.instanceId}`);
            }
          }
        } else {
          // CORREÇÃO: Criar nova instância no banco com UUID válido
          if (defaultUserId) {
            const { error } = await supabase
              .from('whatsapp_instances')
              .insert({
                instance_name: vpsInstance.instanceId,
                vps_instance_id: vpsInstance.instanceId,
                connection_type: 'web',
                connection_status: vpsInstance.status,
                created_by_user_id: defaultUserId, // UUID válido em vez de 'auto_sync'
                server_url: WEBHOOK_SERVER_URL
              });

            if (!error) {
              syncResults.new_instances++;
              console.log(`[Auto Sync] ➕ Nova instância órfã: ${vpsInstance.instanceId}`);
            } else {
              console.error(`[Auto Sync] ❌ Erro ao criar órfã ${vpsInstance.instanceId}:`, error);
              syncResults.errors.push(`Create Error ${vpsInstance.instanceId}: ${error.message}`);
            }
          } else {
            console.log(`[Auto Sync] ⚠️ Órfã ignorada (sem usuário padrão): ${vpsInstance.instanceId}`);
            syncResults.errors.push(`No default user for orphan: ${vpsInstance.instanceId}`);
          }
        }
      } catch (error) {
        syncResults.errors.push(`Sync Error ${vpsInstance.instanceId}: ${error.message}`);
        console.error(`[Auto Sync] ❌ Erro ao sincronizar ${vpsInstance.instanceId}:`, error);
      }
    }

    // 4. Log da sincronização
    await supabase.from('auto_sync_logs').insert({
      status: syncResults.errors.length === 0 ? 'success' : 'partial',
      instances_found: syncResults.vps_instances,
      instances_updated: syncResults.updated_instances,
      instances_added: syncResults.new_instances,
      errors_count: syncResults.errors.length,
      error_details: syncResults.errors.length > 0 ? { errors: syncResults.errors } : null,
      execution_duration_ms: Date.now()
    });

    const isSuccess = syncResults.errors.length === 0;
    const summary = `Sincronizado: ${syncResults.updated_instances} atualizadas, ${syncResults.new_instances} novas, ${syncResults.errors.length} erros`;

    console.log(`[Auto Sync] ✅ Sincronização concluída: ${summary}`);

    return new Response(JSON.stringify({
      success: isSuccess,
      syncResults,
      summary,
      server_port: 3002,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Auto Sync] ❌ Erro geral:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      server_url: WEBHOOK_SERVER_URL
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
