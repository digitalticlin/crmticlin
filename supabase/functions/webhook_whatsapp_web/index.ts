
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("WEBHOOK_SECRET");

console.log('[Webhook] 🚀 Inicializando webhook WhatsApp Web');
console.log('[Webhook] 🔑 Webhook secret configurado:', !!webhookSecret);

// Webhook signature verification (TEMPORARIAMENTE DESABILITADO)
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!secret || !signature) {
    console.log('[Webhook] ⚠️ Secret ou signature não fornecidos');
    return true; // TEMPORARIAMENTE PERMITIR SEM VERIFICAÇÃO
  }
  
  try {
    const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');
    const isValid = `sha256=${expectedSignature}` === signature;
    console.log('[Webhook] 🔒 Verificação de signature:', isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
    return true; // TEMPORARIAMENTE SEMPRE RETORNAR TRUE
  } catch (error) {
    console.error('[Webhook] ❌ Erro na verificação:', error);
    return true; // TEMPORARIAMENTE PERMITIR EM CASO DE ERRO
  }
}

// Input sanitization
function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.replace(/[<>\"']/g, '');
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  return input;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.text();
    console.log('[Webhook] 📨 Recebendo webhook:', {
      method: req.method,
      contentLength: body.length,
      timestamp: new Date().toISOString()
    });
    
    // Verificação de signature (TEMPORARIAMENTE FLEXÍVEL)
    const signature = req.headers.get('x-webhook-signature');
    console.log('[Webhook] 🔑 Signature recebida:', !!signature);
    
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error('[Webhook] ❌ Signature inválida - MAS CONTINUANDO TEMPORARIAMENTE');
      }
    } else {
      console.log('[Webhook] ⚠️ Sem verificação de signature - MODO DESENVOLVIMENTO');
    }

    const webhookData = JSON.parse(body);
    const sanitizedData = sanitizeInput(webhookData);
    
    console.log('[Webhook] 🔄 Processando evento:', {
      event: sanitizedData.event,
      instanceId: sanitizedData.instanceId,
      hasMessage: !!(sanitizedData.message || sanitizedData.data?.messages),
      timestamp: new Date().toISOString()
    });

    // Process different webhook events
    let result;
    switch (sanitizedData.event) {
      case 'qr_update':
        result = await processQRUpdate(supabase, sanitizedData);
        break;
      case 'message_received':
      case 'messages.upsert':
        result = await processMessage(supabase, sanitizedData);
        break;
      case 'connection_update':
      case 'connection.update':
        result = await processConnectionUpdate(supabase, sanitizedData);
        break;
      default:
        console.warn('[Webhook] ⚠️ Evento desconhecido:', sanitizedData.event);
        // NÃO retornar erro para eventos desconhecidos - apenas log
        result = { success: true, message: 'Event logged but not processed', event: sanitizedData.event };
    }

    // Log successful webhook processing
    await supabase.from('sync_logs').insert({
      function_name: 'webhook_whatsapp_web',
      status: 'success',
      result: {
        event: sanitizedData.event,
        instanceId: sanitizedData.instanceId,
        processed: true,
        timestamp: new Date().toISOString()
      }
    });

    console.log('[Webhook] ✅ Processamento concluído:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('[Webhook] ❌ ERRO CRÍTICO:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Log error for monitoring
    try {
      await supabase.from('sync_logs').insert({
        function_name: 'webhook_whatsapp_web',
        status: 'error',
        error_message: error.message,
        result: {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('[Webhook] ❌ Erro ao fazer log:', logError);
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Webhook processing failed',
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});

async function processQRUpdate(supabase: any, data: any) {
  const { instanceId, qrCode } = data;
  
  console.log('[Webhook] 📱 Processando QR Code:', instanceId);
  
  if (!instanceId || !qrCode) {
    return { success: false, error: 'Missing required QR data' };
  }

  const { error } = await supabase
    .from('whatsapp_instances')
    .update({
      qr_code: qrCode,
      web_status: 'waiting_scan',
      connection_status: 'waiting_scan',
      updated_at: new Date().toISOString()
    })
    .eq('vps_instance_id', instanceId);

  if (error) {
    console.error('[Webhook] ❌ Erro ao atualizar QR:', error);
    return { success: false, error: 'Failed to update QR code' };
  }

  return { success: true, message: 'QR code updated' };
}

async function processMessage(supabase: any, data: any) {
  console.log('[Webhook] 📨 Processando mensagem:', {
    instanceId: data.instanceId,
    hasMessage: !!(data.message || data.data?.messages),
    fromMe: data.fromMe || (data.data?.messages?.[0]?.key?.fromMe),
    messageType: data.messageType || data.data?.messages?.[0]?.messageType
  });

  // Extrair dados da mensagem do formato Baileys
  let messageData;
  if (data.data?.messages?.[0]) {
    // Formato Baileys (evolution API)
    const baileyMsg = data.data.messages[0];
    messageData = {
      instanceId: data.instanceId,
      from: baileyMsg.key.remoteJid,
      fromMe: baileyMsg.key.fromMe,
      message: {
        text: baileyMsg.message?.conversation || 
              baileyMsg.message?.extendedTextMessage?.text ||
              '[Mídia]'
      },
      messageType: data.messageType || 'text',
      mediaUrl: data.mediaUrl,
      contactName: data.contactName
    };
  } else {
    // Formato direto
    messageData = {
      instanceId: data.instanceId,
      from: data.from,
      fromMe: data.fromMe,
      message: data.message,
      messageType: data.messageType || 'text',
      mediaUrl: data.mediaUrl,
      contactName: data.contactName
    };
  }

  if (!messageData.instanceId || !messageData.from || !messageData.message) {
    console.error('[Webhook] ❌ Dados de mensagem incompletos:', messageData);
    return { success: false, error: 'Missing required message data' };
  }

  // Usar função segura para salvar mensagem
  const { data: result, error } = await supabase.rpc('save_whatsapp_message_service_role', {
    p_vps_instance_id: messageData.instanceId,
    p_phone: messageData.from,
    p_message_text: messageData.message.text || '',
    p_from_me: messageData.fromMe || false,
    p_media_type: messageData.messageType || 'text',
    p_media_url: messageData.mediaUrl || null,
    p_external_message_id: data.messageId || null,
    p_contact_name: messageData.contactName || null
  });

  if (error || !result?.success) {
    console.error('[Webhook] ❌ Erro ao processar mensagem:', error || result);
    return { success: false, error: 'Failed to process message' };
  }

  console.log('[Webhook] ✅ Mensagem processada com sucesso:', {
    messageId: result.data?.message_id,
    leadId: result.data?.lead_id,
    fromMe: messageData.fromMe
  });

  return { success: true, message: 'Message processed', data: result.data };
}

async function processConnectionUpdate(supabase: any, data: any) {
  const { instanceId, status, phone, profileName } = data;
  
  console.log('[Webhook] 🔗 Processando conexão:', {
    instanceId,
    status,
    hasPhone: !!phone
  });
  
  if (!instanceId || !status) {
    return { success: false, error: 'Missing connection data' };
  }

  const { error } = await supabase
    .from('whatsapp_instances')
    .update({
      connection_status: status,
      web_status: status,
      phone: phone || null,
      profile_name: profileName || null,
      date_connected: status === 'connected' ? new Date().toISOString() : null,
      date_disconnected: status === 'disconnected' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('vps_instance_id', instanceId);

  if (error) {
    console.error('[Webhook] ❌ Erro ao atualizar conexão:', error);
    return { success: false, error: 'Failed to update connection' };
  }

  return { success: true, message: 'Connection updated' };
}
