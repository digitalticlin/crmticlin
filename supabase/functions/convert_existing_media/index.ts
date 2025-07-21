
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
    const { batchSize = 50, offset = 0 } = await req.json();
    
    console.log(`🚀 Iniciando conversão de mídias existentes - Batch: ${batchSize}, Offset: ${offset}`);

    // Buscar mensagens com mídia que não têm cache
    const { data: messagesWithMedia, error: fetchError } = await supabase
      .from('messages')
      .select('id, media_url, media_type, created_at')
      .not('media_url', 'is', null)
      .neq('media_type', 'text')
      .not('id', 'in', `(
        SELECT message_id 
        FROM media_cache 
        WHERE message_id IS NOT NULL
      )`)
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      throw new Error(`Erro ao buscar mensagens: ${fetchError.message}`);
    }

    if (!messagesWithMedia || messagesWithMedia.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma mídia para processar',
        processed: 0,
        offset: offset
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Encontradas ${messagesWithMedia.length} mensagens com mídia para processar`);

    let processed = 0;
    let failed = 0;
    let alreadyExpired = 0;
    const results = [];

    // Processar cada mensagem
    for (const message of messagesWithMedia) {
      const result = await processMessageMedia(supabase, message);
      results.push(result);
      
      if (result.success) {
        processed++;
      } else if (result.reason === 'expired') {
        alreadyExpired++;
      } else {
        failed++;
      }

      // Log a cada 10 processados
      if ((processed + failed + alreadyExpired) % 10 === 0) {
        console.log(`📊 Progresso: ${processed} sucesso, ${failed} falhas, ${alreadyExpired} expiradas`);
      }
    }

    const summary = {
      success: true,
      totalFound: messagesWithMedia.length,
      processed: processed,
      failed: failed,
      alreadyExpired: alreadyExpired,
      offset: offset,
      nextOffset: offset + batchSize,
      hasMore: messagesWithMedia.length === batchSize,
      results: results
    };

    console.log(`✅ Conversão concluída:`, summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro na conversão de mídias:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processMessageMedia(supabase: any, message: any) {
  const { id: messageId, media_url: mediaUrl, media_type: mediaType } = message;
  
  try {
    console.log(`🔄 Processando mídia para mensagem: ${messageId}`);

    // Verificar se já existe cache para esta mensagem
    const { data: existingCache } = await supabase
      .from('media_cache')
      .select('id')
      .eq('message_id', messageId)
      .single();

    if (existingCache) {
      console.log(`⏭️ Mídia já possui cache: ${messageId}`);
      return {
        messageId,
        success: true,
        reason: 'already_cached',
        cacheId: existingCache.id
      };
    }

    // Verificar se URL já expirou (URLs do WhatsApp têm padrão específico)
    if (isWhatsAppUrlExpired(mediaUrl)) {
      console.log(`⏰ URL já expirada: ${messageId}`);
      
      // Salvar marcador de mídia indisponível
      await supabase
        .from('media_cache')
        .insert({
          message_id: messageId,
          original_url: mediaUrl,
          media_type: mediaType,
          base64_data: null,
          created_at: new Date().toISOString(),
          expires_at: null
        });

      return {
        messageId,
        success: false,
        reason: 'expired',
        mediaUrl: mediaUrl.substring(0, 50) + '...'
      };
    }

    // Tentar baixar a mídia
    console.log(`📥 Baixando mídia: ${mediaUrl.substring(0, 50)}...`);
    
    const response = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'WhatsApp-Media-Converter/1.0'
      }
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 403 || response.status === 410) {
        // URL expirada
        await supabase
          .from('media_cache')
          .insert({
            message_id: messageId,
            original_url: mediaUrl,
            media_type: mediaType,
            base64_data: null,
            created_at: new Date().toISOString(),
            expires_at: null
          });

        return {
          messageId,
          success: false,
          reason: 'expired',
          httpStatus: response.status
        };
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Converter para Base64
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...uint8Array));
    
    const fileSizeBytes = arrayBuffer.byteLength;
    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
    
    console.log(`💾 Mídia convertida: ${fileSizeMB}MB -> Base64`);

    // Salvar no cache
    const { data: cacheData, error: cacheError } = await supabase
      .from('media_cache')
      .insert({
        message_id: messageId,
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

    return {
      messageId,
      success: true,
      reason: 'converted',
      cacheId: cacheData.id,
      fileSizeBytes,
      fileSizeMB: parseFloat(fileSizeMB)
    };

  } catch (error) {
    console.error(`❌ Erro ao processar mídia ${messageId}:`, error);
    
    // Tentar salvar como falha no cache
    try {
      await supabase
        .from('media_cache')
        .insert({
          message_id: messageId,
          original_url: mediaUrl,
          media_type: mediaType,
          base64_data: null,
          created_at: new Date().toISOString(),
          expires_at: null
        });
    } catch (cacheError) {
      console.error(`❌ Erro ao salvar falha no cache:`, cacheError);
    }

    return {
      messageId,
      success: false,
      reason: 'error',
      error: error.message
    };
  }
}

function isWhatsAppUrlExpired(url: string): boolean {
  // URLs do WhatsApp têm padrões específicos e geralmente expiram em algumas horas
  if (!url.includes('mmg.whatsapp.net') && !url.includes('pps.whatsapp.net')) {
    return false; // Não é URL do WhatsApp
  }
  
  // URLs do WhatsApp com mais de 24 horas provavelmente expiraram
  // Esta é uma heurística - URLs reais podem expirar mais cedo
  return true; // Para esta implementação, assumimos que URLs antigas expiraram
}
