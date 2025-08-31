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
  MAX_PAYLOAD_SIZE: 20 * 1024 * 1024, // 20MB máximo
  MAX_BASE64_SIZE: 3 * 1024 * 1024, // 3MB para processamento direto
  MAX_LOG_SIZE: 1000, // Máximo de caracteres em logs
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
    return input.length > MEMORY_LIMITS.MAX_LOG_SIZE ? 
      input.substring(0, MEMORY_LIMITS.MAX_LOG_SIZE) + '...' : 
      input.replace(/[<>\"']/g, '');
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
// 🚀 FUNÇÃO PARA USAR PGMQ EXISTENTE
async function enqueueMediaProcessing(supabase, messageId, mediaData) {
  try {
    console.log('[Media] 📦 Enfileirando na PGMQ existente:', {
      messageId,
      mediaType: mediaData.mediaType,
      hasBase64: !!mediaData.base64Data,
      dataSize: mediaData.base64Data?.length || 0
    });
    // Usar a fila existente
    const { data, error } = await supabase.rpc('pgmq_send', {
      queue_name: 'media_processing_queue',
      msg: {
        type: 'process_media',
        messageId,
        mediaData,
        priority: 'high',
        timestamp: new Date().toISOString()
      }
    });
    if (error) {
      console.error('[Media] ❌ Erro ao enfileirar na PGMQ:', error);
      return false;
    }
    console.log('[Media] ✅ Mídia enfileirada na PGMQ existente');
    return true;
  } catch (error) {
    console.error('[Media] ❌ Erro crítico no enfileiramento PGMQ:', error);
    return false;
  }
}
// 🚀 CLASSE PARA USAR SUPABASE STORAGE EXISTENTE
class MediaProcessor {
  static async processMediaOptimized(supabase, messageId, mediaData) {
    try {
      if (mediaData.base64Data) {
        // ✅ Verificar tamanho antes de processar
        const dataSize = mediaData.base64Data.length;
        const sizeMB = (dataSize / 1024 / 1024).toFixed(2);
        
        console.log(`[Media] 📏 Mídia detectada: ${sizeMB}MB`);
        
        // ✅ Se muito grande, enfileirar imediatamente
        if (dataSize > MEMORY_LIMITS.MAX_BASE64_SIZE) {
          console.log(`[Media] 🚀 Mídia grande (${sizeMB}MB) - enfileirando diretamente`);
          return await enqueueMediaProcessing(supabase, messageId, mediaData);
        }
        
        // Usar limite específico por tipo de mídia
        const sizeLimit = this.getSizeLimit(mediaData.mediaType);
        // Validar mídia primeiro
        const validation = this.validateMedia(mediaData);
        console.log('[Media] 📊 Processando mídia com limites dinâmicos:', {
          messageId,
          externalMessageId: mediaData.externalMessageId,
          mediaType: mediaData.mediaType,
          sizeBytes: dataSize,
          sizeMB: (dataSize / 1024 / 1024).toFixed(2),
          limitMB: (sizeLimit / 1024 / 1024).toFixed(2),
          willProcessSync: dataSize <= sizeLimit,
          isValid: validation.valid,
          validationError: validation.error
        });
        if (!validation.valid) {
          console.error('[Media] ❌ Mídia inválida:', validation.error);
          return false;
        }
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
  static async processSyncMediaWithStorage(supabase, messageId, mediaData) {
    try {
      console.log('[Media] 🔄 Processamento síncrono com Storage existente:', messageId);
      // 1. Validar mídia primeiro
      const validation = this.validateMedia(mediaData);
      if (!validation.valid) {
        console.error('[Media] ❌ Mídia inválida - não será processada:', validation.error);
        // ❌ SEM FALLBACK - apenas aceitar mídia válida para Storage
        return false;
      }
      // 2. Converter base64 para buffer
      let base64Data = mediaData.base64Data;
      // Se não é Data URL, extrair apenas o base64
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for(let i = 0; i < binaryString.length; i++){
        bytes[i] = binaryString.charCodeAt(i);
      }
      // 3. Detectar MIME type inteligentemente (incluindo Apple HEIC/HEVC)
      const mimeType = this.getMimeTypeFromBase64(mediaData.base64Data, mediaData.mediaType);
      const extension = this.getFileExtension(mimeType);
      const fileName = `media_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
      console.log('[Media] 🍎 Processando mídia com detecção avançada:', {
        originalType: mediaData.mediaType,
        detectedMime: mimeType,
        extension,
        isAppleFormat: mimeType.includes('heic') || mimeType.includes('heif') || mimeType.includes('hevc'),
        sizeMB: (bytes.length / 1024 / 1024).toFixed(2)
      });
      // 4. Upload para Storage com retry (até 3 tentativas)
      let uploadData, uploadError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`[Media] 📤 Tentativa ${attempt}/3 de upload para Storage...`);
        
        const result = await supabase.storage.from('whatsapp-media').upload(fileName, bytes, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: attempt > 1 // Permitir sobrescrever nas tentativas subsequentes
        });
        
        uploadData = result.data;
        uploadError = result.error;
        
        if (!uploadError) {
          console.log(`[Media] ✅ Upload bem-sucedido na tentativa ${attempt}`);
          break;
        }
        
        console.warn(`[Media] ⚠️ Tentativa ${attempt} falhou:`, uploadError);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Backoff progressivo
        }
      }
      
      if (uploadError) {
        console.error('[Media] ❌ Todas as tentativas de upload falharam - mídia não será processada:', uploadError);
        return false;
      }
      // 5. Obter URL pública
      const { data: urlData } = supabase.storage.from('whatsapp-media').getPublicUrl(fileName);
      const storageUrl = urlData.publicUrl;
      // 6. Salvar (idempotente) no cache de mídia
      const { error: cacheError } = await supabase
        .from('media_cache')
        .upsert({
          message_id: messageId,
          original_url: storageUrl,
          cached_url: storageUrl,
          base64_data: mediaData.base64Data ? `data:${mimeType};base64,${base64Data}` : null,
          file_name: mediaData.fileName || fileName,
          file_size: bytes.length,
          media_type: mediaData.mediaType === 'sticker' ? 'image' : (mediaData.mediaType === 'unknown' ? 'text' : mediaData.mediaType),
          external_message_id: mediaData.externalMessageId || null,
          processing_status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'message_id' });
      if (cacheError) {
        console.error('[Media] ❌ Erro ao salvar cache:', cacheError);
        return false;
      }
      // 7. Atualizar mensagem com URL do Storage
      const { error: updateError } = await supabase.from('messages').update({
        media_url: storageUrl,
        text: mediaData.caption || ''
      }).eq('id', messageId);
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
  static async processSyncMediaFallback(supabase, messageId, mediaData) {
    try {
      console.log('[Media] 🔄 Fallback: salvando base64 no cache:', messageId);
      // Detectar MIME type inteligentemente para Data URL
      const mimeType = this.getMimeTypeFromBase64(mediaData.base64Data, mediaData.mediaType);
      // Extrair base64 puro se necessário
      let base64Data = mediaData.base64Data;
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }
      // Salvar no cache de mídia como fallback (idempotente)
      const cachedUrl = `data:${mimeType};base64,${base64Data}`;
      console.log('[Media] 🍎 Fallback com detecção avançada:', {
        originalType: mediaData.mediaType,
        detectedMime: mimeType,
        isAppleFormat: mimeType.includes('heic') || mimeType.includes('heif') || mimeType.includes('hevc'),
        dataUrlLength: cachedUrl.length
      });
      const { error: cacheError } = await supabase
        .from('media_cache')
        .upsert({
          message_id: messageId,
          base64_data: cachedUrl,
          cached_url: cachedUrl,
          original_url: `base64://${mediaData.externalMessageId || Date.now()}`,
          file_name: mediaData.fileName || `media_${Date.now()}`,
          file_size: mediaData.base64Data.length,
          media_type: mediaData.mediaType === 'sticker' ? 'image' : (mediaData.mediaType === 'unknown' ? 'text' : mediaData.mediaType),
          external_message_id: mediaData.externalMessageId || null,
          processing_status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'message_id' });
      if (cacheError) {
        console.error('[Media] ❌ Erro ao salvar cache fallback:', cacheError);
        return false;
      }
      // ❌ NÃO USAR FALLBACK BASE64 - tentar Storage mesmo em falha
      console.warn('[Media] ⚠️ Fallback desabilitado - mensagem ficará sem mídia temporariamente');
      
      // Atualizar apenas o texto, sem salvar base64 na media_url
      const { error: updateError } = await supabase.from('messages').update({
        text: mediaData.caption || ''
      }).eq('id', messageId);
      if (updateError) {
        console.error('[Media] ❌ Erro ao atualizar mensagem fallback:', updateError);
        return false;
      }
      console.log('[Media] ⚠️ Mídia não processada - aguardando reprocessamento:', messageId);
      return true;
    } catch (error) {
      console.error('[Media] ❌ Erro no fallback:', error);
      return false;
    }
  }
  // 🚀 DETECÇÃO INTELIGENTE DE MIME TYPE BASEADA NO BASE64
  static getMimeTypeFromBase64(base64Data, fallbackType) {
    // Extrair MIME do Data URL se presente
    if (base64Data.startsWith('data:')) {
      const mimeMatch = base64Data.match(/^data:([^;]+)/);
      if (mimeMatch) {
        const detectedMime = mimeMatch[1];
        // 🔧 CORREÇÃO: Mapear tipos problemáticos para tipos corretos
        const mimeCorrections = {
          'application/postscript': 'application/pdf',
          'application/octet-stream': fallbackType === 'document' ? 'application/pdf' : 'application/octet-stream'
        };
        return mimeCorrections[detectedMime] || detectedMime;
      }
    }
    // Fallback baseado no tipo com suporte completo
    const fallbackMimes = {
      'image': 'image/jpeg',
      'video': 'video/mp4', 
      'audio': 'audio/mpeg',
      'document': 'application/pdf',
      'sticker': 'image/webp',
      'text': 'text/plain'
    };
    return fallbackMimes[fallbackType] || 'application/octet-stream';
  }
  // 🍎 EXTENSÕES CORRETAS INCLUINDO FORMATOS APPLE
  static getFileExtension(mimeType) {
    const extensions = {
      // 🖼️ IMAGENS (incluindo Apple HEIC e todos formatos)
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff',
      'image/tif': 'tiff',
      'image/svg+xml': 'svg',
      'image/avif': 'avif',
      'image/heic': 'heic',
      'image/heif': 'heif',
      // 🎥 VÍDEOS (incluindo Apple HEVC e todos formatos)
      'video/mp4': 'mp4',
      'video/mpeg': 'mpg',
      'video/avi': 'avi',
      'video/mov': 'mov',
      'video/wmv': 'wmv',
      'video/flv': 'flv',
      'video/webm': 'webm',
      'video/3gpp': '3gp',
      'video/hevc': 'mov',
      'video/h265': 'mov',
      'video/quicktime': 'mov',
      // 🎵 ÁUDIOS (todos formatos)
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/mp4': 'm4a',
      'audio/aac': 'aac',
      'audio/wav': 'wav',
      'audio/flac': 'flac',
      'audio/amr': 'amr',
      'audio/ogg': 'ogg',
      'audio/opus': 'opus',
      'audio/webm': 'webm',
      // 📄 DOCUMENTOS (todos formatos Office e mais)
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'text/csv': 'csv',
      'application/rtf': 'rtf',
      // Microsoft Office
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      // LibreOffice/OpenOffice
      'application/vnd.oasis.opendocument.text': 'odt',
      'application/vnd.oasis.opendocument.spreadsheet': 'ods',
      'application/vnd.oasis.opendocument.presentation': 'odp',
      // Arquivos compactados
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar',
      'application/x-7z-compressed': '7z',
      // Outros
      'application/json': 'json',
      'application/xml': 'xml',
      'text/html': 'html',
      'text/css': 'css',
      'application/javascript': 'js'
    };
    return extensions[mimeType] || 'bin';
  }
  // 📏 LIMITES DE TAMANHO POR TIPO
  static getSizeLimit(mediaType) {
    const limits = {
      'image': 5 * 1024 * 1024,
      'video': 16 * 1024 * 1024,
      'audio': 16 * 1024 * 1024,
      'document': 100 * 1024 * 1024,
      'sticker': 500 * 1024 // 500KB
    };
    return limits[mediaType] || 2 * 1024 * 1024; // Default 2MB
  }
  // ✅ VALIDAÇÃO COMPLETA DE MÍDIA
  static validateMedia(mediaData) {
    if (!mediaData.base64Data) {
      return {
        valid: false,
        error: 'Base64 data missing'
      };
    }
    const sizeLimit = this.getSizeLimit(mediaData.mediaType);
    const actualSize = mediaData.base64Data.length;
    if (actualSize > sizeLimit) {
      return {
        valid: false,
        error: `File too large: ${(actualSize / 1024 / 1024).toFixed(2)}MB > ${(sizeLimit / 1024 / 1024).toFixed(2)}MB`
      };
    }
    return {
      valid: true
    };
  }
  // 🔄 FUNÇÃO LEGACY MANTIDA PARA COMPATIBILIDADE
  static getMimeType(mediaType) {
    return this.getMimeTypeFromBase64('', mediaType);
  }
}
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
      return new Response(
        JSON.stringify({ success: false, error: 'Payload too large' }),
        { 
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
      sanitizedData.mediabase64 || sanitizedData.mediaData || sanitizedData.base64Data || sanitizedData.media || sanitizedData.buffer || sanitizedData.content || sanitizedData.data?.buffer || sanitizedData.data?.base64 || sanitizedData.message?.media || sanitizedData.data?.mediaData), // ✅ ADICIONADO
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
      data_mediaData_exists: !!sanitizedData.data?.mediaData, // ✅ ADICIONADO
      payload_size: JSON.stringify(sanitizedData).length
    });
    // 🚨 INVESTIGAÇÃO DETALHADA: Onde está a mídia?
    if (sanitizedData.messageType !== 'text') {
      console.log('[Webhook] 🔍 INVESTIGAÇÃO DE MÍDIA DETALHADA:', {
        messageType: sanitizedData.messageType,
        topLevelKeys: Object.keys(sanitizedData).slice(0, 10), // ✅ Limitar keys
        // Verificar campos diretos
        directMedia: {
          mediaBase64: sanitizedData.mediaBase64 ? 'EXISTS' : null, // ✅ Não logar conteúdo
          mediabase64: sanitizedData.mediabase64 ? 'EXISTS' : null,
          mediaData: sanitizedData.mediaData ? 'EXISTS' : undefined,
          base64Data: sanitizedData.base64Data ? 'EXISTS' : null,
          media: sanitizedData.media ? 'EXISTS' : undefined,
          buffer: sanitizedData.buffer ? 'EXISTS' : null,
          content: sanitizedData.content ? 'EXISTS' : null
        },
        // Verificar campos aninhados
        nestedMedia: {
          data_keys: sanitizedData.data ? Object.keys(sanitizedData.data).slice(0, 10) : null, // ✅ Limitar
          data_buffer: sanitizedData.data?.buffer ? 'EXISTS' : null, // ✅ Não logar conteúdo
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
        text: baileyMsg.message?.conversation || baileyMsg.message?.extendedTextMessage?.text || data.caption || getMediaDisplayName(data.messageType)
      },
      messageType: data.messageType === 'sticker' ? 'image' : (data.messageType === 'unknown' ? 'text' : data.messageType) || 'text',
      mediaUrl: data.mediaUrl,
      // ❌ REMOVIDO: contactName - usar apenas telefone formatado
      // 🚀 DADOS DE MÍDIA EXTRAÍDOS - CORREÇÃO APLICADA
      mediaData: {
        base64Data: data.mediaBase64 || // raiz
        data.data?.mediaBase64 || data.mediabase64 || data.base64Data || data.mediaData?.base64Data || data.data?.mediaData?.base64Data || data.data?.mediaData || data.mediaData || data.media?.base64 || data.buffer || data.content || data.data?.buffer || data.data?.base64 || data.message?.media?.buffer,
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
        text: data.message?.text || data.caption || getMediaDisplayName(data.messageType)
      },
      messageType: data.messageType === 'sticker' ? 'image' : (data.messageType === 'unknown' ? 'text' : data.messageType) || 'text',
      mediaUrl: data.mediaUrl,
      // ❌ REMOVIDO: contactName - usar apenas telefone formatado
      profile_pic_url: data.profilePicUrl || data.profile_pic_url || data.data?.profile_pic_url || data.senderProfilePicUrl || null, // 📸 PROFILE PIC
      // 🚀 DADOS DE MÍDIA EXTRAÍDOS - CORREÇÃO APLICADA
      mediaData: {
        base64Data: data.mediaBase64 || // raiz
        data.data?.mediaBase64 || data.mediabase64 || data.base64Data || data.mediaData?.base64Data || data.data?.mediaData?.base64Data || data.data?.mediaData || data.mediaData || data.media?.base64 || data.buffer || data.content || data.data?.buffer || data.data?.base64 || data.message?.media?.buffer,
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
  // 🚀 STEP 1: SALVAR MENSAGEM NO BANCO (SEM BASE64 - REMOVIDO DO CAMPO AI_DESCRIPTION)
  // 📱 NOTA: contactName sempre enviado como NULL - usa apenas telefone formatado
  console.log('[Webhook] 💾 Salvando mensagem no banco...');
  const { data: result, error } = await supabase.rpc('save_whatsapp_message_service_role', {
    p_vps_instance_id: messageData.instanceId,
    p_phone: messageData.from,
    p_message_text: messageData.message.text || '',
    p_from_me: Boolean(messageData.fromMe),
    p_media_type: messageData.messageType === 'sticker' ? 'image' : (messageData.messageType === 'unknown' ? 'text' : (messageData.messageType || 'text')),
    p_media_url: null, // ❌ SEMPRE NULL - será definida após processamento da mídia no Storage
    p_external_message_id: messageData.externalMessageId || null,
    p_contact_name: null, // ❌ SEMPRE NULL - usar apenas telefone formatado
    p_profile_pic_url: messageData.profile_pic_url || null // 📸 PROFILE PIC URL
  });
  if (error || !result?.success) {
    console.error('[Webhook] ❌ Erro ao salvar mensagem:', error || result);
    return {
      success: false,
      error: 'Failed to save message'
    };
  }
  const messageId = result.data?.message_id;
  if (!messageId) {
    console.error('[Webhook] ❌ Message ID não retornado');
    return {
      success: false,
      error: 'Message ID not returned'
    };
  }
  console.log('[Webhook] ✅ Mensagem salva:', {
    messageId,
    leadId: result.data?.lead_id,
    fromMe: messageData.fromMe
  });
  // 🚀 STEP 2: PROCESSAR MÍDIA USANDO INFRAESTRUTURA EXISTENTE
  const hadMediaData = !!(messageData.mediaData?.base64Data && messageData.messageType !== 'text'); // ✅ Capturar antes de limpar
  
  if (hadMediaData) {
    console.log('[Webhook] 🎬 Processando mídia usando Storage + PGMQ existentes...');
    const mediaProcessed = await MediaProcessor.processMediaOptimized(supabase, messageId, messageData.mediaData);
    if (!mediaProcessed) {
      console.warn('[Webhook] ⚠️ Falha no processamento de mídia, mas mensagem foi salva');
    } else {
      console.log('[Webhook] ✅ Mídia processada com infraestrutura existente');
    }
    
    // ✅ Limpeza imediata da mídia da memória
    messageData.mediaData.base64Data = null;
    messageData.mediaData = null;
  }
  
  // ✅ Forçar limpeza de memória após processamento
  forceMemoryCleanup();
  
  return {
    success: true,
    message: 'Message processed completely with existing infrastructure',
    data: {
      ...result.data,
      mediaProcessed: hadMediaData, // ✅ Usar valor capturado antes da limpeza
      usedExistingInfrastructure: true
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
