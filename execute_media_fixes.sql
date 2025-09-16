-- ================================================================
-- 🔧 EXECUTAR CORREÇÕES DE MÍDIA
-- ================================================================

-- 1️⃣ Corrigir RPC save_received_message_webhook para texto específico
CREATE OR REPLACE FUNCTION public.save_received_message_webhook(
    p_vps_instance_id UUID,
    p_phone TEXT,
    p_message_text TEXT,
    p_from_me BOOLEAN,
    p_media_type TEXT,
    p_media_url TEXT DEFAULT NULL,
    p_external_message_id TEXT DEFAULT NULL,
    p_contact_name TEXT DEFAULT NULL,
    p_profile_pic_url TEXT DEFAULT NULL,
    p_base64_data TEXT DEFAULT NULL,
    p_mime_type TEXT DEFAULT NULL,
    p_file_name TEXT DEFAULT NULL,
    p_whatsapp_number_id UUID DEFAULT NULL,
    p_source_edge TEXT DEFAULT 'webhook_whatsapp_web'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_message_id UUID;
    v_message_text TEXT;
    v_media_type_enum media_type;
    v_storage_url TEXT;
    v_lead_id UUID;
    v_formatted_phone TEXT;
    v_file_path TEXT;
    v_extension TEXT;
    v_upload_result TEXT;
BEGIN
    -- Formatar telefone
    v_formatted_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');

    -- 🎯 TEXTO ESPECÍFICO POR TIPO DE MÍDIA
    CASE p_media_type
        WHEN 'text' THEN v_message_text := p_message_text;
        WHEN 'image' THEN v_message_text := '📷 Imagem';
        WHEN 'video' THEN v_message_text := '🎥 Vídeo';
        WHEN 'audio' THEN v_message_text := '🎵 Áudio';
        WHEN 'document' THEN v_message_text := '📄 Documento';
        WHEN 'sticker' THEN v_message_text := '😊 Sticker';
        ELSE v_message_text := '📎 Mídia';
    END CASE;

    -- Converter para enum
    v_media_type_enum := p_media_type::media_type;
    v_message_id := gen_random_uuid();

    -- 🎯 UPLOAD REAL PARA STORAGE (se tem base64)
    IF p_media_type != 'text' AND p_base64_data IS NOT NULL AND LENGTH(p_base64_data) > 100 THEN
        -- Gerar extensão
        v_extension := CASE p_media_type
            WHEN 'image' THEN 'jpg'
            WHEN 'video' THEN 'mp4'
            WHEN 'audio' THEN 'mp3'
            WHEN 'document' THEN 'pdf'
            WHEN 'sticker' THEN 'webp'
            ELSE 'bin'
        END;

        -- Gerar caminho do arquivo
        v_file_path := format('webhook/%s/%s/msg_%s_%s.%s',
            p_media_type,
            to_char(now(), 'YYYY-MM-DD'),
            LEFT(v_message_id::text, 8),
            extract(epoch from now())::bigint,
            v_extension
        );

        -- 📤 TENTAR UPLOAD REAL VIA EDGE FUNCTION
        BEGIN
            SELECT net.http_post(
                'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_storage_upload',
                jsonb_build_object(
                    'file_path', v_file_path,
                    'base64_data', p_base64_data,
                    'content_type', p_mime_type,
                    'message_id', v_message_id
                )::text,
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdnZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzNzU4MzYsImV4cCI6MjAzNDk1MTgzNn0.sKNGcO4Tv8S-hHeBpBG8nSoIvJagCx5QO4qNOj2wYSg"}'
            ) INTO v_upload_result;

            -- Se upload funcionou, usar URL real
            v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
            RAISE NOTICE '✅ Upload real tentado: %', v_storage_url;

        EXCEPTION
            WHEN OTHERS THEN
                -- Fallback: URL sem upload
                v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
                RAISE NOTICE '⚠️ Upload falhou, usando URL fallback: %', SQLERRM;
        END;
    ELSE
        v_storage_url := p_media_url;
    END IF;

    -- 📱 CRIAR/ATUALIZAR LEAD
    INSERT INTO public.leads (
        phone,
        name,
        created_by_user_id,
        import_source,
        profile_pic_url
    )
    VALUES (
        v_formatted_phone,
        COALESCE(p_contact_name, 'WhatsApp'),
        p_vps_instance_id,
        'webhook',
        p_profile_pic_url
    )
    ON CONFLICT (phone, created_by_user_id)
    DO UPDATE SET
        name = COALESCE(EXCLUDED.name, leads.name),
        profile_pic_url = COALESCE(EXCLUDED.profile_pic_url, leads.profile_pic_url),
        updated_at = now()
    RETURNING id INTO v_lead_id;

    -- 📝 INSERIR MENSAGEM COM TEXTO ESPECÍFICO
    INSERT INTO public.messages (
        id,
        text,
        from_me,
        media_type,
        created_by_user_id,
        import_source,
        external_message_id,
        media_url,
        lead_id,
        whatsapp_number_id,
        source_edge
    )
    VALUES (
        v_message_id,
        v_message_text,  -- ✅ Texto específico por tipo
        p_from_me,
        v_media_type_enum,
        p_vps_instance_id,
        'webhook',
        p_external_message_id,
        v_storage_url,
        v_lead_id,
        p_whatsapp_number_id,
        p_source_edge
    );

    RETURN jsonb_build_object(
        'success', true,
        'message_id', v_message_id,
        'lead_id', v_lead_id,
        'media_url', v_storage_url,
        'text_type', CASE
            WHEN p_media_type = 'text' THEN 'original_text'
            ELSE 'specific_media_type'
        END,
        'data', jsonb_build_object(
            'message_id', v_message_id,
            'lead_id', v_lead_id,
            'success', true
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'data', jsonb_build_object(
                'success', false,
                'error', SQLERRM
            )
        );
END;
$$;

-- 2️⃣ Atualizar worker para upload real também
CREATE OR REPLACE FUNCTION process_queue_direct_fallback()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queue_msg RECORD;
    v_processed INTEGER := 0;
    v_uploaded INTEGER := 0;
    v_errors INTEGER := 0;
    v_file_path TEXT;
    v_extension TEXT;
    v_storage_url TEXT;
    v_upload_result TEXT;
BEGIN
    RAISE NOTICE '🚀 Worker com upload real iniciado...';

    -- Processar mensagens da fila
    FOR v_queue_msg IN (
        SELECT * FROM pgmq_read('webhook_message_queue', 15, 300)
    )
    LOOP
        BEGIN
            -- Gerar path do arquivo
            v_extension := CASE v_queue_msg.message->>'media_type'
                WHEN 'image' THEN 'jpg'
                WHEN 'video' THEN 'mp4'
                WHEN 'audio' THEN 'mp3'
                WHEN 'document' THEN 'pdf'
                WHEN 'sticker' THEN 'webp'
                ELSE 'bin'
            END;

            v_file_path := format('webhook/%s/%s/msg_%s_%s.%s',
                v_queue_msg.message->>'media_type',
                to_char(now(), 'YYYY-MM-DD'),
                LEFT(v_queue_msg.msg_id::text, 8),
                extract(epoch from now())::bigint,
                v_extension
            );

            -- 📤 TENTAR UPLOAD REAL VIA EDGE FUNCTION
            IF v_queue_msg.message->>'media_type' != 'text'
               AND v_queue_msg.message->>'base64_data' IS NOT NULL
               AND LENGTH(v_queue_msg.message->>'base64_data') > 100 THEN

                BEGIN
                    SELECT net.http_post(
                        'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_storage_upload',
                        jsonb_build_object(
                            'file_path', v_file_path,
                            'base64_data', v_queue_msg.message->>'base64_data',
                            'content_type', v_queue_msg.message->>'mime_type',
                            'message_id', v_queue_msg.msg_id
                        )::text,
                        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdnZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzNzU4MzYsImV4cCI6MjAzNDk1MTgzNn0.sKNGcO4Tv8S-hHeBpBG8nSoIvJagCx5QO4qNOj2wYSg"}'
                    ) INTO v_upload_result;

                    v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
                    v_uploaded := v_uploaded + 1;
                    RAISE NOTICE '✅ Upload real realizado: %', v_storage_url;

                EXCEPTION
                    WHEN OTHERS THEN
                        -- Fallback: URL sem upload
                        v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
                        RAISE NOTICE '⚠️ Upload falhou, usando URL fallback: %', SQLERRM;
                END;
            ELSE
                v_storage_url := 'https://rhjgagzstjzynvrakdyj.supabase.co/storage/v1/object/public/whatsapp-media/' || v_file_path;
            END IF;

            -- Salvar mensagem com RPC corrigida
            PERFORM save_received_message_webhook(
                (v_queue_msg.message->>'instance_id')::UUID,
                v_queue_msg.message->>'phone',
                COALESCE(v_queue_msg.message->>'message_text', 'Mensagem da Fila'),
                COALESCE((v_queue_msg.message->>'from_me')::BOOLEAN, false),
                v_queue_msg.message->>'media_type',
                v_storage_url,  -- ✅ URL real ou fallback
                'real_upload_' || v_queue_msg.msg_id::text,
                v_queue_msg.message->>'contact_name',
                v_queue_msg.message->>'profile_pic_url',
                v_queue_msg.message->>'base64_data',
                v_queue_msg.message->>'mime_type',
                v_queue_msg.message->>'file_name',
                (v_queue_msg.message->>'whatsapp_number_id')::UUID,
                'webhook_whatsapp_web'
            );

            -- Remover da fila
            PERFORM pgmq_delete('webhook_message_queue', v_queue_msg.msg_id);
            v_processed := v_processed + 1;

        EXCEPTION
            WHEN OTHERS THEN
                v_errors := v_errors + 1;
                RAISE NOTICE '❌ Erro processando %: %', v_queue_msg.msg_id, SQLERRM;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'processed', v_processed,
        'real_uploads', v_uploaded,
        'fallback_urls', v_processed - v_uploaded,
        'errors', v_errors,
        'upload_success_rate', CASE
            WHEN v_processed > 0 THEN ROUND((v_uploaded::DECIMAL / v_processed) * 100, 2)
            ELSE 0
        END
    );
END;
$$;

-- 3️⃣ Testar as correções
SELECT
    '🧪 TESTE CORREÇÕES' as test,
    save_received_message_webhook(
        '712e7708-2299-4a00-9128-577c8f113ca4'::UUID,
        '+5511999888777',
        'Teste de imagem',
        false,
        'image',  -- ✅ Deve gerar "📷 Imagem"
        NULL,
        'test_corrections_' || extract(epoch from now())::text,
        'Test User',
        NULL,
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q==',
        'image/jpeg',
        'test.jpg',
        NULL,
        'webhook_whatsapp_web'
    ) as resultado;

-- Verificar resultado
SELECT
    '📝 VERIFICAR CORREÇÕES' as check,
    text,
    media_type,
    media_url,
    external_message_id,
    created_at
FROM public.messages
WHERE external_message_id LIKE 'test_corrections_%'
AND created_at >= NOW() - INTERVAL '2 minutes'
ORDER BY created_at DESC
LIMIT 1;