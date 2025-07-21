
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    
    console.log(`[${requestId}] 🚀 WhatsApp Web Webhook - VERSÃO FUNCIONAL RECUPERADA:`, JSON.stringify(body, null, 2));

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

    console.log(`[${requestId}] 💬 Processando mensagem com CONVERSÃO DE MÍDIA para: ${instanceId}`);

    // 2. EXTRAIR DADOS DA MENSAGEM
    const messageType = data.messageType || body.messageType || 'text';
    const messageText = data.body || body.message?.text || '[Mensagem não suportada]';
    const fromPhone = data.from?.replace('@s.whatsapp.net', '') || body.from?.replace('@s.whatsapp.net', '');
    const messageId = data.messageId || body.data?.messageId;
    
    // 3. DETECTAR E PROCESSAR MÍDIA
    let mediaUrl = null;
    let processedMediaData = null;
    
    if (messageType !== 'text' && messageType !== 'chat') {
      console.log(`[${requestId}] 🎬 MÍDIA DETECTADA: ${messageType}`);
      
      // Extrair URL da mídia do payload
      const potentialUrls = [
        data.mediaUrl,
        data.media?.url,
        body.mediaUrl,
        body.media?.url,
        data.url,
        body.url
      ].filter(Boolean);
      
      if (potentialUrls.length > 0) {
        mediaUrl = potentialUrls[0];
        console.log(`[${requestId}] 📎 URL da mídia encontrada: ${mediaUrl.substring(0, 50)}...`);
        
        // PROCESSAR MÍDIA IMEDIATAMENTE
        try {
          processedMediaData = await processMediaToBase64(supabase, messageId, mediaUrl, messageType, requestId);
          console.log(`[${requestId}] ✅ Mídia processada com sucesso`);
        } catch (mediaError) {
          console.log(`[${requestId}] ⚠️ Erro ao processar mídia: ${mediaError.message}`);
          // Continua sem mídia processada
        }
      } else {
        console.log(`[${requestId}] ⚠️ Mídia detectada mas URL não encontrada no payload`);
      }
    }

    console.log(`[${requestId}] 📱 Mensagem RECEBIDA DE: ${fromPhone} | Tipo: ${messageType} | Texto: ${messageText.substring(0, 50)}...`);

    // 4. SALVAR MENSAGEM USANDO FUNÇÃO SIMPLES
    console.log(`[${requestId}] 💾 Salvando mensagem usando função simples`);
    
    const { data: saveResult, error: saveError } = await supabase
      .rpc('save_whatsapp_message_service_role', {
        p_vps_instance_id: instanceId,
        p_phone: fromPhone,
        p_message_text: messageText,
        p_from_me: false,
        p_media_type: messageType,
        p_media_url: mediaUrl,
        p_external_message_id: messageId,
        p_contact_name: body.contactName || null
      });

    if (saveError) {
      console.log(`[${requestId}] ❌ Erro ao salvar mensagem: ${saveError.message}`);
      throw new Error(`Erro ao salvar mensagem: ${saveError.message}`);
    }

    if (!saveResult?.success) {
      console.log(`[${requestId}] ❌ Função retornou erro: ${saveResult?.error}`);
      throw new Error(`Erro na função: ${saveResult?.error}`);
    }

    const messageDbId = saveResult.data?.message_id;
    const leadId = saveResult.data?.lead_id;
    const instanceDbId = saveResult.data?.instance_id;

    console.log(`[${requestId}] ✅ Mensagem ${messageType.toUpperCase()} salva com sucesso! ID: ${messageDbId}`);

    // 5. ATUALIZAR LEAD
    if (leadId && instanceDbId) {
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: supabase.raw('COALESCE(unread_count, 0) + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (leadUpdateError) {
        console.log(`[${requestId}] ⚠️ Erro ao atualizar lead: ${leadUpdateError.message}`);
      } else {
        console.log(`[${requestId}] ✅ Lead atualizado: ${leadId} | Instância: ${instanceDbId} | Direção: INCOMING`);
      }
    }

    // 6. SE MÍDIA FOI PROCESSADA, ASSOCIAR À MENSAGEM
    if (processedMediaData && messageDbId) {
      console.log(`[${requestId}] 🔗 Associando mídia processada à mensagem: ${messageDbId}`);
      
      const { error: updateCacheError } = await supabase
        .from('media_cache')
        .update({ message_id: messageDbId })
        .eq('id', processedMediaData.cacheId);

      if (updateCacheError) {
        console.log(`[${requestId}] ⚠️ Erro ao associar mídia: ${updateCacheError.message}`);
      } else {
        console.log(`[${requestId}] ✅ Mídia associada com sucesso`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      messageId: messageDbId,
      leadId: leadId,
      mediaProcessed: !!processedMediaData,
      requestId
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

// FUNÇÃO PARA PROCESSAR MÍDIA PARA BASE64
async function processMediaToBase64(supabase: any, messageId: string, mediaUrl: string, mediaType: string, requestId: string) {
  console.log(`[${requestId}] 🔄 Iniciando conversão de mídia para Base64: ${messageId}`);
  
  try {
    // 1. BAIXAR MÍDIA
    console.log(`[${requestId}] 📥 Baixando mídia: ${mediaUrl.substring(0, 50)}...`);
    
    const response = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'WhatsApp-Media-Converter/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // 2. CONVERTER PARA BASE64
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...uint8Array));
    
    const fileSizeBytes = arrayBuffer.byteLength;
    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
    
    console.log(`[${requestId}] 💾 Mídia convertida: ${fileSizeMB}MB -> Base64`);

    // 3. SALVAR NO CACHE
    const { data: cacheData, error: cacheError } = await supabase
      .from('media_cache')
      .insert({
        original_url: mediaUrl,
        media_type: mediaType,
        base64_data: base64,
        file_size: fileSizeBytes,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString() // 30 dias
      })
      .select('id')
      .single();

    if (cacheError) {
      throw new Error(`Erro ao salvar no cache: ${cacheError.message}`);
    }

    console.log(`[${requestId}] ✅ Mídia salva no cache: ${cacheData.id}`);

    return {
      cacheId: cacheData.id,
      base64Data: base64,
      fileSizeBytes,
      fileSizeMB: parseFloat(fileSizeMB)
    };

  } catch (error) {
    console.error(`[${requestId}] ❌ Erro ao processar mídia:`, error);
    
    // Salvar entrada de falha no cache
    try {
      const { data: failureCache } = await supabase
        .from('media_cache')
        .insert({
          original_url: mediaUrl,
          media_type: mediaType,
          base64_data: null,
          created_at: new Date().toISOString(),
          expires_at: null
        })
        .select('id')
        .single();
      
      console.log(`[${requestId}] 📝 Falha registrada no cache: ${failureCache?.id}`);
    } catch (cacheError) {
      console.error(`[${requestId}] ❌ Erro ao registrar falha no cache:`, cacheError);
    }
    
    throw error;
  }
}
