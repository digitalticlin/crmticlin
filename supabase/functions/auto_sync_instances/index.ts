
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração VPS corrigida
const VPS_SERVER_URL = 'http://31.97.24.222:3002';
const VPS_AUTH_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const executionId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  console.log(`🔄 [${executionId}] AUTO SYNC INSTANCES - Iniciando`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const syncResults = {
      execution_id: executionId,
      vps_instances: 0,
      db_instances: 0,
      updated_instances: 0,
      new_instances: 0,
      deleted_instances: 0,
      errors: [],
      start_time: new Date().toISOString()
    };

    // 1. Buscar instâncias da VPS
    console.log(`🔍 [${executionId}] Buscando instâncias da VPS...`);
    let vpsInstances = [];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const vpsResponse = await fetch(`${VPS_SERVER_URL}/instances`, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_AUTH_TOKEN}`,
          'X-API-Token': VPS_AUTH_TOKEN
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (vpsResponse.ok) {
        const vpsData = await vpsResponse.json();
        vpsInstances = vpsData.instances || [];
        syncResults.vps_instances = vpsInstances.length;
        console.log(`📡 [${executionId}] VPS: ${vpsInstances.length} instâncias encontradas`);
      } else {
        const errorText = await vpsResponse.text();
        throw new Error(`VPS HTTP ${vpsResponse.status}: ${errorText}`);
      }
    } catch (error) {
      const errorMsg = `VPS Error: ${error.message}`;
      syncResults.errors.push(errorMsg);
      console.error(`❌ [${executionId}] ${errorMsg}`);
    }

    // 2. Buscar instâncias do banco
    console.log(`🔍 [${executionId}] Buscando instâncias do banco...`);
    let dbInstances = [];
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web');

      if (error) throw error;
      
      dbInstances = data || [];
      syncResults.db_instances = dbInstances.length;
      console.log(`💾 [${executionId}] Banco: ${dbInstances.length} instâncias encontradas`);
    } catch (error) {
      const errorMsg = `Database Error: ${error.message}`;
      syncResults.errors.push(errorMsg);
      console.error(`❌ [${executionId}] ${errorMsg}`);
    }

    // 3. Buscar usuário padrão para instâncias órfãs
    let defaultUserId = null;
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (!profilesError && profiles && profiles.length > 0) {
        defaultUserId = profiles[0].id;
        console.log(`👤 [${executionId}] Usuário padrão: ${defaultUserId}`);
      }
    } catch (error) {
      console.error(`⚠️ [${executionId}] Erro ao buscar usuário padrão:`, error);
    }

    // 4. Sincronizar instâncias VPS → Banco
    console.log(`🔄 [${executionId}] Sincronizando VPS → Banco...`);
    
    for (const vpsInstance of vpsInstances) {
      try {
        const vpsId = vpsInstance.instanceId || vpsInstance.id || vpsInstance.sessionId;
        const status = vpsInstance.status || vpsInstance.state || 'unknown';
        const phone = vpsInstance.phone || vpsInstance.number;
        const profileName = vpsInstance.profileName || vpsInstance.profile_name;
        const profilePic = vpsInstance.profilePic || vpsInstance.profile_pic;
        const qrCode = vpsInstance.qrCode || vpsInstance.qr_code;

        console.log(`🔄 [${executionId}] Processando VPS: ${vpsId} (${status})`);

        // Buscar instância correspondente no banco
        const dbInstance = dbInstances.find(db => 
          db.vps_instance_id === vpsId || 
          db.instance_name === vpsId
        );

        if (dbInstance) {
          // Atualizar instância existente
          const updateData = {
            connection_status: status,
            web_status: status,
            server_url: VPS_SERVER_URL,
            updated_at: new Date().toISOString()
          };

          if (phone) updateData.phone = phone;
          if (profileName) updateData.profile_name = profileName;
          if (profilePic) updateData.profile_pic_url = profilePic;
          if (qrCode) updateData.qr_code = qrCode;

          const { error } = await supabase
            .from('whatsapp_instances')
            .update(updateData)
            .eq('id', dbInstance.id);

          if (!error) {
            syncResults.updated_instances++;
            console.log(`✅ [${executionId}] Atualizado: ${vpsId}`);
          } else {
            const errorMsg = `Update Error ${vpsId}: ${error.message}`;
            syncResults.errors.push(errorMsg);
            console.error(`❌ [${executionId}] ${errorMsg}`);
          }
        } else if (defaultUserId) {
          // Criar nova instância órfã
          const insertData = {
            instance_name: vpsId,
            vps_instance_id: vpsId,
            connection_type: 'web',
            connection_status: status,
            web_status: status,
            server_url: VPS_SERVER_URL,
            created_by_user_id: defaultUserId
          };

          if (phone) insertData.phone = phone;
          if (profileName) insertData.profile_name = profileName;
          if (profilePic) insertData.profile_pic_url = profilePic;
          if (qrCode) insertData.qr_code = qrCode;

          const { error } = await supabase
            .from('whatsapp_instances')
            .insert(insertData);

          if (!error) {
            syncResults.new_instances++;
            console.log(`➕ [${executionId}] Criado órfão: ${vpsId}`);
          } else {
            const errorMsg = `Create Error ${vpsId}: ${error.message}`;
            syncResults.errors.push(errorMsg);
            console.error(`❌ [${executionId}] ${errorMsg}`);
          }
        }
      } catch (error) {
        const errorMsg = `Sync Error ${vpsInstance.instanceId || 'unknown'}: ${error.message}`;
        syncResults.errors.push(errorMsg);
        console.error(`❌ [${executionId}] ${errorMsg}`);
      }
    }

    // 5. Identificar instâncias do banco que não existem mais na VPS
    console.log(`🔍 [${executionId}] Verificando instâncias órfãs no banco...`);
    
    const vpsInstanceIds = vpsInstances.map(vps => 
      vps.instanceId || vps.id || vps.sessionId
    ).filter(Boolean);

    const orphanedDbInstances = dbInstances.filter(db => 
      db.vps_instance_id && !vpsInstanceIds.includes(db.vps_instance_id)
    );

    console.log(`🧹 [${executionId}] Encontradas ${orphanedDbInstances.length} instâncias órfãs no banco`);

    // Marcar instâncias órfãs como desconectadas (não deletar automaticamente)
    for (const orphan of orphanedDbInstances) {
      try {
        if (orphan.connection_status !== 'disconnected') {
          const { error } = await supabase
            .from('whatsapp_instances')
            .update({
              connection_status: 'disconnected',
              web_status: 'disconnected',
              date_disconnected: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', orphan.id);

          if (!error) {
            syncResults.updated_instances++;
            console.log(`🔌 [${executionId}] Desconectado órfão: ${orphan.instance_name}`);
          } else {
            const errorMsg = `Disconnect Error ${orphan.instance_name}: ${error.message}`;
            syncResults.errors.push(errorMsg);
            console.error(`❌ [${executionId}] ${errorMsg}`);
          }
        }
      } catch (error) {
        const errorMsg = `Orphan Error ${orphan.instance_name}: ${error.message}`;
        syncResults.errors.push(errorMsg);
        console.error(`❌ [${executionId}] ${errorMsg}`);
      }
    }

    // 6. Registrar resultado final
    syncResults.end_time = new Date().toISOString();
    syncResults.success = syncResults.errors.length === 0;
    
    console.log(`📊 [${executionId}] Sincronização concluída:`, {
      success: syncResults.success,
      vps_instances: syncResults.vps_instances,
      db_instances: syncResults.db_instances,
      updated: syncResults.updated_instances,
      new: syncResults.new_instances,
      errors: syncResults.errors.length
    });

    // Salvar log no banco
    try {
      await supabase
        .from('auto_sync_logs')
        .insert({
          execution_time: new Date().toISOString(),
          status: syncResults.success ? 'success' : 'partial_success',
          instances_found: syncResults.vps_instances,
          instances_added: syncResults.new_instances,
          instances_updated: syncResults.updated_instances,
          errors_count: syncResults.errors.length,
          error_details: syncResults.errors.length > 0 ? { errors: syncResults.errors } : null
        });
    } catch (logError) {
      console.error(`⚠️ [${executionId}] Erro ao salvar log:`, logError);
    }

    return new Response(
      JSON.stringify(syncResults),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error(`❌ [${executionId}] Erro geral:`, error);
    
    const errorResult = {
      success: false,
      error: error.message,
      executionId,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResult),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
