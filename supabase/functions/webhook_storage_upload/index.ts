import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("🚀 Webhook Storage Upload Service - Direct Mode Only")
console.log("🎵 OGG salvo como está - Front usa Web Audio API para compatibilidade")

// 🔐 Buscar SECRET para validação JWT
const EDGE_FUNCTION_SECRET = Deno.env.get('EDGE_FUNCTION_SECRET')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

console.log('🔑 Secret configurada:', !!EDGE_FUNCTION_SECRET)
console.log('🔑 Service Role configurada:', !!SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  // 🔒 Apenas POST permitido
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // 🔐 VALIDAR JWT - Aceitar Service Role ou Secret interna
  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    console.error('❌ Authorization header não fornecido')
    return new Response(JSON.stringify({
      success: false,
      error: 'Authorization required'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 401
    })
  }

  const token = authHeader.replace('Bearer ', '')

  // ✅ Aceitar tanto SERVICE_ROLE_KEY quanto EDGE_FUNCTION_SECRET
  const isValidToken = token === SUPABASE_SERVICE_ROLE_KEY || token === EDGE_FUNCTION_SECRET

  if (!isValidToken) {
    console.error('❌ Token inválido')
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid token'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 403
    })
  }

  console.log('✅ Token validado com sucesso')

  try {
    const body = await req.json()
    return await uploadMode(body)
  } catch (error) {
    console.error('❌ Erro geral na função:', error)
    return new Response(JSON.stringify({
      success: false,
      error: `Function error: ${error.message}`,
      stack: error.stack
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

// 📤 MODO UPLOAD OTIMIZADO + UPDATE MESSAGE
async function uploadMode(body: any) {
  const { file_path, base64_data, content_type, message_id, media_url } = body

  console.log(`📤 Upload solicitado: ${file_path} para message_id: ${message_id}`)
  console.log(`🔍 Modo: ${media_url ? 'URL temporária' : 'Base64'}`)

  // ✅ Validar dados obrigatórios
  if (!file_path || !message_id) {
    return new Response(JSON.stringify({
      success: false,
      error: 'file_path and message_id are required'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    })
  }

  if (!base64_data && !media_url) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Either base64_data or media_url is required'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    })
  }

  // 🔑 Criar cliente Supabase com service role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 🔄 Obter arquivo binário (via URL ou Base64)
  let fileBuffer: Uint8Array

  if (media_url) {
    // 🔗 BAIXAR DA URL TEMPORÁRIA
    try {
      const response = await fetch(media_url, {
        signal: AbortSignal.timeout(15000)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      fileBuffer = new Uint8Array(arrayBuffer)
      console.log(`✅ Mídia baixada: ${fileBuffer.length} bytes`)
    } catch (downloadError) {
      console.error('❌ Erro ao baixar mídia da URL:', downloadError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to download media: ' + downloadError.message
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      })
    }
  } else {
    // 📦 DECODIFICAR BASE64
    const cleanBase64 = base64_data.includes(',')
      ? base64_data.split(',')[1]
      : base64_data

    try {
      fileBuffer = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0))
      console.log(`✅ Base64 decodificado: ${fileBuffer.length} bytes`)
    } catch (decodeError) {
      console.error('❌ Erro ao decodificar Base64:', decodeError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid Base64 data: ' + decodeError.message
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      })
    }
  }

  // 📤 Upload para Supabase Storage via REST API
  if (fileBuffer.length === 0) {
    console.error('❌ Buffer vazio')
    return new Response(JSON.stringify({
      success: false,
      error: 'Downloaded file is empty'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }

  // Remover arquivo existente (upsert via delete + create)
  await supabase.storage
    .from('whatsapp-media')
    .remove([file_path])
    .catch(() => {}) // Ignorar erro se não existir

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const uploadUrl = `${supabaseUrl}/storage/v1/object/whatsapp-media/${file_path}`

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': content_type || 'application/octet-stream',
      'x-upsert': 'false'
    },
    body: fileBuffer
  })

  if (!uploadResponse.ok) {
    const errorBody = await uploadResponse.text()
    console.error('❌ Upload falhou:', errorBody)
    return new Response(JSON.stringify({
      success: false,
      error: `Storage upload failed: ${uploadResponse.statusText}`,
      details: errorBody
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }

  const uploadResult = await uploadResponse.json()
  const publicUrl = `https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/${file_path}`

  // 🚀 Atualizar tabela messages
  supabase
    .from('messages')
    .update({ media_url: publicUrl })
    .eq('id', message_id)
    .then(({ error: updateError }) => {
      if (updateError) {
        console.error('❌ Erro update:', updateError)
      }
    })

  // 🎉 Resposta imediata de sucesso (não aguarda update)
  return new Response(JSON.stringify({
    success: true,
    path: file_path,
    url: publicUrl,
    message_id: message_id,
    file_size: fileBuffer.length,
    content_type: content_type,
    uploaded_at: new Date().toISOString(),
    message_updated: 'async', // Update em background
    upload_method: 'REST API' // Indicar que usamos REST API ao invés do SDK
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  })
}

// 🔄 REMOVIDO: processQueueMode - não usamos mais fila
// Fluxo direto: webhook → RPC → edge → storage

// 🛠️ Função auxiliar para extensão de arquivo
function getFileExtension(mediaType: string): string {
  switch (mediaType) {
    case 'image': return 'jpg'
    case 'video': return 'mp4'
    case 'audio': return 'mp3'
    case 'document': return 'pdf'
    case 'sticker': return 'webp'
    default: return 'bin'
  }
}

// 📝 Log de inicialização
console.log("✅ Webhook Storage Upload & Queue Processor Service pronto para receber requisições")