
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CONFIGURAÇÃO CORRIGIDA: Servidor Webhook na porta 3002 com autenticação
const WEBHOOK_SERVER_URL = 'http://31.97.24.222:3002';
const VPS_AUTH_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

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

    // 1. Buscar instâncias do servidor webhook com autenticação correta
    let vpsInstances = [];
    try {
      console.log('[Auto Sync] 🔑 Fazendo requisição autenticada para VPS...');
      
      const vpsResponse = await fetch(`${WEBHOOK_SERVER_URL}/instances`, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_AUTH_TOKEN}`,
          'X-API-Token': VPS_AUTH_TOKEN
        },
        signal: AbortSignal.timeout(15000)
      });

      if (vpsResponse.ok) {
        const vpsData = await vpsResponse.json();
        console.log('[Auto Sync] 📊 Resposta VPS completa:', JSON.stringify(vpsData, null, 2));
        
        vpsInstances = vpsData.instances || [];
        syncResults.vps_instances = vpsInstances.length;
        console.log(`[Auto Sync] 📡 Encontradas ${vpsInstances.length} instâncias na VPS`);
        
        // Log detalhado da estrutura de cada instância
        vpsInstances.forEach((instance, index) => {
          console.log(`[Auto Sync] 🔍 Instância ${index + 1}:`, JSON.stringify(instance, null, 2));
        });
      } else {
        throw new Error(`VPS respondeu com status ${vpsResponse.status}: ${await vpsResponse.text()}`);
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

    // Buscar o primeiro usuário ativo para instâncias órfãs
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

    // 3. Sincronizar status e dados das instâncias
    for (const vpsInstance of vpsInstances) {
      try {
        console.log(`[Auto Sync] 🔄 Processando instância VPS:`, JSON.stringify(vpsInstance, null, 2));
        
        // Mapear campos VPS para campos do banco
        const instanceId = vpsInstance.instanceId || vpsInstance.id || vpsInstance.sessionId;
        const instanceStatus = vpsInstance.status || vpsInstance.state || 'unknown';
        const instancePhone = vpsInstance.phone || vpsInstance.number || vpsInstance.phoneNumber;
        const instanceProfileName = vpsInstance.profileName || vpsInstance.profile_name || vpsInstance.name;
        const instanceProfilePic = vpsInstance.profilePic || vpsInstance.profile_pic || vpsInstance.profilePicUrl;
        const instanceQrCode = vpsInstance.qrCode || vpsInstance.qr_code || vpsInstance.qr;
        
        console.log(`[Auto Sync] 📋 Dados mapeados:`, {
          instanceId,
          instanceStatus,
          instancePhone,
          instanceProfileName,
          instanceProfilePic: instanceProfilePic ? 'Presente' : 'Ausente',
          instanceQrCode: instanceQrCode ? 'Presente' : 'Ausente'
        });

        const dbInstance = dbInstances.find(db => 
          db.vps_instance_id === instanceId || 
          db.instance_name === instanceId
        );
        
        if (dbInstance) {
          // Atualizar instância existente com dados completos
          const updateData = {
            connection_status: instanceStatus,
            updated_at: new Date().toISOString(),
            server_url: WEBHOOK_SERVER_URL
          };

          // Adicionar dados extras se disponíveis
          if (instancePhone) updateData.phone = instancePhone;
          if (instanceProfileName) updateData.profile_name = instanceProfileName;
          if (instanceProfilePic) updateData.profile_pic_url = instanceProfilePic;
          if (instanceQrCode) updateData.qr_code = instanceQrCode;

          console.log(`[Auto Sync] 💾 Atualizando instância ${instanceId} com dados:`, updateData);

          const { error } = await supabase
            .from('whatsapp_instances')
            .update(updateData)
            .eq('id', dbInstance.id);

          if (!error) {
            syncResults.updated_instances++;
            console.log(`[Auto Sync] ✅ Atualizada: ${instanceId} com dados completos`);
          } else {
            console.error(`[Auto Sync] ❌ Erro ao atualizar ${instanceId}:`, error);
            syncResults.errors.push(`Update Error ${instanceId}: ${error.message}`);
          }
        } else {
          // Criar nova instância órfã no banco com dados completos
          if (defaultUserId) {
            const insertData = {
              instance_name: instanceId,
              vps_instance_id: instanceId,
              connection_type: 'web',
              connection_status: instanceStatus,
              created_by_user_id: defaultUserId,
              server_url: WEBHOOK_SERVER_URL
            };

            // Adicionar dados extras se disponíveis
            if (instancePhone) insertData.phone = instancePhone;
            if (instanceProfileName) insertData.profile_name = instanceProfileName;
            if (instanceProfilePic) insertData.profile_pic_url = instanceProfilePic;
            if (instanceQrCode) insertData.qr_code = instanceQrCode;

            console.log(`[Auto Sync] 🆕 Criando nova instância órfã ${instanceId} com dados:`, insertData);

            const { error } = await supabase
              .from('whatsapp_instances')
              .insert(insertData);

            if (!error) {
              syncResults.new_instances++;
              console.log(`[Auto Sync] ➕ Nova instância órfã criada: ${instanceId} com dados completos`);
            } else {
              console.error(`[Auto Sync] ❌ Erro ao criar órfã ${instanceId}:`, error);
              syncResults.errors.push(`Create Error ${instanceId}: ${error.message}`);
            }
          } else {
            console.log(`[Auto Sync] ⚠️ Órfã ignorada (sem usuário padrão): ${instanceId}`);
            syncResults.errors.push(`No default user for orphan: ${instanceId}`);
          }
        }
      } catch (error) {
        syncResults.errors.push(`Sync Error ${vpsInstance.instanceId || 'unknown'}: ${error.message}`);
        console.error(`[Auto Sync] ❌ Erro ao sincronizar ${vpsInstance.instanceId || 'unknown'}:`, error);
      }
    }

    // 4. Log da sincronização com detalhes completos
    const logData = {
      status: syncResults.errors.length === 0 ? 'success' : 'partial',
      instances_found: syncResults.vps_instances,
      instances_updated: syncResults.updated_instances,
      instances_added: syncResults.new_instances,
      errors_count: syncResults.errors.length,
      error_details: syncResults.errors.length > 0 ? { errors: syncResults.errors } : null,
      execution_duration_ms: Date.now()
    };

    console.log('[Auto Sync] 📝 Salvando log da sincronização:', logData);

    await supabase.from('auto_sync_logs').insert(logData);

    const isSuccess = syncResults.errors.length === 0;
    const summary = `Sincronizado: ${syncResults.updated_instances} atualizadas, ${syncResults.new_instances} novas, ${syncResults.errors.length} erros`;

    console.log(`[Auto Sync] ✅ Sincronização concluída: ${summary}`);
    console.log(`[Auto Sync] 🔍 CORREÇÃO APLICADA: Autenticação VPS e captura de dados completos implementada`);

    return new Response(JSON.stringify({
      success: isSuccess,
      syncResults,
      summary,
      server_port: 3002,
      vps_auth: 'enabled',
      data_capture: 'enhanced',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Auto Sync] ❌ Erro geral:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      server_url: WEBHOOK_SERVER_URL,
      vps_auth: 'enabled'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
