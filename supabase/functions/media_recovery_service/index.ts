import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declarações de tipo
declare const Deno: any;

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
    const requestId = `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[${requestId}] 🚀 SERVIÇO DE RECUPERAÇÃO DE MÍDIAS INICIADO`);

    const { action = 'recover_all', days = 7, limit = 50 } = body;

    if (action === 'recover_all') {
      const result = await recoverLostMediaBatch(supabase, requestId, days, limit);
      
      return new Response(JSON.stringify({
        success: true,
        action: 'recover_all',
        result,
        requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'analyze') {
      const analysis = await analyzeLostMedia(supabase, requestId, days);
      
      return new Response(JSON.stringify({
        success: true,
        action: 'analyze',
        analysis,
        requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action. Use "recover_all" or "analyze"'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no serviço de recuperação:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// FUNÇÃO PARA ANALISAR MÍDIAS PERDIDAS
async function analyzeLostMedia(supabase: any, requestId: string, days: number) {
  console.log(`[${requestId}] 🔍 Analisando mídias perdidas dos últimos ${days} dias...`);
  
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  // Análise por tipo de mídia
  const { data: mediaStats, error: statsError } = await supabase
    .from('messages')
    .select(`
      media_type,
      media_url,
      id
    `)
    .neq('media_type', 'text')
    .gte('created_at', cutoffDate);

  if (statsError) {
    throw new Error(`Erro na análise: ${statsError.message}`);
  }

  // Mídias com cache
  const { data: cachedMedia, error: cacheError } = await supabase
    .from('media_cache')
    .select('message_id, media_type')
    .not('message_id', 'is', null);

  if (cacheError) {
    throw new Error(`Erro ao buscar cache: ${cacheError.message}`);
  }

  const cachedIds = new Set(cachedMedia?.map(c => c.message_id) || []);
  
  // Estatísticas
  const analysis = {
    totalMediaMessages: mediaStats?.length || 0,
    withMediaUrl: mediaStats?.filter(m => m.media_url).length || 0,
    withoutMediaUrl: mediaStats?.filter(m => !m.media_url).length || 0,
    cached: cachedIds.size,
    lost: mediaStats?.filter(m => m.media_url && !cachedIds.has(m.id)).length || 0,
    byType: {}
  };

  // Análise por tipo
  const types = ['image', 'video', 'audio', 'document'];
  for (const type of types) {
    const typeMessages = mediaStats?.filter(m => m.media_type === type) || [];
    const typeCached = typeMessages.filter(m => cachedIds.has(m.id));
    const typeLost = typeMessages.filter(m => m.media_url && !cachedIds.has(m.id));
    
    analysis.byType[type] = {
      total: typeMessages.length,
      withUrl: typeMessages.filter(m => m.media_url).length,
      cached: typeCached.length,
      lost: typeLost.length
    };
  }

  console.log(`[${requestId}] 📊 Análise concluída:`, analysis);
  return analysis;
}

// FUNÇÃO PARA RECUPERAR MÍDIAS EM LOTE
async function recoverLostMediaBatch(supabase: any, requestId: string, days: number, limit: number) {
  console.log(`[${requestId}] 🔄 Recuperando mídias perdidas: ${days} dias, limite ${limit}`);
  
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  // Buscar mensagens com mídia sem cache
  const { data: lostMedia, error: queryError } = await supabase
    .from('messages')
    .select(`
      id,
      media_type,
      media_url,
      external_message_id,
      created_at
    `)
    .neq('media_type', 'text')
    .not('media_url', 'is', null)
    .gte('created_at', cutoffDate)
    .not('id', 'in', `(SELECT message_id FROM media_cache WHERE message_id IS NOT NULL)`)
    .limit(limit)
    .order('created_at', { ascending: false });

  if (queryError) {
    throw new Error(`Erro ao buscar mídias: ${queryError.message}`);
  }

  if (!lostMedia || lostMedia.length === 0) {
    return {
      processed: 0,
      recovered: 0,
      errors: 0,
      message: 'Nenhuma mídia perdida encontrada'
    };
  }

  console.log(`[${requestId}] 🔍 Encontradas ${lostMedia.length} mídias para recuperar`);

  let processed = 0;
  let recovered = 0;
  let errors = 0;

  for (const media of lostMedia) {
    processed++;
    
    try {
      console.log(`[${requestId}] 🔄 [${processed}/${lostMedia.length}] Recuperando: ${media.id}`);
      
      const processedData = await processMediaToBase64(
        supabase, 
        media.id, 
        media.media_url, 
        media.media_type, 
        `${requestId}-${processed}`
      );

      // Associar à mensagem
      const { error: updateError } = await supabase
        .from('media_cache')
        .update({ message_id: media.id })
        .eq('id', processedData.cacheId);

      if (updateError) {
        console.error(`[${requestId}] ❌ Erro ao associar: ${updateError.message}`);
        errors++;
      } else {
        console.log(`[${requestId}] ✅ Recuperada: ${media.id}`);
        recovered++;
      }

    } catch (error) {
      console.error(`[${requestId}] ❌ Erro ao processar ${media.id}:`, error);
      errors++;
    }

    // Pausa para evitar sobrecarga
    if (processed % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const result = {
    processed,
    recovered,
    errors,
    successRate: processed > 0 ? Math.round((recovered / processed) * 100) : 0
  };

  console.log(`[${requestId}] 📊 Recuperação concluída:`, result);
  return result;
}

// FUNÇÃO PARA PROCESSAR MÍDIA PARA BASE64 (copiada da edge principal)
async function processMediaToBase64(supabase: any, messageId: string, mediaUrl: string, mediaType: string, requestId: string) {
  console.log(`[${requestId}] 🔄 Convertendo mídia: ${messageId}`);
  
  try {
    const response = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'WhatsApp-Media-Recovery/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...uint8Array));
    
    const fileSizeBytes = arrayBuffer.byteLength;
    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
    
    console.log(`[${requestId}] 💾 Convertida: ${fileSizeMB}MB`);

    const { data: cacheData, error: cacheError } = await supabase
      .from('media_cache')
      .insert({
        original_url: mediaUrl,
        media_type: mediaType,
        base64_data: base64,
        file_size: fileSizeBytes,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
      })
      .select('id')
      .single();

    if (cacheError) {
      throw new Error(`Erro ao salvar: ${cacheError.message}`);
    }

    return {
      cacheId: cacheData.id,
      base64Data: base64,
      fileSizeBytes,
      fileSizeMB: parseFloat(fileSizeMB)
    };

  } catch (error) {
    console.error(`[${requestId}] ❌ Erro:`, error);
    throw error;
  }
} 