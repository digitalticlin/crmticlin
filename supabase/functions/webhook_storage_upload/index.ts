import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("🚀 Webhook Storage Upload Service - Direct Mode Only")

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

    // 📤 APENAS MODO UPLOAD DIRETO (sem fila)
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
  const { file_path, base64_data, content_type, message_id } = body

  console.log(`📤 Upload solicitado: ${file_path} para message_id: ${message_id}`)

  // ✅ Validar dados obrigatórios
  if (!file_path || !base64_data || !message_id) {
    return new Response(JSON.stringify({
      success: false,
      error: 'file_path, base64_data and message_id are required'
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

  // 🧹 Limpar Base64 (remover prefixo data: se houver)
  const cleanBase64 = base64_data.includes(',')
    ? base64_data.split(',')[1]
    : base64_data

  console.log(`🔄 Decodificando Base64... Tamanho: ${cleanBase64.length} chars`)

  // 🔄 Decodificar Base64 para Uint8Array
  let fileBuffer: Uint8Array
  try {
    fileBuffer = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0))
    console.log(`✅ Base64 decodificado com sucesso. Arquivo: ${fileBuffer.length} bytes`)
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

  // 📤 Upload para Supabase Storage
  console.log(`🚀 Fazendo upload para Storage: ${file_path}`)

  const { data, error } = await supabase.storage
    .from('whatsapp-media')
    .upload(file_path, fileBuffer, {
      contentType: content_type || 'application/octet-stream',
      upsert: true // Substituir se já existir
    })

  if (error) {
    console.error('❌ Erro no upload para Storage:', error)
    return new Response(JSON.stringify({
      success: false,
      error: `Storage upload failed: ${error.message}`,
      details: error
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }

  // 🎯 Gerar URL pública
  const publicUrl = `https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/${data.path}`

  console.log(`✅ Upload realizado com sucesso! URL: ${publicUrl}`)

  // 🚀 ATUALIZAR TABELA MESSAGES DE FORMA ASSÍNCRONA
  supabase
    .from('messages')
    .update({
      media_url: publicUrl
    })
    .eq('id', message_id)
    .then(({ error: updateError }) => {
      if (updateError) {
        console.error('❌ Erro ao atualizar message.media_url:', updateError)
      } else {
        console.log(`✅ Message ${message_id} atualizada com URL: ${publicUrl}`)
      }
    })

  console.log(`🚀 Upload concluído - update da URL disparado em background`)

  // 🎉 Resposta imediata de sucesso (não aguarda update)
  return new Response(JSON.stringify({
    success: true,
    path: data.path,
    url: publicUrl,
    message_id: message_id,
    file_size: fileBuffer.length,
    content_type: content_type,
    uploaded_at: new Date().toISOString(),
    message_updated: 'async' // Update em background
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