import { serve } from 'https://deno.land/std@0.177.1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookData {
  instanceId?: string;
  instanceName?: string;
  event?: string;
  data?: any;
  qrCode?: string;
  qr?: string;
  status?: string;
  connectionUpdate?: any;
}

async function findInstanceByVpsId(supabase: any, vpsInstanceId: string) {
  console.log(`[Webhook] 🔍 Procurando instância com vps_instance_id: ${vpsInstanceId}`);
  
  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('vps_instance_id', vpsInstanceId)
    .maybeSingle();
  
  if (instance) {
    console.log(`[Webhook] ✅ Instância encontrada: ${instance.instance_name} (ID: ${instance.id})`);
  } else {
    console.log(`[Webhook] ❌ Instância não encontrada para vps_instance_id: ${vpsInstanceId}`);
  }
  
  return instance;
}

async function processQRUpdate(supabase: any, webhookData: WebhookData) {
  console.log('[Webhook] 📱 CORREÇÃO - Processando QR Update:', webhookData);

  const vpsInstanceId = webhookData.instanceId || webhookData.instanceName;
  if (!vpsInstanceId) {
    console.error('[Webhook] ❌ instanceId/instanceName não fornecido');
    return { success: false, error: 'instanceId missing' };
  }

  const instance = await findInstanceByVpsId(supabase, vpsInstanceId);
  if (!instance) {
    console.error('[Webhook] ❌ Instância não encontrada:', vpsInstanceId);
    return { success: false, error: 'Instance not found' };
  }

  // Extrair QR code - múltiplas fontes possíveis
  let qrCode = webhookData.qrCode || 
               webhookData.qr || 
               webhookData.data?.qrCode || 
               webhookData.data?.qr ||
               webhookData.data?.base64;
  
  console.log('[Webhook] 🔍 QR Code encontrado:', qrCode ? 'SIM' : 'NÃO');
  
  if (qrCode) {
    // Normalizar QR code
    if (!qrCode.startsWith('data:image/') && qrCode.length > 100) {
      qrCode = `data:image/png;base64,${qrCode}`;
    }

    console.log('[Webhook] 💾 Salvando QR Code no banco...');

    // Salvar QR code no banco
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: qrCode,
        web_status: 'waiting_scan',
        connection_status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    if (updateError) {
      console.error('[Webhook] ❌ Erro ao salvar QR code:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('[Webhook] ✅ QR Code salvo para:', instance.instance_name);
    return { success: true, action: 'qr_saved', instanceName: instance.instance_name };
  }

  console.log('[Webhook] ⚠️ QR code não encontrado no webhook data');
  return { success: false, error: 'QR code not found in webhook' };
}

async function processConnectionUpdate(supabase: any, webhookData: WebhookData) {
  console.log('[Webhook] 🔗 CORREÇÃO - Processando Connection Update:', webhookData);

  const vpsInstanceId = webhookData.instanceId || webhookData.instanceName;
  if (!vpsInstanceId) {
    console.error('[Webhook] ❌ instanceId não fornecido');
    return { success: false, error: 'instanceId missing' };
  }

  const instance = await findInstanceByVpsId(supabase, vpsInstanceId);
  if (!instance) {
    console.error('[Webhook] ❌ Instância não encontrada:', vpsInstanceId);
    return { success: false, error: 'Instance not found' };
  }

  // Extrair status - múltiplas fontes possíveis
  const connectionData = webhookData.data || webhookData.connectionUpdate || {};
  const newStatus = connectionData.status || 
                   connectionData.state || 
                   connectionData.connection ||
                   webhookData.status;

  console.log('[Webhook] 📊 Status detectado:', newStatus);

  if (newStatus) {
    let webStatus = 'connecting';
    let connectionStatus = 'connecting';
    let phone = instance.phone;

    // Mapear status baseado no WhatsApp Web.js
    switch (newStatus.toLowerCase()) {
      case 'open':
      case 'ready':
      case 'connected':
        webStatus = 'ready';
        connectionStatus = 'open';
        // Extrair telefone se disponível
        if (connectionData.user || connectionData.me) {
          const userData = connectionData.user || connectionData.me;
          phone = userData.id || userData.jid || phone;
          if (phone && phone.includes('@')) {
            phone = phone.split('@')[0];
          }
        }
        break;
      case 'close':
      case 'closed':
      case 'disconnected':
        webStatus = 'disconnected';
        connectionStatus = 'disconnected';
        break;
      case 'connecting':
      case 'pairing':
        webStatus = 'connecting';
        connectionStatus = 'connecting';
        break;
    }

    console.log('[Webhook] 🔄 Atualizando status:', { webStatus, connectionStatus, phone });

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
  console.log('[Webhook] 💬 CORREÇÃO - Processando Message Update:', webhookData);
  
  const vpsInstanceId = webhookData.instanceId || webhookData.instanceName;
  if (!vpsInstanceId) {
    return { success: false, error: 'instanceId missing' };
  }

  const instance = await findInstanceByVpsId(supabase, vpsInstanceId);
  if (!instance) {
    return { success: false, error: 'Instance not found' };
  }

  // Aqui implementaria processamento completo de mensagens
  // Por ora, apenas logar
  console.log('[Webhook] 📝 Mensagem recebida para:', instance.instance_name);
  
  return { success: true, action: 'message_logged' };
}

serve(async (req) => {
  console.log('[Webhook WhatsApp Web] 📨 CORREÇÃO TOTAL - WEBHOOK RECEIVED');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData: WebhookData = await req.json();
    console.log('[Webhook] 📥 Data received:', JSON.stringify(webhookData, null, 2));

    // Detectar tipo de evento de forma mais robusta
    let event = webhookData.event;
    
    // Se não tem event explícito, inferir do conteúdo
    if (!event) {
      if (webhookData.qrCode || webhookData.qr || webhookData.data?.qrCode || webhookData.data?.qr) {
        event = 'qr.update';
      } else if (webhookData.status || webhookData.data?.status || webhookData.connectionUpdate) {
        event = 'connection.update';
      } else if (webhookData.data?.messages || webhookData.data?.message) {
        event = 'messages.upsert';
      } else {
        event = 'unknown';
      }
    }

    console.log('[Webhook] 🎯 Event type detected:', event);

    let result;

    switch (event) {
      case 'qr.update':
      case 'qrCode':
      case 'qr':
        result = await processQRUpdate(supabase, webhookData);
        break;
        
      case 'connection.update':
      case 'connectionUpdate':
      case 'status':
        result = await processConnectionUpdate(supabase, webhookData);
        break;
        
      case 'messages.upsert':
      case 'message':
      case 'messages':
        result = await processMessageUpdate(supabase, webhookData);
        break;
        
      default:
        console.log('[Webhook] ⚠️ Evento não reconhecido:', event);
        result = { success: true, action: 'ignored', event };
    }

    console.log('[Webhook] 📤 Result:', result);

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

  } catch (error: any) {
    console.error('[Webhook] ❌ General error:', error);
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
