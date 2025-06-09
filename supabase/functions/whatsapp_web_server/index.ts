
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, instanceData } = await req.json();

    console.log(`[WhatsApp Web Server] 📥 Action: ${action}`);

    switch (action) {
      case 'create_instance_v3':
        return await createInstanceV3(supabase, instanceData);
      case 'get_qr_code_v3_async':
        return await getQRCodeV3Async(supabase, instanceData);
      case 'create_instance_v2':
        return await createInstanceV2(supabase, instanceData);
      case 'get_qr_code_v2_async':
        return await getQRCodeV2Async(supabase, instanceData);
      case 'regenerate_qr_code_v2':
        return await regenerateQRCodeV2(supabase, instanceData);
      case 'configure_webhook_v2':
        return await configureWebhookV2(supabase, instanceData);
      default:
        throw new Error(`Ação não reconhecida: ${action}`);
    }

  } catch (error) {
    console.error('[WhatsApp Web Server] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createInstanceV3(supabase: any, instanceData: any) {
  console.log(`[WhatsApp Web Server] 🚀 Criando instância V3: ${instanceData.instanceName}`);

  try {
    const sessionName = `${instanceData.instanceName}_${Date.now()}`;
    const vpsInstanceId = sessionName;

    // 1. Criar instância no banco
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: instanceData.instanceName,
        vps_instance_id: vpsInstanceId,
        connection_type: 'web',
        connection_status: 'initializing',
        created_by_user_id: 'system',
        server_url: WEBHOOK_SERVER_URL,
        company_id: instanceData.companyId
      })
      .select()
      .single();

    if (dbError) throw new Error(`Erro no banco: ${dbError.message}`);

    // 2. Criar instância na VPS (porta 3002)
    const vpsResponse = await fetch(`${WEBHOOK_SERVER_URL}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instanceId: vpsInstanceId,
        sessionName: sessionName,
        webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
      }),
      timeout: 30000
    });

    if (!vpsResponse.ok) {
      throw new Error(`VPS respondeu com status ${vpsResponse.status}`);
    }

    const vpsData = await vpsResponse.json();
    console.log(`[WhatsApp Web Server] ✅ Instância V3 criada com webhook automático`);

    // 3. Atualizar status
    await supabase
      .from('whatsapp_instances')
      .update({ 
        connection_status: 'waiting_qr',
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    return new Response(JSON.stringify({
      success: true,
      instance: {
        ...instance,
        webhook_enabled: true,
        server_port: 3002
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[WhatsApp Web Server] ❌ Erro V3:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getQRCodeV3Async(supabase: any, instanceData: any) {
  try {
    console.log(`[WhatsApp Web Server] 📱 Buscando QR Code V3: ${instanceData.instanceId}`);

    // 1. Buscar instância no banco
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceData.instanceId)
      .single();

    if (dbError || !instance) {
      throw new Error('Instância não encontrada');
    }

    // 2. Se já tem QR no banco
    if (instance.qr_code && instance.connection_status === 'waiting_qr') {
      return new Response(JSON.stringify({
        success: true,
        qrCode: instance.qr_code,
        source: 'database',
        normalized: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Buscar QR na VPS (porta 3002)
    if (instance.vps_instance_id) {
      const vpsResponse = await fetch(`${WEBHOOK_SERVER_URL}/instance/${instance.vps_instance_id}/qr`, {
        timeout: 10000
      });

      if (vpsResponse.ok) {
        const vpsData = await vpsResponse.json();
        
        if (vpsData.success && vpsData.qrCode) {
          // Atualizar banco
          await supabase
            .from('whatsapp_instances')
            .update({ 
              qr_code: vpsData.qrCode,
              connection_status: 'waiting_qr',
              updated_at: new Date().toISOString()
            })
            .eq('id', instanceData.instanceId);

          return new Response(JSON.stringify({
            success: true,
            qrCode: vpsData.qrCode,
            source: 'vps_webhook_server',
            normalized: true
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // 4. QR ainda não disponível
    return new Response(JSON.stringify({
      success: false,
      waiting: true,
      error: 'QR Code ainda sendo gerado'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[WhatsApp Web Server] ❌ Erro QR V3:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function createInstanceV2(supabase: any, instanceData: any) {
  return await createInstanceV3(supabase, instanceData);
}

async function getQRCodeV2Async(supabase: any, instanceData: any) {
  return await getQRCodeV3Async(supabase, instanceData);
}

async function regenerateQRCodeV2(supabase: any, instanceData: any) {
  try {
    console.log(`[WhatsApp Web Server] 🔄 Regenerando QR Code V2: ${instanceData.instanceId}`);

    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceData.instanceId)
      .single();

    if (!instance) throw new Error('Instância não encontrada');

    // Regenerar na VPS (porta 3002)
    const response = await fetch(`${WEBHOOK_SERVER_URL}/instance/${instance.vps_instance_id}/restart`, {
      method: 'POST',
      timeout: 15000
    });

    if (response.ok) {
      await supabase
        .from('whatsapp_instances')
        .update({ 
          connection_status: 'waiting_qr',
          qr_code: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceData.instanceId);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'QR Code sendo regenerado'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function configureWebhookV2(supabase: any, instanceData: any) {
  try {
    console.log(`[WhatsApp Web Server] 🔧 Configurando webhook V2: ${instanceData.instanceId}`);

    // Webhook já está automático na porta 3002
    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook já configurado automaticamente'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
