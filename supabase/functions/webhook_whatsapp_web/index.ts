
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declarações de tipo para resolver erros
declare const Deno: any;

// ✅ TIPOS OTIMIZADOS PARA PROCESSAMENTO DE MÍDIA
interface ProcessedMediaData {
  cacheId: string;
  base64Data: string;
  fileSizeBytes: number;
  fileSizeMB: number;
  storageUrl?: string;
  isStorageSaved: boolean; // ✅ NOVO: Indica se foi salvo no Storage
}

interface MediaCacheEntry {
  id: string;
  message_id: string | null;
  external_message_id: string | null;
  original_url: string;
  base64_data: string | null;
  file_size: number;
  media_type: string;
  created_at: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[${requestId}] 🚀 WhatsApp Web Webhook - VERSÃO OTIMIZADA:`, JSON.stringify(body, null, 2));

    const { event, instanceId, data } = body;

    if (event !== 'message_received') {
      return new Response(JSON.stringify({ success: true, message: 'Event not processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 🔄 Processando evento: ${event} para instância: ${instanceId}`);

    // 1. BUSCAR INSTÂNCIA
    console.log(`[${requestId}] 🔍 BUSCANDO INSTÂNCIA: ${instanceId}`);
    
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, created_by_user_id')
      .eq('vps_instance_id', instanceId)
      .single();

    if (instanceError || !instance) {
      console.log(`[${requestId}] ❌ Instância não encontrada: ${instanceId}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Instance not found',
        instanceId 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 💬 Processando mensagem com MÍDIA OTIMIZADA para: ${instanceId}`);

    // 2. EXTRAIR DADOS DA MENSAGEM
    const messageType = data.messageType || body.messageType || 'text';
    const messageText = data.body || body.message?.text || '[Mensagem não suportada]';
    const fromPhone = data.from?.replace('@s.whatsapp.net', '') || body.from?.replace('@s.whatsapp.net', '') || '';
    const messageId = data.messageId || body.data?.messageId;
    const isFromMe = data.fromMe || body.fromMe || false;
    const createdByUserId = instance.created_by_user_id;
    
    console.log(`[${requestId}] 📱 Telefone processado: ${fromPhone}`);
    
    // ✅ FORMATAÇÃO DO NOME PARA PADRÃO WHATSAPP
    let formattedContactName = body.contactName || null;
    
    if (!formattedContactName) {
      if (fromPhone && fromPhone.length >= 12 && fromPhone.startsWith('55')) {
        const countryCode = fromPhone.substring(0, 2);
        const areaCode = fromPhone.substring(2, 4);
        const number = fromPhone.substring(4);
        
        if (number.length === 9) {
          formattedContactName = `+${countryCode} ${areaCode} ${number.substring(0, 5)}-${number.substring(5)}`;
        } else if (number.length === 8) {
          formattedContactName = `+${countryCode} ${areaCode} ${number.substring(0, 4)}-${number.substring(4)}`;
        } else {
          formattedContactName = `+${countryCode} ${areaCode} ${number}`;
        }
      } else {
        formattedContactName = `+${fromPhone}`;
      }
    }

    console.log(`[${requestId}] 📱 Mensagem ${isFromMe ? 'ENVIADA PARA' : 'RECEBIDA DE'}: ${fromPhone} | Nome: ${formattedContactName} | Tipo: ${messageType}`);

    // ✅ 3. SALVAR MENSAGEM PRIMEIRO (PARA TER message_id)
    console.log(`[${requestId}] 💾 Salvando mensagem no banco PRIMEIRO...`);
    
    const { data: messageResult, error: messageError } = await supabase.rpc(
      'save_whatsapp_message_service_role',
      {
        p_vps_instance_id: instanceId,
        p_phone: fromPhone,
        p_message_text: messageText,
        p_from_me: isFromMe,
        p_media_type: messageType,
        p_media_url: null, // ✅ Será atualizado após processamento
        p_external_message_id: messageId,
        p_contact_name: formattedContactName
      }
    );

    if (messageError) {
      console.log(`[${requestId}] ❌ Erro ao salvar mensagem: ${messageError.message}`);
      return new Response(JSON.stringify({ 
        error: `Falha ao salvar mensagem: ${messageError.message}`,
        requestId
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { lead_id: leadId, message_id: messageDbId } = messageResult;
    console.log(`[${requestId}] ✅ Mensagem salva: ${messageDbId} | Lead: ${leadId}`);

    // ✅ 4. DETECTAR E PROCESSAR MÍDIA (AGORA COM message_id DISPONÍVEL)
    let processedMediaData: ProcessedMediaData | null = null;
    let finalMediaUrl: string | null = null;
    
    if (messageType !== 'text' && messageType !== 'chat') {
      console.log(`[${requestId}] 🎬 MÍDIA DETECTADA: ${messageType}`);
      
      // EXTRAÇÃO EXPANDIDA DE URL DA MÍDIA
      const potentialUrls = [
        data?.mediaUrl, data?.media_url, data?.media?.url, data?.url,
        body?.mediaUrl, body?.media_url, body?.media?.url, body?.url,
        body?.data?.mediaUrl, body?.data?.media_url, body?.data?.media?.url,
        body?.data?.image?.url, body?.data?.video?.url, body?.data?.audio?.url, body?.data?.document?.url,
        body?.message?.image?.url, body?.message?.video?.url, body?.message?.audio?.url, body?.message?.document?.url,
        body?.image?.url, body?.video?.url, body?.audio?.url, body?.document?.url, body?.sticker?.url
      ].filter(Boolean);
      
      console.log(`[${requestId}] 📎 URLs potenciais encontradas:`, potentialUrls);
      
      if (potentialUrls.length > 0) {
        const mediaUrl = potentialUrls[0];
        if (mediaUrl && typeof mediaUrl === 'string' && (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://'))) {
          console.log(`[${requestId}] ✅ URL válida detectada: ${mediaUrl.substring(0, 80)}...`);
          
          try {
            // ✅ CORRIGIDO: Processar mídia com messageType correto
            processedMediaData = await processMediaToBase64Optimized(
              supabase, 
              messageDbId, // ✅ message_id do banco
              messageId,   // ✅ external_message_id
              mediaUrl, 
              messageType, // ✅ CORRIGIDO: Passar messageType como parâmetro
              requestId
            );
            console.log(`[${requestId}] ✅ Mídia processada com sucesso`);
            
            // ✅ DEFINIR URL FINAL (Storage ou base64)
            finalMediaUrl = processedMediaData.storageUrl || `data:application/octet-stream;base64,${processedMediaData.base64Data}`;
            
          } catch (mediaError) {
            console.log(`[${requestId}] ⚠️ Erro ao processar mídia: ${mediaError.message}`);
            finalMediaUrl = mediaUrl; // Fallback para URL original
          }
        }
      }
    }

    // ✅ 5. ATUALIZAR MENSAGEM COM URL FINAL DA MÍDIA
    if (finalMediaUrl && messageDbId) {
      console.log(`[${requestId}] 🔄 Atualizando mensagem com URL final da mídia...`);
      
      const { error: updateError } = await supabase
        .from('messages')
        .update({ media_url: finalMediaUrl })
        .eq('id', messageDbId);

      if (updateError) {
        console.log(`[${requestId}] ⚠️ Erro ao atualizar URL da mídia: ${updateError.message}`);
      } else {
        console.log(`[${requestId}] ✅ URL da mídia atualizada na mensagem`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: messageDbId,
      leadId: leadId,
      mediaProcessed: !!processedMediaData,
      mediaUrl: finalMediaUrl,
      mediaCacheId: processedMediaData?.cacheId,
      requestId,
      version: 'optimized_v2'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro geral no webhook:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// ✅ FUNÇÃO OTIMIZADA PARA PROCESSAR MÍDIA COM RELAÇÕES CORRETAS
async function processMediaToBase64Optimized(
  supabase: any, 
  messageDbId: string,      // ✅ ID da mensagem no banco
  externalMessageId: string, // ✅ external_message_id para Agente IA
  mediaUrl: string, 
  mediaType: string, 
  requestId: string
): Promise<ProcessedMediaData> {
  try {
    console.log(`[${requestId}] 🔄 Processando mídia OTIMIZADA de: ${mediaUrl.substring(0, 80)}...`);

    // 1. Download da mídia
    const response = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WhatsApp-Bot/1.0)',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Falha no download: ${response.status} - ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const fileSizeBytes = bytes.length;
    const fileSizeMB = fileSizeBytes / (1024 * 1024);

    console.log(`[${requestId}] 📊 Mídia baixada: ${fileSizeMB.toFixed(2)}MB (${fileSizeBytes} bytes)`);

    // 2. Converter para base64
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Data = btoa(binaryString);

    console.log(`[${requestId}] 🔄 Mídia convertida para base64: ${base64Data.length} caracteres`);

    // ✅ 3. TENTAR SALVAR NO STORAGE PRIMEIRO
    let storageUrl = null;
    let isStorageSaved = false;
    
    try {
      // Detectar MIME type e extensão
      const mimeMatch = mediaUrl.match(/\.(jpg|jpeg|png|gif|webp|mp4|mp3|wav|ogg|m4a|pdf|doc|docx|avi|mov|wmv)$/i);
      let contentType = 'application/octet-stream';
      let extension = 'bin';
      
      if (mimeMatch) {
        extension = mimeMatch[1].toLowerCase();
        const mimeTypes = {
          'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp',
          'mp4': 'video/mp4', 'avi': 'video/x-msvideo', 'mov': 'video/quicktime', 'wmv': 'video/x-ms-wmv',
          'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg', 'm4a': 'audio/mp4',
          'pdf': 'application/pdf', 'doc': 'application/msword', 
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        contentType = mimeTypes[extension] || contentType;
      }

      // Nome único para Storage
      const fileName = `${messageDbId}_${externalMessageId}_${Date.now()}.${extension}`;
      
      console.log(`[${requestId}] 🗄️ Salvando no Storage: ${fileName} (${contentType})`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('whatsapp-media')
        .upload(fileName, bytes, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.log(`[${requestId}] ⚠️ Storage falhou, usando base64:`, uploadError.message);
      } else {
        const { data: urlData } = supabase.storage
          .from('whatsapp-media')
          .getPublicUrl(fileName);
          
        storageUrl = urlData.publicUrl;
        isStorageSaved = true;
        console.log(`[${requestId}] ✅ Mídia salva no Storage: ${storageUrl.substring(0, 80)}...`);
      }
    } catch (storageError) {
      console.log(`[${requestId}] ⚠️ Erro no Storage:`, storageError.message);
    }

    // ✅ 4. SALVAR NO MEDIA_CACHE COM RELAÇÕES CORRETAS
    const cachePayload = {
      message_id: messageDbId,           // ✅ Relacionar com mensagem
      external_message_id: externalMessageId, // ✅ Para busca do Agente IA
      original_url: storageUrl || mediaUrl,    // ✅ URL Storage ou original
      base64_data: isStorageSaved ? null : base64Data, // ✅ Base64 apenas se não tem Storage
      file_name: `${externalMessageId}_${mediaType}`,
      file_size: fileSizeBytes,
      media_type: mediaType,
      created_at: new Date().toISOString()
    };

    console.log(`[${requestId}] 💾 Salvando no MEDIA_CACHE com relações:`, {
      message_id: messageDbId,
      external_message_id: externalMessageId,
      has_storage: isStorageSaved,
      has_base64: !isStorageSaved
    });

    const { data: cacheData, error: cacheError } = await supabase
      .from('media_cache')
      .insert(cachePayload)
      .select('id')
      .single();

    if (cacheError) {
      console.log(`[${requestId}] ⚠️ Erro ao salvar cache: ${cacheError.message}`);
      throw new Error(`Cache save failed: ${cacheError.message}`);
    }

    console.log(`[${requestId}] ✅ MEDIA_CACHE atualizado com ID: ${cacheData.id}`);

    return {
      cacheId: cacheData.id,
      base64Data,
      fileSizeBytes,
      fileSizeMB,
      storageUrl,
      isStorageSaved
    };

  } catch (error) {
    console.log(`[${requestId}] ❌ Erro no processamento: ${error.message}`);
    throw error;
  }
}
