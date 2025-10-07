import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature'
};
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
const edgeFunctionSecret = Deno.env.get("EDGE_FUNCTION_SECRET");
console.log('[Webhook] 🚀 Inicializando webhook WhatsApp Web v3.1 - OTIMIZADO PARA MEMÓRIA');
console.log('[Webhook] 🔑 Webhook secret configurado:', !!webhookSecret);
console.log('[Webhook] 🔐 Edge Function secret configurada:', !!edgeFunctionSecret);
// =====================================================================
// 🧠 CONFIGURAÇÕES DE LIMITE DE MEMÓRIA
// =====================================================================
const MEMORY_LIMITS = {
  MAX_PAYLOAD_SIZE: 20 * 1024 * 1024,
  MAX_BASE64_SIZE: 3 * 1024 * 1024,
  MAX_LOG_SIZE: 1000,
  CLEANUP_THRESHOLD: 8 * 1024 * 1024 // 8MB - forçar limpeza
};
// 🧹 Função para limpeza de memória
function forceMemoryCleanup() {
  // @ts-ignore - Forçar garbage collection se disponível
  if (globalThis.gc) {
    globalThis.gc();
    console.log('[Memory] 🧹 Limpeza forçada');
  }
}
// Webhook signature verification (TEMPORARIAMENTE DESABILITADO)
function verifyWebhookSignature(payload, signature, secret) {
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
// 📱 Função para gerar nomes descritivos para mídia
function getMediaDisplayName(mediaType, mimeType = null) {
  // Detectar PDF por mime type
  if (mimeType && mimeType.includes('pdf')) {
    return '📄 PDF';
  }

  const mediaNames = {
    'image': '📷 Imagem',
    'video': '🎥 Vídeo',
    'audio': '🎵 Áudio',
    'document': '📄 Documento',
    'sticker': '😊 Sticker',
    'voice': '🎤 Áudio',
    'ptt': '🎤 Áudio',
    'pdf': '📄 PDF'
  };
  return mediaNames[mediaType?.toLowerCase()] || '📎 Mídia';
}
// ✅ Input sanitization otimizada para memória
function sanitizeInput(input) {
  if (!input) return input;
  if (typeof input === 'string') {
    // Limitar tamanho de strings para evitar vazamentos
    return input.length > MEMORY_LIMITS.MAX_LOG_SIZE ? input.substring(0, MEMORY_LIMITS.MAX_LOG_SIZE) + '...' : input.replace(/[<>\"']/g, '');
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    let keyCount = 0;
    for (const [key, value] of Object.entries(input)){
      if (keyCount++ > 20) break; // Limitar propriedades
      if (typeof value === 'string') {
        sanitized[key] = value.length > 500 ? value.substring(0, 500) + '...' : sanitizeInput(value);
      } else if (typeof value === 'object' && keyCount < 10) {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  return input;
}
// 🚫 REMOVIDO: MediaProcessor - agora usa fluxo direto RPC + Edge
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  try {
    // ✅ Verificar tamanho do payload antes de processar
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MEMORY_LIMITS.MAX_PAYLOAD_SIZE) {
      console.error('[Webhook] ❌ Payload muito grande:', contentLength);
      return new Response(JSON.stringify({
        success: false,
        error: 'Payload too large'
      }), {
        status: 413,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const body = await req.text();
    // Log removido - recebimento webhook
    // Verificação de signature (TEMPORARIAMENTE FLEXÍVEL)
    const signature = req.headers.get('x-webhook-signature');
    // Log removido - signature
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error('[Webhook] ❌ Signature inválida - MAS CONTINUANDO TEMPORARIAMENTE');
      }
    }
    const webhookData = JSON.parse(body);
    const sanitizedData = sanitizeInput(webhookData);
    console.log('[Webhook] 🔄 Processando evento:', {
      event: sanitizedData.event,
      instanceId: sanitizedData.instanceId,
      hasMessage: !!(sanitizedData.message || sanitizedData.data?.messages),
      hasMediaData: !!(sanitizedData.mediaBase64 || // ✅ inclusão: raiz
      sanitizedData.mediabase64 || sanitizedData.mediaData || sanitizedData.base64Data || sanitizedData.media || sanitizedData.buffer || sanitizedData.content || sanitizedData.data?.buffer || sanitizedData.data?.base64 || sanitizedData.message?.media || sanitizedData.data?.mediaData),
      timestamp: new Date().toISOString()
    });
    // Debug removido - payload completo
    // Debug removido - investigação mídia
    // Process different webhook events
    let result;
    switch(sanitizedData.event){
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
        result = {
          success: true,
          message: 'Event logged but not processed',
          event: sanitizedData.event
        };
    }
    // Log successful webhook processing
    await supabase.from('sync_logs').insert({
      function_name: 'webhook_whatsapp_web',
      status: 'success',
      result: {
        event: sanitizedData.event,
        instanceId: sanitizedData.instanceId,
        processed: true,
        hasMedia: !!(sanitizedData.mediaBase64 || // ✅ inclusão: raiz
        sanitizedData.data?.mediaBase64 || sanitizedData.mediabase64 || sanitizedData.mediaData || sanitizedData.base64Data || sanitizedData.media || sanitizedData.buffer || sanitizedData.content || sanitizedData.data?.buffer || sanitizedData.data?.base64 || sanitizedData.message?.media),
        timestamp: new Date().toISOString()
      }
    });
    console.log('[Webhook] ✅ Processamento concluído:', result);
    // ✅ Limpeza final de memória antes de retornar
    forceMemoryCleanup();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
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
    // ✅ Limpeza de memória mesmo em caso de erro
    forceMemoryCleanup();
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
async function processQRUpdate(supabase, data) {
  const { instanceId, qrCode } = data;
  console.log('[Webhook] 📱 Processando QR Code:', instanceId);
  if (!instanceId || !qrCode) {
    return {
      success: false,
      error: 'Missing required QR data'
    };
  }
  const { error } = await supabase.from('whatsapp_instances').update({
    qr_code: qrCode,
    web_status: 'waiting_scan',
    connection_status: 'waiting_scan',
    updated_at: new Date().toISOString()
  }).eq('vps_instance_id', instanceId);
  if (error) {
    console.error('[Webhook] ❌ Erro ao atualizar QR:', error);
    return {
      success: false,
      error: 'Failed to update QR code'
    };
  }
  return {
    success: true,
    message: 'QR code updated'
  };
}
// 🚀 FUNÇÃO PRINCIPAL REFORMULADA: Usar Storage + PGMQ existentes
async function processMessage(supabase, data) {
  // Detectar tipo real de mídia baseado em mime type ou extensão
  function detectRealMediaType(originalType, mimeType, fileName, hasBase64) {
    console.log('[Webhook] 🔍 Detectando tipo de mídia:', {
      originalType,
      mimeType,
      fileName,
      hasBase64: !!hasBase64
    });

    // Se já tem um tipo válido e não é 'unknown', manter
    if (originalType && originalType !== 'unknown' && originalType !== 'text') {
      console.log('[Webhook] ✅ Tipo original válido:', originalType);
      return originalType;
    }

    // Detectar por mimeType
    if (mimeType) {
      const mimeTypeLower = mimeType.toLowerCase();

      // PDFs
      if (mimeTypeLower.includes('pdf')) {
        console.log('[Webhook] 📄 Detectado PDF por mimeType');
        return 'document';
      }

      // Imagens
      if (mimeTypeLower.includes('image')) {
        console.log('[Webhook] 📷 Detectado imagem por mimeType');
        return 'image';
      }

      // Vídeos
      if (mimeTypeLower.includes('video')) {
        console.log('[Webhook] 🎥 Detectado vídeo por mimeType');
        return 'video';
      }

      // Áudios (incluindo voice notes)
      if (mimeTypeLower.includes('audio') || mimeTypeLower.includes('ogg')) {
        console.log('[Webhook] 🎵 Detectado áudio por mimeType');
        return 'audio';
      }

      // Documentos genéricos
      if (mimeTypeLower.includes('application')) {
        console.log('[Webhook] 📄 Detectado documento por mimeType');
        return 'document';
      }
    }

    // Detectar por extensão do arquivo
    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      console.log('[Webhook] 📁 Verificando extensão:', ext);

      if (ext === 'pdf') return 'document';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
      if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm'].includes(ext)) return 'video';
      if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'opus'].includes(ext)) return 'audio';
      if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(ext)) return 'document';
    }

    // Se tem base64 mas não detectou tipo, assumir documento
    if (hasBase64 && originalType === 'unknown') {
      console.log('[Webhook] ⚠️ Tipo desconhecido com base64, assumindo documento');
      return 'document';
    }

    const finalType = originalType || 'text';
    console.log('[Webhook] 📊 Tipo final detectado:', finalType);
    return finalType;
  }

  console.log('[Webhook] 📨 Processando mensagem com infraestrutura existente:', {
    instanceId: data.instanceId,
    hasMessage: !!(data.message || data.data?.messages),
    fromMe: data.fromMe || data.data?.messages?.[0]?.key?.fromMe,
    messageType: data.messageType || data.data?.messages?.[0]?.messageType,
    hasMediaData: !!(data.mediaBase64 || // ✅ inclusão: raiz
    data.data?.mediaBase64 || data.mediabase64 || data.mediaData || data.data?.mediaData || data.base64Data || data.media || data.buffer || data.content || data.data?.buffer || data.data?.base64 || data.message?.media),
    hasCaption: !!data.caption
  });
  // 🔍 EXTRAÇÃO COMPLETA DE DADOS DA MENSAGEM (garantir base64 em nested data.mediaData.base64Data)
  let messageData;
  if (data.data?.messages?.[0]) {
    // Formato Baileys (evolution API)
    const baileyMsg = data.data.messages[0];
    // Detectar tipo real da mídia
    const hasBase64Data = !!(data.mediaBase64 || data.data?.mediaBase64 || data.mediabase64 ||
                           data.base64Data || data.mediaData?.base64Data || data.data?.mediaData?.base64Data ||
                           (typeof data.data?.mediaData === 'string' ? data.data.mediaData : null) ||
                           (typeof data.mediaData === 'string' ? data.mediaData : null));

    const realMediaType = detectRealMediaType(
      data.messageType,
      data.mediaData?.mimeType || data.data?.mediaData?.mimeType || data.data?.mediaData?.mimetype,
      data.fileName || data.mediaData?.fileName || data.data?.mediaData?.fileName,
      hasBase64Data
    );

    messageData = {
      instanceId: data.instanceId,
      from: baileyMsg.key.remoteJid,
      fromMe: baileyMsg.key.fromMe,
      externalMessageId: baileyMsg.key.id,
      message: {
        text: (realMediaType && realMediaType !== 'text')
          ? getMediaDisplayName(realMediaType, data.mediaData?.mimeType || data.data?.mediaData?.mimeType) // 🔧 CORREÇÃO: Para mídia, sempre usar emoji
          : (baileyMsg.message?.conversation || baileyMsg.message?.extendedTextMessage?.text || data.message?.text || data.text || data.caption || '')
      },
      messageType: realMediaType === 'sticker' ? 'image' : realMediaType,
      mediaUrl: data.mediaUrl,
      // ❌ REMOVIDO: contactName - usar apenas telefone formatado
      // 🚀 DADOS DE MÍDIA EXTRAÍDOS - CORREÇÃO APLICADA
      mediaData: {
        base64Data: data.mediaBase64 || // raiz
        data.data?.mediaBase64 || 
        data.mediabase64 || 
        data.base64Data || 
        data.mediaData?.base64Data || 
        data.data?.mediaData?.base64Data || 
        (typeof data.data?.mediaData === 'string' ? data.data.mediaData : null) || // 🔧 CORREÇÃO: mediaData pode ser string Base64 direta
        (typeof data.mediaData === 'string' ? data.mediaData : null) || // 🔧 CORREÇÃO: mediaData pode ser string Base64 direta
        data.media?.base64 || 
        data.buffer || 
        data.content || 
        data.data?.buffer || 
        data.data?.base64 || 
        data.message?.media?.buffer,
        fileName: data.fileName || data.mediaData?.fileName || data.data?.mediaData?.fileName,
        mediaType: data.messageType || data.mediaData?.mediaType || data.data?.mediaData?.mediaType,
        caption: data.caption || data.mediaData?.caption || data.data?.mediaData?.caption,
        externalMessageId: baileyMsg.key.id
      }
    };
  } else {
    // Formato direto da VPS

    // Debug removido - estrutura mediaData

    // Detectar tipo real da mídia
    const hasBase64Data = !!(data.mediaBase64 || data.data?.mediaBase64 || data.mediabase64 ||
                           data.base64Data || data.mediaData?.base64Data || data.data?.mediaData?.base64Data ||
                           (typeof data.data?.mediaData === 'string' ? data.data.mediaData : null) ||
                           (typeof data.mediaData === 'string' ? data.mediaData : null));

    const realMediaType = detectRealMediaType(
      data.messageType,
      data.mediaData?.mimeType || data.data?.mediaData?.mimeType || data.data?.mediaData?.mimetype,
      data.fileName || data.mediaData?.fileName || data.data?.mediaData?.fileName,
      hasBase64Data
    );

    messageData = {
      instanceId: data.instanceId,
      from: data.from,
      fromMe: data.fromMe,
      externalMessageId: data.data?.messageId || data.messageId || data.id || data.external_message_id,
      message: {
        text: (realMediaType && realMediaType !== 'text')
          ? getMediaDisplayName(realMediaType, data.mediaData?.mimeType || data.data?.mediaData?.mimeType) // 🔧 CORREÇÃO: Para mídia, sempre usar emoji
          : (data.message?.text || data.text || data.caption || '')
      },
      messageType: realMediaType === 'sticker' ? 'image' : realMediaType,
      mediaUrl: data.mediaUrl,
      // ❌ REMOVIDO: contactName - usar apenas telefone formatado
      profile_pic_url: data.profilePicUrl || data.profile_pic_url || data.data?.profile_pic_url || data.senderProfilePicUrl || null,
      // 🚀 CORREÇÃO: Verificar todos os possíveis campos dentro de data.data.mediaData
      mediaData: {
        base64Data: data.mediaBase64 || // raiz
        data.data?.mediaBase64 ||
        data.mediabase64 ||
        data.base64Data ||
        data.mediaData?.base64Data ||
        data.data?.mediaData?.base64Data || // objeto.base64Data
        data.data?.mediaData?.base64 || // objeto.base64
        data.data?.mediaData?.data || // objeto.data
        data.data?.mediaData?.buffer || // objeto.buffer
        data.data?.mediaData?.content || // objeto.content
        (typeof data.data?.mediaData === 'string' ? data.data.mediaData : null) || // string direta
        (typeof data.mediaData === 'string' ? data.mediaData : null) || // string direta
        data.media?.base64 ||
        data.buffer ||
        data.content ||
        data.data?.buffer ||
        data.data?.base64 ||
        data.message?.media?.buffer,
        fileName: data.fileName || data.mediaData?.fileName || data.data?.mediaData?.fileName,
        mediaType: data.messageType || data.mediaData?.mediaType || data.data?.mediaData?.mediaType,
        mimeType: data.data?.mediaData?.mimeType || data.data?.mediaData?.mimetype || null, // 🎯 ADD mimeType
        caption: data.caption || data.mediaData?.caption || data.data?.mediaData?.caption,
        externalMessageId: data.data?.messageId || data.messageId || data.id || data.external_message_id
      }
    };
  }
  if (!messageData.instanceId || !messageData.from) {
    console.error('[Webhook] ❌ Dados de mensagem incompletos:', messageData);
    return {
      success: false,
      error: 'Missing required message data'
    };
  }
  // 🚀 STEP 1: BUSCAR UUID REAL DA INSTÂNCIA
  console.log('[Webhook] 🔍 Buscando UUID da instância:', messageData.instanceId);
  
  // Buscar o UUID real na tabela whatsapp_instances
  // O instanceId da VPS corresponde ao campo 'instance_name' na tabela
  const { data: instanceData, error: instanceError } = await supabase
    .from('whatsapp_instances')
    .select('id, created_by_user_id, instance_name, funnel_id')
    .eq('instance_name', messageData.instanceId)  // instanceId da VPS = instance_name na tabela
    .single();
  
  let vpsInstanceUuid = null;
  
  if (instanceData?.created_by_user_id) {
    // Usar o created_by_user_id como UUID para o salvamento
    vpsInstanceUuid = instanceData.created_by_user_id;
    console.log('[Webhook] ✅ UUID do usuário encontrado:', vpsInstanceUuid);
  } else {
    // Fallback: usar UUID padrão se não encontrar
    vpsInstanceUuid = '712e7708-2299-4a00-9128-577c8f113ca4';
    console.log('[Webhook] ⚠️ UUID não encontrado para instanceId:', messageData.instanceId, ', usando padrão:', vpsInstanceUuid);
  }

  // 🎯 EXTRAIR FUNNEL_ID DA INSTÂNCIA (se tiver)
  const instanceFunnelId = instanceData?.funnel_id || null;

  console.log('[Webhook] 🎯 Funil da instância:', {
    instanceId: messageData.instanceId,
    funnelId: instanceFunnelId,
    hasInstanceFunnel: !!instanceFunnelId
  });
  
  // 💾 Salvando mensagem via RPC
  if (messageData.mediaData?.base64Data) {
    console.log('[Webhook] 📤 Processando mídia:', messageData.messageType);
  }
  
  // Limpar telefone
  const cleanPhone = messageData.from.replace('@s.whatsapp.net', '').replace('@c.us', '');

  // 🆕 Extrair MIME type do prefixo base64 (data:MIME;base64,...)
  function extractMimeTypeFromBase64(base64String: string): string | null {
    if (!base64String) return null;

    const match = base64String.match(/^data:([^;]+);base64,/);
    if (match && match[1]) {
      console.log('[Webhook] 🔍 MIME extraído do base64:', match[1]);
      return match[1];
    }
    return null;
  }

  // 🎯 Determinar MIME type baseado no messageType se não vier explicitamente
  function getMimeType(messageType: string): string {
    switch (messageType) {
      case 'image': return 'image/jpeg';
      case 'video': return 'video/mp4';
      case 'audio': return 'audio/ogg'; // ← 🔧 CORRIGIDO: audio genérico é OGG
      case 'document': return 'application/pdf';
      case 'sticker': return 'image/webp';
      case 'voice': return 'audio/ogg';
      case 'ptt': return 'audio/ogg';
      default: return 'application/octet-stream';
    }
  }

  // 🆕 Converter MIME type para extensão de arquivo (equivalente à helper function SQL)
  function getFileExtensionFromMime(mimeType: string | null | undefined, mediaType: string): string {
    const mime = (mimeType || '').toLowerCase().trim();

    // 🎵 AUDIO
    if (mime.startsWith('audio/ogg')) return 'ogg';
    if (mime === 'audio/mpeg' || mime === 'audio/mp3') return 'mp3';
    if (mime === 'audio/wav') return 'wav';
    if (mime === 'audio/aac') return 'aac';
    if (mime === 'audio/m4a') return 'm4a';
    if (mime === 'audio/webm') return 'webm';

    // 🖼️ IMAGE
    if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
    if (mime === 'image/png') return 'png';
    if (mime === 'image/gif') return 'gif';
    if (mime === 'image/webp') return 'webp';
    if (mime === 'image/svg+xml') return 'svg';

    // 🎬 VIDEO
    if (mime === 'video/mp4') return 'mp4';
    if (mime === 'video/webm') return 'webm';
    if (mime === 'video/quicktime') return 'mov';
    if (mime === 'video/x-msvideo') return 'avi';

    // 📄 DOCUMENT
    if (mime === 'application/pdf') return 'pdf';
    if (mime.startsWith('application/vnd.ms-excel')) return 'xls';
    if (mime.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')) return 'xlsx';
    if (mime.startsWith('application/vnd.ms-powerpoint')) return 'ppt';
    if (mime.startsWith('application/vnd.openxmlformats-officedocument.presentationml')) return 'pptx';
    if (mime.startsWith('application/msword')) return 'doc';
    if (mime.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml')) return 'docx';
    if (mime === 'text/plain') return 'txt';
    if (mime === 'application/zip') return 'zip';
    if (mime === 'application/x-rar-compressed') return 'rar';

    // 🎨 DESIGN
    if (mime === 'application/postscript') return 'ai';
    if (mime === 'image/vnd.adobe.photoshop') return 'psd';

    // 🔄 FALLBACK: Extrair segunda parte do MIME (ex: audio/mpeg → mpeg)
    const mimeParts = mime.split('/');
    if (mimeParts.length === 2 && mimeParts[1]) {
      // Remover parâmetros extras (ex: "ogg; codecs=opus" → "ogg")
      const extension = mimeParts[1].split(';')[0].trim();
      if (extension) return extension;
    }

    // 🔄 FALLBACK FINAL: Usar media_type
    switch (mediaType.toLowerCase()) {
      case 'audio': return 'ogg';  // ⚠️ Default para áudio é OGG (WhatsApp)
      case 'image': return 'jpg';
      case 'video': return 'mp4';
      case 'document': return 'pdf';
      case 'sticker': return 'webp';
      default: return 'bin';
    }
  }

  // 🆕 Extrair MIME type real do base64 primeiro
  const mimeTypeFromBase64 = extractMimeTypeFromBase64(messageData.mediaData?.base64Data);

  // 🔍 DEBUG DETALHADO: Log dos parâmetros exatos que serão enviados para a RPC
  const rpcParams = {
    p_vps_instance_id: messageData.instanceId,  // 🎯 USAR NOME DA INSTÂNCIA
    p_phone: cleanPhone,  // 🧹 TELEFONE LIMPO SEM @s.whatsapp.net
    p_message_text: messageData.message.text || '',
    p_from_me: Boolean(messageData.fromMe),
    p_media_type: messageData.messageType || 'text',
    p_media_url: null, // 🎯 SEMPRE NULL - será preenchido pela edge de upload
    p_external_message_id: messageData.externalMessageId || null,
    p_contact_name: null, // ❌ SEMPRE NULL - forçar uso do telefone formatado
    p_profile_pic_url: messageData.profile_pic_url || null, // 📸 PROFILE PIC URL
    p_base64_data: messageData.mediaData?.base64Data || null, // 🎯 Base64 real para upload
    p_mime_type: mimeTypeFromBase64 || messageData.mediaData?.mimeType || messageData.mediaData?.mimetype || getMimeType(messageData.messageType) || null, // 🎯 MIME type: 1º base64, 2º mediaData, 3º fallback
    p_file_name: messageData.mediaData?.fileName || null,      // 🎯 Nome do arquivo
    p_whatsapp_number_id: instanceData?.id || null,  // 🆔 UUID da instância WhatsApp
    p_source_edge: 'webhook_whatsapp_web',  // 🏷️ Identificar a Edge
    p_instance_funnel_id: instanceFunnelId  // 🎯 NOVO: Funil da instância
  };

  // Log DETALHADO para debug de áudio
  if (rpcParams.p_media_type !== 'text') {
    console.log('[Webhook] 📤 Mídia processada:', {
      tipo: rpcParams.p_media_type,
      tamanho: rpcParams.p_base64_data?.length || 0,
      mimeType: rpcParams.p_mime_type,
      hasBase64: !!rpcParams.p_base64_data,
      base64Preview: rpcParams.p_base64_data ? rpcParams.p_base64_data.substring(0, 50) + '...' : 'NULL'
    });

    // ⚠️ ALERTA: Se for áudio sem base64, algo está errado
    if (rpcParams.p_media_type === 'audio' && !rpcParams.p_base64_data) {
      console.warn('[Webhook] ⚠️ ÁUDIO SEM BASE64! Edge de upload NÃO será chamada!');
      console.warn('[Webhook] 📊 mediaData completo:', messageData.mediaData);
    }
  }

  console.log('[Webhook] 🚀 Chamando RPC save_received_message_webhook...');

  const { data: result, error } = await supabase.rpc('save_received_message_webhook', rpcParams);

  console.log('[Webhook] 📊 RPC RESULT:', {
    hasError: !!error,
    errorMessage: error?.message,
    errorDetails: error?.details,
    errorHint: error?.hint,
    errorCode: error?.code,
    hasResult: !!result,
    resultType: typeof result,
    resultKeys: result ? Object.keys(result) : null,
    resultSuccess: result?.success,
    resultError: result?.error,
    media_processing: result?.media_processing, // 🎯 VERIFICAR SE RETORNOU TRUE
    full_result: result // 🔍 DEBUG: Ver resultado completo
  });

  if (error) {
    console.error('[Webhook] ❌ ERRO RPC DETALHADO:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      params_sent: rpcParams
    });
    return {
      success: false,
      error: 'RPC Error: ' + error.message
    };
  }

  // Verificar sucesso - aceitar ambos formatos de resposta
  const messageId = result?.message_id || result?.data?.message_id;
  const success = result?.success || result?.data?.success;

  if (!messageId && !success) {
    console.error('[Webhook] ❌ Falha no salvamento');
    return {
      success: false,
      error: 'Failed to save message'
    };
  }

  console.log('[Webhook] ✅ Mensagem salva:', messageId);

  // 🚀 UPLOAD DIRETO PARA STORAGE (arquitetura simplificada)
  // Helper function garante extensão correta baseada no MIME type
  const hadMediaData = !!(messageData.mediaData?.base64Data && messageData.messageType !== 'text');
  if (hadMediaData) {
    // 🎯 Calcular extensão correta usando helper function
    const correctExtension = getFileExtensionFromMime(rpcParams.p_mime_type, rpcParams.p_media_type);

    console.log('[Webhook] 📤 Iniciando upload:', {
      message_id: messageId,
      mime_type: rpcParams.p_mime_type,
      media_type: rpcParams.p_media_type,
      extension: correctExtension
    });

    // 🚀 FIRE-AND-FORGET: Upload assíncrono
    fetch(`${supabaseUrl}/functions/v1/webhook_storage_upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        message_id: messageId,
        file_path: `webhook/${instanceData?.id}/${messageId}.${correctExtension}`,
        base64_data: messageData.mediaData.base64Data,
        content_type: rpcParams.p_mime_type
      })
    })
    .then(response => response.json())
    .then(uploadResult => {
      console.log('[Webhook] 📊 Upload resultado:', uploadResult);
      if (uploadResult.success) {
        console.log('[Webhook] ✅ Upload concluído:', uploadResult.url);
      } else {
        console.error('[Webhook] ❌ Erro no upload:', uploadResult);
      }
    })
    .catch(uploadError => {
      console.error('[Webhook] ❌ Erro na chamada de upload:', uploadError);
    });

    console.log('[Webhook] 🚀 Upload disparado - extensão:', correctExtension);

    // ✅ Limpeza da mídia da memória IMEDIATAMENTE
    messageData.mediaData.base64Data = null;
    messageData.mediaData = null;
  } else {
    console.log('[Webhook] 📝 Mensagem de texto - sem processamento de mídia necessário');
  }
  // ✅ Forçar limpeza de memória após processamento
  forceMemoryCleanup();
  return {
    success: true,
    message: 'Message processed with optimized direct flow',
    data: {
      ...result.data,
      mediaProcessed: hadMediaData,
      usedDirectFlow: true,
      architecture: 'RPC + Edge + WebSocket'
    }
  };
}
async function processConnectionUpdate(supabase, data) {
  const { instanceId, status, phone, profileName } = data;
  console.log('[Webhook] 🔗 Processando conexão:', {
    instanceId,
    status,
    hasPhone: !!phone
  });
  if (!instanceId || !status) {
    return {
      success: false,
      error: 'Missing connection data'
    };
  }
  const { error } = await supabase.from('whatsapp_instances').update({
    connection_status: status,
    web_status: status,
    phone: phone || null,
    profile_name: profileName || null,
    date_connected: status === 'connected' ? new Date().toISOString() : null,
    date_disconnected: status === 'disconnected' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  }).eq('vps_instance_id', instanceId);
  if (error) {
    console.error('[Webhook] ❌ Erro ao atualizar conexão:', error);
    return {
      success: false,
      error: 'Failed to update connection'
    };
  }
  return {
    success: true,
    message: 'Connection updated'
  };
}
