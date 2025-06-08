
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// NOVA CONFIGURAÇÃO: Servidor Webhook na porta 3002
const WEBHOOK_SERVER_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
  timeout: 30000
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, instanceName, instanceId } = await req.json();

    if (action === 'create_instance') {
      return await createInstanceWithWebhook(supabase, instanceName);
    }

    if (action === 'delete_instance_corrected') {
      return await deleteInstanceCorrected(supabase, instanceId);
    }

    throw new Error('Ação não reconhecida');

  } catch (error) {
    console.error('[Instance Manager] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createInstanceWithWebhook(supabase: any, instanceName: string) {
  console.log(`[Instance Manager] 🚀 Criando instância com webhook: ${instanceName}`);

  try {
    // 1. Gerar sessionName único
    const sessionName = `${instanceName}_${Date.now()}`;
    const vpsInstanceId = `${sessionName}`;

    // 2. Criar instância no banco PRIMEIRO
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: instanceName,
        vps_instance_id: vpsInstanceId,
        connection_type: 'web',
        connection_status: 'initializing',
        created_by_user_id: 'system',
        server_url: WEBHOOK_SERVER_CONFIG.baseUrl
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Erro no banco: ${dbError.message}`);
    }

    console.log(`[Instance Manager] 💾 Instância criada no banco:`, instance.id);

    // 3. Criar instância na VPS com webhook automático
    const vpsResponse = await fetch(`${WEBHOOK_SERVER_CONFIG.baseUrl}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instanceId: vpsInstanceId,
        sessionName: sessionName,
        webhookUrl: WEBHOOK_SERVER_CONFIG.webhookUrl
      }),
      timeout: WEBHOOK_SERVER_CONFIG.timeout
    });

    if (!vpsResponse.ok) {
      throw new Error(`VPS respondeu com status ${vpsResponse.status}`);
    }

    const vpsData = await vpsResponse.json();
    console.log(`[Instance Manager] 📡 Resposta da VPS:`, vpsData);

    // 4. Atualizar status no banco
    await supabase
      .from('whatsapp_instances')
      .update({ 
        connection_status: 'waiting_qr',
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    console.log(`[Instance Manager] ✅ Instância criada com sucesso - Webhook automático ativo`);

    return new Response(JSON.stringify({
      success: true,
      instance: {
        ...instance,
        vps_instance_id: vpsInstanceId,
        webhook_enabled: true,
        server_port: 3002
      },
      message: 'Instância criada com webhook automático'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro na criação:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function deleteInstanceCorrected(supabase: any, instanceId: string) {
  console.log(`[Instance Manager] 🗑️ Deletando instância: ${instanceId}`);

  try {
    // 1. Buscar instância no banco
    const { data: instance, error: findError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (findError || !instance) {
      throw new Error('Instância não encontrada');
    }

    // 2. Deletar da VPS se tiver vps_instance_id
    if (instance.vps_instance_id) {
      try {
        const deleteResponse = await fetch(`${WEBHOOK_SERVER_CONFIG.baseUrl}/instance/${instance.vps_instance_id}`, {
          method: 'DELETE',
          timeout: 15000
        });

        console.log(`[Instance Manager] 📡 Delete VPS status:`, deleteResponse.status);
      } catch (vpsError) {
        console.log(`[Instance Manager] ⚠️ Erro ao deletar da VPS (continuando):`, vpsError.message);
      }
    }

    // 3. Deletar do banco
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar do banco: ${deleteError.message}`);
    }

    console.log(`[Instance Manager] ✅ Instância deletada com sucesso`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Instância deletada com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro ao deletar:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
