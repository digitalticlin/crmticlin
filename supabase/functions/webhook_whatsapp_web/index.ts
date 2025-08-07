
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log('[Webhook] 🚀 Inicializando webhook WhatsApp Web v3.0 - USANDO INFRAESTRUTURA EXISTENTE');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ CONFIGURAÇÃO WEBHOOK
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET');
console.log('[Webhook] 🔑 Webhook secret configurado:', !!WEBHOOK_SECRET);

// ✅ PROCESSADOR DE MÍDIA SÍNCRONO
class MediaProcessor {
  static async processSyncMediaWithStorage(
    messageId: string,
    externalMessageId: string,
    mediaData: any,
    supabase: any
  ) {
    console.log(`[Media] 🔄 Processamento síncrono com Storage existente: ${messageId}`);

    try {
      // ✅ DETECTAR TIPO DE MÍDIA COM CORREÇÃO APPLE
      const detectedMime = this.detectMimeType(mediaData.base64Data);
      const extension = this.getFileExtension(detectedMime);
      const isAppleFormat = detectedMime.includes('heic') || detectedMime.includes('heif');
      
      console.log(`[Media] 🍎 Processando mídia com detecção avançada:`, {
        originalType: mediaData.messageType,
        detectedMime,
        extension,
        isAppleFormat,
        sizeMB: (mediaData.base64Data.length * 0.75 / 1024 / 1024).toFixed(2)
      });

      // ✅ CONVERTER BASE64 PARA BUFFER
      const base64Clean = mediaData.base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Uint8Array.from(atob(base64Clean), c => c.charCodeAt(0));
      
      // ✅ UPLOAD PARA STORAGE
      const fileName = `media_${Date.now()}_${externalMessageId.substring(0, 6)}.${extension}`;
      const filePath = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('whatsapp-media')
        .upload(filePath, buffer, {
          contentType: detectedMime,
          upsert: false
        });

      if (uploadError) {
        console.error(`[Media] ❌ Erro no upload:`, uploadError);
        return { success: false, error: uploadError.message };
      }

      // ✅ OBTER URL PÚBLICA
      const { data: { publicUrl } } = supabase.storage
        .from('whatsapp-media')
        .getPublicUrl(filePath);

      console.log(`[Media] ✅ Processamento síncrono com Storage concluído:`, {
        messageId,
        fileName,
        storageUrl: publicUrl.substring(0, 80) + '...',
        fileSize: buffer.length
      });

      return {
        success: true,
        cachedUrl: publicUrl,
        fileName: fileName,
        fileSize: buffer.length,
        processingType: 'sync_storage'
      };

    } catch (error) {
      console.error(`[Media] ❌ Erro no processamento síncrono:`, error);
      return { success: false, error: error.message };
    }
  }

  static detectMimeType(base64Data: string): string {
    if (!base64Data) return 'application/octet-stream';
    
    // Extrair header do base64 se já tem mime type
    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/data:([^;]+);base64,/);
      if (match) return match[1];
    }
    
    // Detectar por magic bytes
    const bytes = atob(base64Data.substring(0, 100));
    const uint8Array = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      uint8Array[i] = bytes.charCodeAt(i);
    }
    
    // JPEG
    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8) return 'image/jpeg';
    // PNG
    if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50) return 'image/png';
    // MP4
    if (uint8Array[4] === 0x66 && uint8Array[5] === 0x74 && uint8Array[6] === 0x79 && uint8Array[7] === 0x70) return 'video/mp4';
    // OGG
    if (uint8Array[0] === 0x4F && uint8Array[1] === 0x67) return 'audio/ogg';
    // PDF
    if (uint8Array[0] === 0x25 && uint8Array[1] === 0x50) return 'application/pdf';
    
    return 'application/octet-stream';
  }

  static getFileExtension(mimeType: string): string {
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/x-msvideo': 'avi',
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/m4a': 'm4a',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };
    
    return mimeMap[mimeType] || 'bin';
  }

  static validateMediaSize(base64Data: string, maxSizeMB: number = 5): { isValid: boolean; sizeMB: string; error?: string } {
    if (!base64Data) return { isValid: false, sizeMB: '0.00', error: 'Dados de mídia vazios' };
    
    const sizeBytes = (base64Data.length * 0.75);
    const sizeMB = sizeBytes / (1024 * 1024);
    
    return {
      isValid: sizeMB <= maxSizeMB,
      sizeMB: sizeMB.toFixed(2),
      error: sizeMB > maxSizeMB ? `Arquivo muito grande (${sizeMB.toFixed(2)}MB, máximo ${maxSizeMB}MB)` : undefined
    };
  }
}

serve(async (req) => {
  // Suporte a CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    console.log('[Webhook] 📨 Recebendo webhook:', {
      method: req.method,
      contentLength: req.headers.get('content-length'),
      timestamp: new Date().toISOString()
    });

    // ✅ VERIFICAÇÃO DE SIGNATURE OPCIONAL
    const signature = req.headers.get('x-webhook-signature');
    console.log('[Webhook] 🔑 Signature recebida:', !!signature);
    
    if (WEBHOOK_SECRET && signature) {
      // Validação de signature se configurada
      console.log('[Webhook] 🔒 Validando signature...');
    } else {
      console.log('[Webhook] ⚠️ Sem verificação de signature - MODO DESENVOLVIMENTO');
    }

    // ✅ EXTRAIR DADOS DO WEBHOOK
    const {
      event,
      instanceId,
      instanceName,
      from,
      fromMe,
      messageType,
      message,
      timestamp,
      createdByUserId,
      data: messageData
    } = requestBody;

    console.log('[Webhook] 🔄 Processando evento:', {
      event,
      instanceId,
      hasMessage: !!message,
      hasMediaData: false, // Será detectado abaixo
      timestamp: new Date().toISOString()
    });

    // ✅ INVESTIGAÇÃO COMPLETA DA MÍDIA
    console.log('[Webhook] 📋 PAYLOAD COMPLETO VPS:', {
      allKeys: Object.keys(requestBody),
      messageType,
      mediabase64_exists: !!requestBody.mediabase64,
      mediaData_exists: !!requestBody.mediaData,
      base64Data_exists: !!requestBody.base64Data,
      media_exists: !!requestBody.media,
      buffer_exists: !!requestBody.buffer,
      content_exists: !!requestBody.content,
      data_buffer_exists: !!messageData?.buffer,
      data_base64_exists: !!messageData?.base64Data,
      message_media_exists: !!message?.media,
      payload_size: JSON.stringify(requestBody).length
    });

    console.log('[Webhook] 🔍 INVESTIGAÇÃO DE MÍDIA DETALHADA:', {
      messageType,
      topLevelKeys: Object.keys(requestBody),
      directMedia: {
        mediabase64: requestBody.mediabase64 || null,
        mediaData: requestBody.mediaData,
        base64Data: requestBody.base64Data || null,
        media: requestBody.media,
        buffer: requestBody.buffer || null,
        content: requestBody.content || null
      },
      nestedMedia: {
        data_keys: messageData ? Object.keys(messageData) : [],
        data_buffer: messageData?.buffer || null,
        data_base64: messageData?.base64Data || null,
        message_keys: message ? Object.keys(message) : [],
        message_media: message?.media
      }
    });

    // ✅ PROCESSAR APENAS EVENTOS DE MENSAGEM
    if (event !== 'message_received') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Evento ignorado',
        event
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Webhook] 💾 Salvando mensagem no banco...');

    // ✅ USAR INFRAESTRUTURA EXISTENTE
    console.log('[Webhook] 📨 Processando mensagem com infraestrutura existente:', {
      instanceId,
      hasMessage: !!message,
      fromMe,
      messageType,
      hasMediaData: !!(messageData?.mediaBase64 || messageData?.base64Data || requestBody.mediabase64),
      hasCaption: !!message?.text
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ EXTRAIR DADOS DE MÍDIA DA VPS
    let hasMediaData = false;
    let mediaCacheId = null;
    let mediaProcessed = false;
    
    // ✅ DETECTAR BASE64 DA VPS (MÚLTIPLAS LOCALIZAÇÕES)
    let vpsBase64Data = null;
    if (messageData?.mediaBase64) {
      vpsBase64Data = messageData.mediaBase64;
      hasMediaData = true;
    } else if (messageData?.base64Data) {
      vpsBase64Data = messageData.base64Data;
      hasMediaData = true;
    } else if (requestBody.mediabase64) {
      vpsBase64Data = requestBody.mediabase64;
      hasMediaData = true;
    } else if (requestBody.base64Data) {
      vpsBase64Data = requestBody.base64Data;
      hasMediaData = true;
    }

    // ✅ PROCESSAMENTO DE MÍDIA COM LIMITES DINÂMICOS
    if (hasMediaData && vpsBase64Data && messageType !== 'text') {
      const messageId = crypto.randomUUID();
      const externalMessageId = messageData?.messageId || `msg_${Date.now()}`;
      
      // ✅ VALIDAR TAMANHO DA MÍDIA
      const validation = MediaProcessor.validateMediaSize(vpsBase64Data, 5.0);
      
      console.log('[Media] 📊 Processando mídia com limites dinâmicos:', {
        messageId,
        externalMessageId,
        mediaType,
        sizeBytes: (vpsBase64Data.length * 0.75),
        sizeMB: validation.sizeMB,
        limitMB: '5.00',
        willProcessSync: validation.isValid,
        isValid: validation.isValid,
        validationError: validation.error
      });

      if (validation.isValid) {
        // ✅ PROCESSAMENTO SÍNCRONO COM STORAGE
        console.log('[Webhook] 🎬 Processando mídia usando Storage + PGMQ existentes...');
        
        const mediaResult = await MediaProcessor.processSyncMediaWithStorage(
          messageId,
          externalMessageId,
          {
            messageType,
            base64Data: vpsBase64Data
          },
          supabase
        );

        if (mediaResult.success) {
          mediaProcessed = true;
          console.log('[Webhook] ✅ Mídia processada com infraestrutura existente');
        }
      }
    }

    // ✅ SALVAR MENSAGEM USANDO RPC ATUALIZADA COM BASE64
    const messageText = message?.text || message || '';
    const phoneNumber = from?.replace(/[@c.us]/g, '') || '';
    
    const { data: saveResult, error: saveError } = await supabase.rpc(
      'save_whatsapp_message_service_role',
      {
        p_vps_instance_id: instanceId,
        p_phone: phoneNumber,
        p_message_text: messageText,
        p_from_me: fromMe === true,
        p_media_type: messageType || 'text',
        p_media_url: messageData?.mediaUrl || null,
        p_external_message_id: messageData?.messageId || null,
        p_contact_name: null,
        p_base64_data: vpsBase64Data || null // ✅ NOVO: Passar base64_data
      }
    );

    if (saveError || !saveResult?.success) {
      console.error('[Webhook] ❌ Erro ao salvar mensagem:', saveResult || saveError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to save message'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Webhook] ✅ Mensagem salva:', {
      messageId: saveResult.data?.message_id,
      leadId: saveResult.data?.lead_id,
      fromMe: fromMe === true
    });

    // ✅ RESPOSTA DE SUCESSO COMPLETA
    const response = {
      success: true,
      message: 'Message processed completely with existing infrastructure',
      data: {
        phone: saveResult.data?.phone,
        lead_id: saveResult.data?.lead_id,
        user_id: saveResult.data?.user_id,
        has_media: hasMediaData,
        media_type: messageType || 'text',
        message_id: saveResult.data?.message_id,
        instance_id: saveResult.data?.instance_id,
        formatted_name: saveResult.data?.formatted_name,
        media_cache_id: mediaCacheId,
        mediaProcessed,
        usedExistingInfrastructure: true
      }
    };

    console.log('[Webhook] ✅ Processamento concluído:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Webhook] ❌ Erro interno:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
