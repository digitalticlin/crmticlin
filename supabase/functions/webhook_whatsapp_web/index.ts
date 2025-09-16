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
console.log('[Webhook] 🚀 Inicializando webhook WhatsApp Web v3.1 - OTIMIZADO PARA MEMÓRIA');
console.log('[Webhook] 🔑 Webhook secret configurado:', !!webhookSecret);
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
function getMediaDisplayName(mediaType) {
  const mediaNames = {
    'image': '📷 Imagem',
    'video': '🎥 Vídeo',
    'audio': '🎵 Áudio',
    'document': '📄 Documento',
    'sticker': '😊 Sticker',
    'voice': '🎤 Áudio',
    'ptt': '🎤 Áudio'
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
      hasMediaData: !!(sanitizedData.mediaBase64 || // ✅ inclusão: raiz
      sanitizedData.mediabase64 || sanitizedData.mediaData || sanitizedData.base64Data || sanitizedData.media || sanitizedData.buffer || sanitizedData.content || sanitizedData.data?.buffer || sanitizedData.data?.base64 || sanitizedData.message?.media || sanitizedData.data?.mediaData),
      timestamp: new Date().toISOString()
    });
    // 🚨 DEBUG: Log completo dos dados recebidos
    console.log('[Webhook] 📋 PAYLOAD COMPLETO VPS:', {
      allKeys: Object.keys(sanitizedData),
      messageType: sanitizedData.messageType,
      mediaBase64_exists: !!sanitizedData.mediaBase64,
      mediabase64_exists: !!sanitizedData.mediabase64,
      mediaData_exists: !!sanitizedData.mediaData,
      base64Data_exists: !!sanitizedData.base64Data,
      media_exists: !!sanitizedData.media,
      buffer_exists: !!sanitizedData.buffer,
      content_exists: !!sanitizedData.content,
      data_buffer_exists: !!sanitizedData.data?.buffer,
      data_base64_exists: !!sanitizedData.data?.base64,
      message_media_exists: !!sanitizedData.message?.media,
      data_mediaData_exists: !!sanitizedData.data?.mediaData,
      payload_size: JSON.stringify(sanitizedData).length
    });
    // 🚨 INVESTIGAÇÃO DETALHADA: Onde está a mídia?
    if (sanitizedData.messageType !== 'text') {
      console.log('[Webhook] 🔍 INVESTIGAÇÃO DE MÍDIA DETALHADA:', {
        messageType: sanitizedData.messageType,
        topLevelKeys: Object.keys(sanitizedData).slice(0, 10),
        // Verificar campos diretos
        directMedia: {
          mediaBase64: sanitizedData.mediaBase64 ? 'EXISTS' : null,
          mediabase64: sanitizedData.mediabase64 ? 'EXISTS' : null,
          mediaData: sanitizedData.mediaData ? 'EXISTS' : undefined,
          base64Data: sanitizedData.base64Data ? 'EXISTS' : null,
          media: sanitizedData.media ? 'EXISTS' : undefined,
          buffer: sanitizedData.buffer ? 'EXISTS' : null,
          content: sanitizedData.content ? 'EXISTS' : null
        },
        // Verificar campos aninhados
        nestedMedia: {
          data_keys: sanitizedData.data ? Object.keys(sanitizedData.data).slice(0, 10) : null,
          data_buffer: sanitizedData.data?.buffer ? 'EXISTS' : null,
          data_base64: sanitizedData.data?.base64 ? 'EXISTS' : null,
          message_keys: sanitizedData.message ? Object.keys(sanitizedData.message).slice(0, 10) : null,
          message_media: sanitizedData.message?.media ? 'EXISTS' : undefined
        }
      });
    }
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
    messageData = {
      instanceId: data.instanceId,
      from: baileyMsg.key.remoteJid,
      fromMe: baileyMsg.key.fromMe,
      externalMessageId: baileyMsg.key.id,
      message: {
        text: (data.messageType && data.messageType !== 'text')
          ? getMediaDisplayName(data.messageType) // 🔧 CORREÇÃO: Para mídia, sempre usar emoji
          : (baileyMsg.message?.conversation || baileyMsg.message?.extendedTextMessage?.text || data.message?.text || data.text || data.caption || '')
      },
      messageType: data.messageType === 'sticker' ? 'image' : (data.messageType === 'unknown' ? 'text' : data.messageType) || 'text',
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
    messageData = {
      instanceId: data.instanceId,
      from: data.from,
      fromMe: data.fromMe,
      externalMessageId: data.data?.messageId || data.messageId || data.id || data.external_message_id,
      message: {
        text: (data.messageType && data.messageType !== 'text') 
          ? getMediaDisplayName(data.messageType) // 🔧 CORREÇÃO: Para mídia, sempre usar emoji
          : (data.message?.text || data.text || data.caption || '')
      },
      messageType: data.messageType === 'sticker' ? 'image' : (data.messageType === 'unknown' ? 'text' : data.messageType) || 'text',
      mediaUrl: data.mediaUrl,
      // ❌ REMOVIDO: contactName - usar apenas telefone formatado
      profile_pic_url: data.profilePicUrl || data.profile_pic_url || data.data?.profile_pic_url || data.senderProfilePicUrl || null,
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
    .select('id, created_by_user_id, instance_name')
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
  
  // 💾 Salvando mensagem via RPC
  if (messageData.mediaData?.base64Data) {
    console.log('[Webhook] 📤 Processando mídia:', messageData.messageType);
  }
  
  // Limpar telefone
  const cleanPhone = messageData.from.replace('@s.whatsapp.net', '').replace('@c.us', '');

  // 🔍 DEBUG DETALHADO: Log dos parâmetros exatos que serão enviados para a RPC
  const rpcParams = {
    p_vps_instance_id: messageData.instanceId,  // 🎯 USAR NOME DA INSTÂNCIA
    p_phone: cleanPhone,  // 🧹 TELEFONE LIMPO SEM @s.whatsapp.net
    p_message_text: messageData.message.text || '',
    p_from_me: Boolean(messageData.fromMe),
    p_media_type: messageData.messageType === 'sticker' ? 'image' : messageData.messageType === 'unknown' ? 'text' : messageData.messageType || 'text',
    p_media_url: messageData.mediaData?.media_url || null, // 🎯 URL real da mídia
    p_external_message_id: messageData.externalMessageId || null,
    p_contact_name: null,
    p_profile_pic_url: messageData.profile_pic_url || null, // 📸 PROFILE PIC URL
    p_base64_data: messageData.mediaData?.base64Data || null, // 🎯 Base64 real
    p_mime_type: messageData.mediaData?.mimeType || null,     // 🎯 MIME type
    p_file_name: messageData.mediaData?.fileName || null,      // 🎯 Nome do arquivo
    p_whatsapp_number_id: instanceData?.id || null,  // 🆔 UUID da instância WhatsApp
    p_source_edge: 'webhook_whatsapp_web'  // 🏷️ Identificar a Edge
  };

  console.log('[Webhook] 🔍 DEBUG RPC PARAMS:', {
    p_vps_instance_id: rpcParams.p_vps_instance_id,
    p_phone: rpcParams.p_phone,
    p_message_text: rpcParams.p_message_text?.substring(0, 100) + (rpcParams.p_message_text?.length > 100 ? '...' : ''),
    p_from_me: rpcParams.p_from_me,
    p_media_type: rpcParams.p_media_type,
    p_external_message_id: rpcParams.p_external_message_id,
    p_whatsapp_number_id: rpcParams.p_whatsapp_number_id,
    p_source_edge: rpcParams.p_source_edge,
    instanceData_found: !!instanceData,
    instance_name: instanceData?.instance_name,
    cleanPhone_length: cleanPhone?.length
  });

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
    resultError: result?.error
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
  // Upload de mídia iniciado
  const hadMediaData = !!(messageData.mediaData?.base64Data && messageData.messageType !== 'text');
  if (hadMediaData) {
    console.log('[Webhook] 📤 Upload iniciado:', messageId);

    // ✅ Limpeza imediata da mídia da memória
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
