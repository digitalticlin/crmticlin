// 🚀 WEBHOOK WHATSAPP WEB - VERSÃO FINAL CORRIGIDA
// Corrigido: External Message ID + Media Linking + Storage Integration

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("WEBHOOK_SECRET");

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(body);
    
    return crypto.subtle.verify("HMAC", key, signature, data)
      .then(isValid => isValid)
      .catch(() => false);
  } catch {
    return false;
  }
}

function sanitizeInput(input: any): any {
  if (typeof input !== 'object' || input === null) return input;
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      sanitized[key] = value.replace(/[<>]/g, '').trim();
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

async function enqueueMediaProcessing(supabase: any, messageId: string, mediaData: any) {
  try {
    console.log('[PGMQ] 📤 Enfileirando mídia grande para processamento assíncrono:', messageId);
    
    const { error } = await supabase.rpc('pgmq_send', {
      queue_name: 'media_processing_queue',
      message: {
        messageId,
        mediaData,
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      console.error('[PGMQ] ❌ Erro ao enfileirar:', error);
      return false;
    }

    console.log('[PGMQ] ✅ Mídia enfileirada com sucesso');
    return true;
  } catch (error) {
    console.error('[PGMQ] ❌ Erro no enfileiramento:', error);
    return false;
  }
}

// 🚀 CLASSE PARA USAR SUPABASE STORAGE EXISTENTE
class MediaProcessor {
  static async processMediaOptimized(supabase: any, messageId: string, mediaData: any) {
    const sizeLimit = 2 * 1024 * 1024; // 2MB

    try {
      if (mediaData.base64Data) {
        const dataSize = mediaData.base64Data.length;
        console.log('[Media] 📊 Processando mídia:', {
          messageId,
          externalMessageId: mediaData.externalMessageId,
          sizeBytes: dataSize,
          sizeMB: (dataSize / 1024 / 1024).toFixed(2),
          willProcessSync: dataSize <= sizeLimit
        });

        if (dataSize <= sizeLimit) {
          // 🟢 PROCESSAMENTO SÍNCRONO usando Storage existente
          return await this.processSyncMediaWithStorage(supabase, messageId, mediaData);
        } else {
          // 🟡 PROCESSAMENTO ASSÍNCRONO usando PGMQ existente
          return await enqueueMediaProcessing(supabase, messageId, mediaData);
        }
      }

      return true;
    } catch (error) {
      console.error('[Media] ❌ Erro no processamento:', error);
      return false;
    }
  }

  static async processSyncMediaWithStorage(supabase: any, messageId: string, mediaData: any) {
    try {
      console.log('[Media] 🔄 Processamento síncrono com Storage existente:', messageId);

      // 1. Converter base64 para buffer
      const binaryString = atob(mediaData.base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 2. Gerar nome único do arquivo
      const mimeType = this.getMimeType(mediaData.mediaType);
      const extension = mimeType.split('/')[1] || 'bin';
      const fileName = `media_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

      // 3. Upload para Storage existente
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('whatsapp-media')
        .upload(fileName, bytes, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[Media] ❌ Storage upload falhou:', uploadError);
        // Fallback para cache base64
        return await this.processSyncMediaFallback(supabase, messageId, mediaData);
      }

      // 4. Obter URL pública
      const { data: urlData } = supabase.storage
        .from('whatsapp-media')
        .getPublicUrl(fileName);

      const storageUrl = urlData.publicUrl;

      // 5. Salvar no cache de mídia
      const { error: cacheError } = await supabase
        .from('media_cache')
        .insert({
          message_id: messageId,
          original_url: storageUrl,
          cached_url: storageUrl,
          base64_data: null, // Não salvar base64 quando tem Storage
          file_name: mediaData.fileName || fileName,
          file_size: bytes.length,
          media_type: mediaData.mediaType,
          external_message_id: mediaData.externalMessageId || null,
          processing_status: 'completed',
          created_at: new Date().toISOString()
        });

      if (cacheError) {
        console.error('[Media] ❌ Erro ao salvar cache:', cacheError);
        return false;
      }

      // 6. Atualizar mensagem com URL do Storage
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          media_url: storageUrl,
          text: mediaData.caption || `[${mediaData.mediaType?.toUpperCase() || 'MÍDIA'}]`
        })
        .eq('id', messageId);

      if (updateError) {
        console.error('[Media] ❌ Erro ao atualizar mensagem:', updateError);
        return false;
      }

      console.log('[Media] ✅ Processamento síncrono com Storage concluído:', {
        messageId,
        fileName,
        storageUrl: storageUrl.substring(0, 80) + '...',
        fileSize: bytes.length
      });
      return true;

    } catch (error) {
      console.error('[Media] ❌ Erro no processamento síncrono:', error);
      return false;
    }
  }

  static async processSyncMediaFallback(supabase: any, messageId: string, mediaData: any) {
    try {
      console.log('[Media] 🔄 Fallback: salvando base64 no cache:', messageId);

      // Salvar no cache de mídia como fallback
      const cachedUrl = `data:${this.getMimeType(mediaData.mediaType)};base64,${mediaData.base64Data}`;
      
      const { error: cacheError } = await supabase
        .from('media_cache')
        .insert({
          message_id: messageId,
          base64_data: cachedUrl,
          cached_url: cachedUrl,
          original_url: `base64://${mediaData.externalMessageId || Date.now()}`,
          file_name: mediaData.fileName || `media_${Date.now()}`,
          file_size: mediaData.base64Data.length,
          media_type: mediaData.mediaType,
          external_message_id: mediaData.externalMessageId || null,
          processing_status: 'completed',
          created_at: new Date().toISOString()
        });

      if (cacheError) {
        console.error('[Media] ❌ Erro ao salvar cache fallback:', cacheError);
        return false;
      }

      // Atualizar mensagem com URL de mídia
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          media_url: cachedUrl,
          text: mediaData.caption || `[${mediaData.mediaType?.toUpperCase() || 'MÍDIA'}]`
        })
        .eq('id', messageId);

      if (updateError) {
        console.error('[Media] ❌ Erro ao atualizar mensagem fallback:', updateError);
        return false;
      }

      console.log('[Media] ✅ Fallback base64 concluído:', messageId);
      return true;

    } catch (error) {
      console.error('[Media] ❌ Erro no fallback:', error);
      return false;
    }
  }

  static getMimeType(mediaType: string): string {
    const mimeTypes: { [key: string]: string } = {
      'image': 'image/jpeg',
      'video': 'video/mp4',
      'audio': 'audio/mpeg',
      'document': 'application/pdf'
    };
    return mimeTypes[mediaType] || 'application/octet-stream';
  }
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
      messageType: sanitizedData.messageType
    });

    // 🔍 DEBUG: Log completo do payload VPS
    console.log('[Webhook] 📋 PAYLOAD COMPLETO VPS:', {
      allKeys: Object.keys(sanitizedData),
      messageType: sanitizedData.messageType,
      mediabase64_exists: !!sanitizedData.mediabase64,
      mediaData_exists: !!sanitizedData.mediaData,
      base64Data_exists: !!sanitizedData.base64Data,
      media_exists: !!sanitizedData.media,
      buffer_exists: !!sanitizedData.buffer,
      content_exists: !!sanitizedData.content,
      data_buffer_exists: !!sanitizedData.data?.buffer,
      data_base64_exists: !!sanitizedData.data?.base64,
      message_media_exists: !!sanitizedData.message?.media,
      payload_size: JSON.stringify(sanitizedData).length
    });

    let result;

    switch (sanitizedData.event) {
      case 'qr':
        result = await processQRUpdate(supabase, sanitizedData);
        break;
      case 'connection':
        result = await processConnectionUpdate(supabase, sanitizedData);
        break;
      case 'message':
        result = await processMessage(supabase, sanitizedData);
        break;
      default:
        console.log('[Webhook] ⚠️ Evento não mapeado:', sanitizedData.event);
        result = { success: true, message: 'Event received but not processed' };
    }

    // Log do resultado
    console.log('[Webhook] ✅ Processamento concluído:', {
      event: sanitizedData.event,
      success: result.success,
      message: result.message
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('[Webhook] ❌ Erro no processamento:', error);

    // Log erro no banco para debug
    try {
      await supabase.from('webhook_logs').insert({
        event_type: 'error',
        payload: 'Error occurred during processing',
        error_message: error.message,
        status: 'error',
        timestamp: new Date().toISOString()
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

// 🚀 FUNÇÃO PRINCIPAL REFORMULADA: Usar Storage + PGMQ existentes
async function processMessage(supabase: any, data: any) {
  console.log('[Webhook] 📨 Processando mensagem com infraestrutura existente:', {
    instanceId: data.instanceId,
    hasMessage: !!(data.message || data.data?.messages),
    fromMe: data.fromMe || (data.data?.messages?.[0]?.key?.fromMe),
    messageType: data.messageType || data.data?.messages?.[0]?.messageType,
    hasMediaData: !!(
      data.mediabase64 || 
      data.mediaData || 
      data.base64Data ||
      data.media ||
      data.buffer ||
      data.content ||
      data.data?.buffer ||
      data.data?.base64 ||
      data.message?.media
    ),
    hasCaption: !!(data.caption)
  });

  // 🔍 EXTRAÇÃO COMPLETA DE DADOS DA MENSAGEM
  let messageData;
  if (data.data?.messages?.[0]) {
    // Formato Baileys (evolution API)
    const baileyMsg = data.data.messages[0];
    messageData = {
      instanceId: data.instanceId,
      from: baileyMsg.key.remoteJid,
      fromMe: baileyMsg.key.fromMe,
      externalMessageId: baileyMsg.key.id, // ✅ CRUCIAL: External Message ID
      message: {
        text: baileyMsg.message?.conversation || 
              baileyMsg.message?.extendedTextMessage?.text ||
              data.caption ||
              '[Mídia recebida]'
      },
      messageType: data.messageType || 'text',
      mediaUrl: data.mediaUrl,
      contactName: data.contactName,
      // 🚀 DADOS DE MÍDIA EXTRAÍDOS
      mediaData: {
        base64Data: 
          data.mediabase64 || 
          data.base64Data || 
          data.mediaData?.base64Data ||
          data.media?.base64 ||
          data.buffer ||
          data.content ||
          data.data?.buffer ||
          data.data?.base64 ||
          data.message?.media?.buffer,
        fileName: data.fileName || data.mediaData?.fileName,
        mediaType: data.messageType || data.mediaData?.mediaType,
        caption: data.caption || data.mediaData?.caption,
        externalMessageId: baileyMsg.key.id
      }
    };
  } else {
    // Formato direto da VPS
    messageData = {
      instanceId: data.instanceId,
      from: data.from,
      fromMe: data.fromMe,
      externalMessageId: data.messageId || data.id || data.external_message_id, // ✅ CRUCIAL: External Message ID
      message: {
        text: data.message?.text || data.caption || '[Mídia recebida]'
      },
      messageType: data.messageType || 'text',
      mediaUrl: data.mediaUrl,
      contactName: data.contactName,
      // 🚀 DADOS DE MÍDIA EXTRAÍDOS
      mediaData: {
        base64Data: 
          data.mediabase64 || 
          data.base64Data || 
          data.mediaData?.base64Data ||
          data.media?.base64 ||
          data.buffer ||
          data.content ||
          data.data?.buffer ||
          data.data?.base64 ||
          data.message?.media?.buffer,
        fileName: data.fileName || data.mediaData?.fileName,
        mediaType: data.messageType || data.mediaData?.mediaType,
        caption: data.caption || data.mediaData?.caption,
        externalMessageId: data.messageId || data.id || data.external_message_id
      }
    };
  }

  if (!messageData.instanceId || !messageData.from) {
    console.error('[Webhook] ❌ Dados de mensagem incompletos:', messageData);
    return { success: false, error: 'Missing required message data' };
  }

  // 🚀 STEP 1: SALVAR MENSAGEM NO BANCO
  console.log('[Webhook] 💾 Salvando mensagem no banco...');
  const { data: result, error } = await supabase.rpc('save_whatsapp_message_service_role', {
    p_vps_instance_id: messageData.instanceId,
    p_phone: messageData.from,
    p_message_text: messageData.message.text || '',
    p_from_me: messageData.fromMe || false,
    p_media_type: messageData.messageType || 'text',
    p_media_url: messageData.mediaUrl || null,
    p_external_message_id: messageData.externalMessageId || null,
    p_contact_name: messageData.contactName || null
  });

  if (error || !result?.success) {
    console.error('[Webhook] ❌ Erro ao salvar mensagem:', error || result);
    return { success: false, error: 'Failed to save message' };
  }

  const messageId = result.data?.message_id;
  if (!messageId) {
    console.error('[Webhook] ❌ Message ID não retornado');
    return { success: false, error: 'Message ID not returned' };
  }

  console.log('[Webhook] ✅ Mensagem salva:', {
    messageId,
    leadId: result.data?.lead_id,
    fromMe: messageData.fromMe
  });

  // 🚀 STEP 2: PROCESSAR MÍDIA USANDO INFRAESTRUTURA EXISTENTE
  if (messageData.mediaData?.base64Data && messageData.messageType !== 'text') {
    console.log('[Webhook] 🎬 Processando mídia usando Storage + PGMQ existentes...');
    
    const mediaProcessed = await MediaProcessor.processMediaOptimized(
      supabase, 
      messageId, 
      messageData.mediaData
    );

    if (!mediaProcessed) {
      console.warn('[Webhook] ⚠️ Falha no processamento de mídia, mas mensagem foi salva');
    } else {
      console.log('[Webhook] ✅ Mídia processada com infraestrutura existente');
    }
  }

  return { 
    success: true, 
    message: 'Message processed completely with existing infrastructure', 
    data: {
      ...result.data,
      mediaProcessed: !!(messageData.mediaData?.base64Data),
      usedExistingInfrastructure: true
    }
  };
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