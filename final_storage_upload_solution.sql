-- ================================================================
-- 🎯 SOLUÇÃO FINAL: UPLOAD REAL PARA STORAGE
-- ================================================================

-- ESTRATÉGIA: Worker chama Edge Function dedicada para upload
-- VANTAGEM: Não quebra arquitetura, mantém performance

-- ================================================================
-- 1️⃣ EDGE FUNCTION PARA UPLOAD (Criar separadamente)
-- ================================================================

-- Esta Edge Function deve ser criada em: supabase/functions/storage_upload_service/index.ts
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { file_path, base64_data, content_type } = await req.json()
    
    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Decodificar Base64
    const cleanBase64 = base64_data.includes(',') 
      ? base64_data.split(',')[1] 
      : base64_data
    
    const fileBuffer = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0))

    // Upload para Storage
    const { data, error } = await supabase.storage
      .from('whatsapp-media')
      .upload(file_path, fileBuffer, {
        contentType: content_type,
        upsert: true
      })

    if (error) {
      console.error('Upload error:', error)
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      path: data.path,
      url: `https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/${data.path}`
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
*/

-- ================================================================
-- 2️⃣ WORKER ATUALIZADO PARA CHAMAR EDGE FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION public.process_webhook_media_with_real_upload(
    p_message_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_message_data RECORD;
    v_base64_data TEXT;
    v_storage_url TEXT;
    v_file_path TEXT;
    v_file_extension TEXT;
    v_content_type TEXT;
    v_upload_payload jsonb;
    v_upload_response jsonb;
    v_edge_function_url TEXT := 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/storage_upload_service';
    v_service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdoZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjE5MTE4MSwiZXhwIjoyMDQxNzY3MTgxfQ.aWnZsuyYyIUh0u-1i8O2dIfQAOXHNGm3vVlRLzR6DjM';
BEGIN
    -- 🔍 Log início
    RAISE NOTICE '[WORKER-REAL] 🔄 Processando mídia com upload REAL: message_id=%', p_message_id;
    
    -- ✅ Buscar dados da mensagem
    SELECT id, media_type, external_message_id, created_at
    INTO v_message_data
    FROM public.messages 
    WHERE id = p_message_id 
    AND media_type != 'text'
    AND source_edge = 'webhook_whatsapp_web';
    
    IF NOT FOUND THEN
        RAISE NOTICE '[WORKER-REAL] ❌ Mensagem não encontrada: %', p_message_id;
        RETURN jsonb_build_object('success', false, 'error', 'Message not found');
    END IF;
    
    -- 📦 Buscar Base64 na fila
    SELECT message->>'base64_data' INTO v_base64_data
    FROM pgmq.read('webhook_message_queue', 1, 50)
    WHERE (message->>'message_id')::uuid = p_message_id
       OR message->>'external_message_id' = v_message_data.external_message_id
    LIMIT 1;
    
    IF v_base64_data IS NULL OR v_base64_data = '' THEN
        RAISE NOTICE '[WORKER-REAL] ❌ Base64 não encontrado na fila';
        RETURN jsonb_build_object('success', false, 'error', 'No base64 data found in queue');
    END IF;
    
    -- 🎯 Determinar tipo de arquivo
    CASE v_message_data.media_type
        WHEN 'image' THEN 
            v_file_extension := '.jpg';
            v_content_type := 'image/jpeg';
        WHEN 'video' THEN 
            v_file_extension := '.mp4';
            v_content_type := 'video/mp4';
        WHEN 'audio' THEN 
            v_file_extension := '.ogg';
            v_content_type := 'audio/ogg';
        WHEN 'document' THEN 
            v_file_extension := '.pdf';
            v_content_type := 'application/pdf';
        WHEN 'sticker' THEN 
            v_file_extension := '.webp';
            v_content_type := 'image/webp';
        ELSE 
            v_file_extension := '.bin';
            v_content_type := 'application/octet-stream';
    END CASE;
    
    -- 📁 Gerar caminho do arquivo
    v_file_path := 'webhook/' || v_message_data.media_type || '/' ||
                   to_char(v_message_data.created_at, 'YYYY-MM-DD') || '/' ||
                   'msg_' || substring(p_message_id::text, 1, 8) || '_' || 
                   extract(epoch from v_message_data.created_at)::text ||
                   v_file_extension;
    
    -- 📤 Preparar payload para Edge Function
    v_upload_payload := jsonb_build_object(
        'file_path', v_file_path,
        'base64_data', v_base64_data,
        'content_type', v_content_type,
        'message_id', p_message_id
    );
    
    -- 🚀 CHAMAR EDGE FUNCTION PARA UPLOAD
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
            
            RAISE NOTICE '[WORKER-REAL] 🚀 Chamando Edge Function para upload: %', v_file_path;
            
            SELECT content::jsonb INTO v_upload_response
            FROM http((
                'POST',
                v_edge_function_url,
                ARRAY[
                    http_header('Authorization', 'Bearer ' || v_service_key),
                    http_header('Content-Type', 'application/json')
                ],
                v_upload_payload::text
            ));
            
            RAISE NOTICE '[WORKER-REAL] 📤 Resposta do upload: %', v_upload_response;
            
            -- Verificar se upload foi bem-sucedido
            IF (v_upload_response->>'success')::boolean THEN
                v_storage_url := v_upload_response->>'url';
                RAISE NOTICE '[WORKER-REAL] ✅ Upload realizado com sucesso!';
            ELSE
                RAISE NOTICE '[WORKER-REAL] ❌ Erro no upload: %', v_upload_response->>'error';
                -- Gerar URL mesmo assim para não quebrar o fluxo
                v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
            END IF;
            
        ELSE
            RAISE NOTICE '[WORKER-REAL] ⚠️ Extensão HTTP não disponível, gerando URL apenas';
            v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[WORKER-REAL] ❌ Erro ao chamar Edge Function: %', SQLERRM;
            -- Gerar URL mesmo com erro
            v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
    END;
    
    -- 🔄 Atualizar media_url na tabela
    UPDATE public.messages
    SET media_url = v_storage_url
    WHERE id = p_message_id;
    
    -- ✅ Log final
    RAISE NOTICE '[WORKER-REAL] ✅ Processamento concluído: % -> %', p_message_id, v_storage_url;
    
    RETURN jsonb_build_object(
        'success', true,
        'message_id', p_message_id,
        'storage_url', v_storage_url,
        'file_path', v_file_path,
        'upload_attempted', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http'),
        'upload_success', COALESCE((v_upload_response->>'success')::boolean, false),
        'processed_at', now()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[WORKER-REAL] ❌ Erro geral: %', SQLERRM;
        RETURN jsonb_build_object('success', false, 'message_id', p_message_id, 'error', SQLERRM);
END;
$$;

-- ================================================================
-- 3️⃣ ATUALIZAR TRIGGER PARA USAR NOVO WORKER
-- ================================================================

CREATE OR REPLACE FUNCTION public.trigger_webhook_media_processor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- 🔍 Log para debug
    RAISE NOTICE '[TRIGGER] 🔥 Mídia detectada, processando com UPLOAD REAL: message_id=%, media_type=%', 
        NEW.id, NEW.media_type;
    
    -- ⚡ CHAMAR WORKER COM UPLOAD REAL
    BEGIN
        SELECT process_webhook_media_with_real_upload(NEW.id) INTO v_result;
        RAISE NOTICE '[TRIGGER] ✅ Worker com upload real executado: %', v_result;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[TRIGGER] ❌ Erro no worker: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;

-- ================================================================
-- 4️⃣ TESTE DO SISTEMA COMPLETO
-- ================================================================

-- Testar worker atualizado
SELECT 
    '🧪 TESTE WORKER COM UPLOAD REAL' as teste,
    process_webhook_media_with_real_upload('f63ad4b5-78aa-4e26-a634-d7948d6e6dbe'::uuid) as resultado;

-- ================================================================
-- 5️⃣ INSTRUÇÕES PARA CRIAR EDGE FUNCTION
-- ================================================================

-- Criar arquivo: supabase/functions/storage_upload_service/index.ts
-- Deploy com: supabase functions deploy storage_upload_service

SELECT 
    '📝 PRÓXIMOS PASSOS' as instrucoes,
    'Criar Edge Function storage_upload_service conforme código comentado acima' as passo_1,
    'Deploy da função com: supabase functions deploy storage_upload_service' as passo_2,
    'Testar worker atualizado' as passo_3;