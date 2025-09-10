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

    const { mediaId } = await req.json()
    
    if (!mediaId) {
      return new Response(
        JSON.stringify({ error: 'mediaId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 🔍 BUSCAR MÍDIA NO CACHE
    const { data: mediaCache, error: fetchError } = await supabase
      .from('media_cache')
      .select('id, cached_url, media_type, file_size')
      .eq('id', mediaId)
      .single()

    if (fetchError || !mediaCache) {
      return new Response(
        JSON.stringify({ error: 'Mídia não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ VERIFICAR SE JÁ É BASE64
    if (mediaCache.cached_url?.startsWith('data:')) {
      return new Response(
        JSON.stringify({ 
          base64Data: mediaCache.cached_url,
          alreadyProcessed: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 🔄 PROCESSAR STORAGE URL PARA BASE64
    console.log(`[ProcessMedia] 🔄 Processando mídia ${mediaId}...`)
    
    // Fazer download da mídia do Storage
    const response = await fetch(mediaCache.cached_url)
    if (!response.ok) {
      throw new Error(`Falha ao baixar mídia: ${response.status}`)
    }

    const buffer = await response.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    
    // Determinar MIME type
    const mimeType = getMimeType(mediaCache.media_type)
    const base64Data = `data:${mimeType};base64,${base64}`

    // 💾 ATUALIZAR CACHE COM BASE64
    const { error: updateError } = await supabase
      .from('media_cache')
      .update({ 
        base64_data: base64Data,
        cached_url: base64Data 
      })
      .eq('id', mediaId)

    if (updateError) {
      console.error(`[ProcessMedia] ❌ Erro ao atualizar cache:`, updateError)
      throw updateError
    }

    console.log(`[ProcessMedia] ✅ Mídia processada com sucesso: ${mediaId}`)

    return new Response(
      JSON.stringify({ 
        base64Data,
        processed: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[ProcessMedia] ❌ Erro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getMimeType(mediaType: string): string {
  switch (mediaType) {
    case 'image': return 'image/jpeg'
    case 'video': return 'video/mp4'
    case 'audio': return 'audio/mpeg'
    case 'document': return 'application/pdf'
    default: return 'application/octet-stream'
  }
} 