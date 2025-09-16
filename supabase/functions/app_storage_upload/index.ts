import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("🚀 App Storage Upload Service - Direct Mode Only")

serve(async (req) => {
  // 🔒 Apenas POST permitido
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // 🎯 SEM VERIFICAÇÃO JWT - Acesso direto interno
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

  console.log(`📤 Upload APP solicitado: ${file_path} para message_id: ${message_id}`)

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

  console.log(`🔄 Decodificando Base64 APP... Tamanho: ${cleanBase64.length} chars`)

  // 🔄 Decodificar Base64 para Uint8Array
  let fileBuffer: Uint8Array
  try {
    fileBuffer = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0))
    console.log(`✅ Base64 APP decodificado com sucesso. Arquivo: ${fileBuffer.length} bytes`)
  } catch (decodeError) {
    console.error('❌ Erro ao decodificar Base64 APP:', decodeError)
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid Base64 data: ' + decodeError.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    })
  }

  // 📤 Upload para Supabase Storage
  console.log(`🚀 Fazendo upload APP para Storage: ${file_path}`)

  const { data, error } = await supabase.storage
    .from('whatsapp-media')
    .upload(file_path, fileBuffer, {
      contentType: content_type || 'application/octet-stream',
      upsert: true // Substituir se já existir
    })

  if (error) {
    console.error('❌ Erro no upload APP para Storage:', error)
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

  console.log(`✅ Upload APP realizado com sucesso! URL: ${publicUrl}`)

  // 🎯 ATUALIZAR TABELA MESSAGES COM A URL
  const { error: updateError } = await supabase
    .from('messages')
    .update({
      media_url: publicUrl
    })
    .eq('id', message_id)

  if (updateError) {
    console.error('❌ Erro ao atualizar message.media_url APP:', updateError)
    return new Response(JSON.stringify({
      success: false,
      error: `Upload successful but failed to update message: ${updateError.message}`,
      url: publicUrl
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }

  console.log(`✅ Message APP ${message_id} atualizada com URL: ${publicUrl}`)

  // 🎉 Resposta de sucesso
  return new Response(JSON.stringify({
    success: true,
    path: data.path,
    url: publicUrl,
    message_id: message_id,
    file_size: fileBuffer.length,
    content_type: content_type,
    uploaded_at: new Date().toISOString(),
    message_updated: true,
    source: 'app'
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  })
}

// 📝 Log de inicialização
console.log("✅ App Storage Upload Service pronto para receber requisições")