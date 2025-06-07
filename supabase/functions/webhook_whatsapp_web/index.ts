
import { serve } from 'https://deno.land/std@0.177.1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookData {
  instanceId?: string;
  event?: string;
  data?: any;
  qrCode?: string;
  status?: string;
  connectionUpdate?: any;
}

async function findInstanceByVpsId(supabase: any, vpsInstanceId: string) {
  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('vps_instance_id', vpsInstanceId)
    .maybeSingle();
  
  return instance;
}

async function processQRUpdate(supabase: any, webhookData: WebhookData) {
  console.log('[Webhook] 📱 Processando QR Update:', webhookData);

  const vpsInstanceId = webhookData.instanceId;
  if (!vpsInstanceId) {
    console.error('[Webhook] ❌ instanceId não fornecido no QR update');
    return { success: false, error: 'instanceId missing' };
  }

  const instance = await findInstanceByVpsId(supabase, vpsInstanceId);
  if (!instance) {
    console.error('[Webhook] ❌ Instância não encontrada:', vpsInstanceId);
    return { success: false, error: 'Instance not found' };
  }

  // Extrair QR code do webhook
  let qrCode = webhookData.qrCode || webhookData.data?.qrCode || webhookData.data?.qr;
  
  if (qrCode) {
    // Normalizar QR code
    if (!qrCode.startsWith('data:image/')) {
      qrCode = `data:image/png;base64,${qrCode}`;
    }

    // Salvar QR code no banco
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: qrCode,
        web_status: 'waiting_scan',
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    if (updateError) {
      console.error('[Webhook] ❌ Erro ao salvar QR code:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('[Webhook] ✅ QR Code salvo para instância:', instance.instance_name);
    return { success: true, action: 'qr_saved' };
  }

  console.log('[Webhook] ⚠️ QR code não encontrado no webhook');
  return { success: false, error: 'QR code not found in webhook' };
}

async function processConnectionUpdate(supabase: any, webhookData: WebhookData) {
  console.log('[Webhook] 🔗 Processando Connection Update:', webhookData);

  const vpsInstanceId = webhookData.instanceId;
  if (!vpsInstanceId) {
    console.error('[Webhook] ❌ instanceId não fornecido no connection update');
    return { success: false, error: 'instanceId missing' };
  }

  const instance = await findInstanceByVpsId(supabase, vpsInstanceId);
  if (!instance) {
    console.error('[Webhook] ❌ Instância não encontrada:', vpsInstanceId);
    return { success: false, error: 'Instance not found' };
  }

  // Extrair status da conexão
  const connectionData = webhookData.data || webhookData.connectionUpdate || {};
  const newStatus = connectionData.status || connectionData.state || webhookData.status;

  if (newStatus) {
    let webStatus = 'connecting';
    let connectionStatus = 'connecting';
    let phone = instance.phone;

    // Mapear status
    switch (newStatus.toLowerCase()) {
      case 'open':
      case 'ready':
      case 'connected':
        webStatus = 'ready';
        connectionStatus = 'open';
        // Extrair número do telefone se disponível
        if (connectionData.user || connectionData.me) {
          const userData = connectionData.user || connectionData.me;
          phone = userData.id || userData.jid || phone;
        }
        break;
      case 'close':
      case 'closed':
      case 'disconnected':
        webStatus = 'disconnected';
        connectionStatus = 'disconnected';
        break;
      case 'connecting':
        webStatus = 'connecting';
        connectionStatus = 'connecting';
        break;
    }

    // Atualizar no banco
    const updateData: any = {
      web_status: webStatus,
      connection_status: connectionStatus,
      updated_at: new Date().toISOString()
    };

    if (phone && phone !== instance.phone) {
      updateData.phone = phone;
    }

    if (connectionStatus === 'open') {
      updateData.date_connected = new Date().toISOString();
      updateData.qr_code = null; // Limpar QR code quando conectar
    } else if (connectionStatus === 'disconnected') {
      updateData.date_disconnected = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', instance.id);

    if (updateError) {
      console.error('[Webhook] ❌ Erro ao atualizar status:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('[Webhook] ✅ Status atualizado:', {
      instance: instance.instance_name,
      webStatus,
      connectionStatus,
      phone
    });

    return { success: true, action: 'status_updated', newStatus: webStatus };
  }

  console.log('[Webhook] ⚠️ Status não encontrado no webhook');
  return { success: false, error: 'Status not found in webhook' };
}

async function processMessageUpdate(supabase: any, webhookData: WebhookData) {
  console.log('[Webhook] 💬 Processando Message Update:', webhookData);
  
  // Por enquanto, apenas logar as mensagens
  // Implementação futura para salvar mensagens na base de dados
  
  return { success: true, action: 'message_logged' };
}

serve(async (req) => {
  console.log('[Webhook WhatsApp Web] 📨 WEBHOOK RECEIVED');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData: WebhookData = await req.json();
    console.log('[Webhook WhatsApp Web] Data received:', JSON.stringify(webhookData, null, 2));

    // Detectar tipo de evento
    const event = webhookData.event || 
                 (webhookData.data?.event) ||
                 (webhookData.qrCode ? 'qr.update' : null) ||
                 (webhookData.status ? 'connection.update' : null) ||
                 'unknown';

    console.log('[Webhook WhatsApp Web] Event type detected:', event);

    let result;

    switch (event) {
      case 'qr.update':
      case 'qrCode':
        result = await processQRUpdate(supabase, webhookData);
        break;
        
      case 'connection.update':
      case 'connectionUpdate':
      case 'status':
        result = await processConnectionUpdate(supabase, webhookData);
        break;
        
      case 'messages.upsert':
      case 'message':
        result = await processMessageUpdate(supabase, webhookData);
        break;
        
      default:
        console.log('[Webhook WhatsApp Web] ⚠️ Evento não reconhecido:', event);
        result = { success: true, action: 'ignored', event };
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: result.success,
        action: result.action,
        event,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook WhatsApp Web] ❌ General error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
