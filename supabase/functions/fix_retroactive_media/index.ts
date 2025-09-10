import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('[RetroactiveMedia] 🔄 Iniciando processamento de mídias retroativas...')

    // 1. BUSCAR MENSAGENS COM MÍDIA SEM CACHE
    const { data: orphanMessages, error: searchError } = await supabase
      .from('messages')
      .select('id, media_type, media_url, whatsapp_number_id, instance_name, created_at')
      .in('media_type', ['image', 'video', 'audio', 'document'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h
      .order('created_at', { ascending: false })

    if (searchError) {
      throw new Error(`Erro ao buscar mensagens órfãs: ${searchError.message}`)
    }

    if (!orphanMessages || orphanMessages.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma mensagem órfã encontrada',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[RetroactiveMedia] 📋 Encontradas ${orphanMessages.length} mensagens com mídia`)

    // 2. FILTRAR APENAS MENSAGENS SEM CACHE
    const { data: existingCaches } = await supabase
      .from('media_cache')
      .select('message_id')
      .in('message_id', orphanMessages.map(m => m.id))

    const existingCacheIds = new Set(existingCaches?.map(c => c.message_id) || [])
    const messagesWithoutCache = orphanMessages.filter(m => !existingCacheIds.has(m.id))

    console.log(`[RetroactiveMedia] 🔍 ${messagesWithoutCache.length} mensagens SEM cache encontradas`)

    let processed = 0
    let failed = 0

    // 3. PROCESSAR CADA MENSAGEM SEM CACHE
    for (const message of messagesWithoutCache) {
      try {
        console.log(`[RetroactiveMedia] 🔄 Processando: ${message.id} (${message.media_type})`)

        // Criar cache placeholder (para mensagens sem media_url ou com falha)
        const placeholderUrl = `retroactive://failed/${message.id}`
        
        const { error: cacheError } = await supabase
          .from('media_cache')
          .insert({
            message_id: message.id,
            external_message_id: message.id,
            original_url: placeholderUrl,
            cached_url: message.media_url || placeholderUrl,
            base64_data: null,
            file_size: 0,
            media_type: message.media_type,
            file_name: `retroactive_${message.id}.${message.media_type}`,
            created_at: new Date().toISOString()
          })

        if (cacheError) {
          console.error(`[RetroactiveMedia] ❌ Erro ao criar cache para ${message.id}:`, cacheError.message)
          failed++
        } else {
          console.log(`[RetroactiveMedia] ✅ Cache criado para ${message.id}`)
          processed++
        }

      } catch (error) {
        console.error(`[RetroactiveMedia] ❌ Erro ao processar ${message.id}:`, error)
        failed++
      }
    }

    console.log(`[RetroactiveMedia] 🎯 Processamento concluído: ${processed} sucesso, ${failed} falhas`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processamento concluído`,
        total_found: orphanMessages.length,
        without_cache: messagesWithoutCache.length,
        processed: processed,
        failed: failed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[RetroactiveMedia] ❌ Erro geral:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 