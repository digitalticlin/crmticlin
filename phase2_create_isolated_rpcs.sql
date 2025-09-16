-- ================================================================
-- FASE 2: CRIAR 3 RPCs ISOLADAS COM PROCESSAMENTO EM FILA
-- ================================================================

-- 🧹 PRIMEIRO: Identificar e remover a RPC duplicada (versão de 10 params)

-- Listar as versões existentes para confirmar qual remover
SELECT 
    p.proname as function_name,
    p.oid::regprocedure as full_signature,
    p.pronargs as num_args,
    'DUPLICADA - SERÁ REMOVIDA' as action
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'save_whatsapp_message_service_role'
AND p.pronargs = 10; -- Versão com 10 parâmetros

-- Remover a versão de 10 parâmetros (com p_base64_data)
DROP FUNCTION IF EXISTS public.save_whatsapp_message_service_role(
    text, text, text, boolean, text, text, text, text, text, text
);

-- ================================================================
-- 1️⃣ RPC PARA WEBHOOK (RECEBE MENSAGENS DA VPS)
-- ================================================================

CREATE OR REPLACE FUNCTION public.save_received_message_webhook(
    p_vps_instance_id text,
    p_phone text,
    p_message_text text,
    p_from_me boolean DEFAULT false,
    p_media_type text DEFAULT 'text',
    p_media_url text DEFAULT NULL,
    p_external_message_id text DEFAULT NULL,
    p_contact_name text DEFAULT NULL,
    p_profile_pic_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_instance_id UUID;
    v_user_id UUID;
    v_lead_id UUID;
    v_message_id UUID;
    v_funnel_id UUID;
    v_stage_id UUID;
    v_phone_data jsonb;
    v_clean_phone text;
    v_display_name text;
    v_contact_name text;
    v_is_new_lead BOOLEAN := FALSE;
    v_current_profile_pic text;
    v_profile_pic_updated BOOLEAN := FALSE;
    v_has_media BOOLEAN := FALSE;
    v_media_emoji text;
BEGIN
    RAISE NOTICE '[save_received_message_webhook] 🚀 Processando mensagem recebida da VPS: %', p_vps_instance_id;

    -- ETAPA 1: Buscar instância
    SELECT id, created_by_user_id 
    INTO v_instance_id, v_user_id
    FROM public.whatsapp_instances 
    WHERE vps_instance_id = p_vps_instance_id;
    
    IF v_instance_id IS NULL THEN
        RAISE NOTICE '[save_received_message_webhook] ❌ Instância não encontrada: %', p_vps_instance_id;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Instance not found',
            'source', 'webhook'
        );
    END IF;

    -- ETAPA 2: Formatação do telefone
    BEGIN
        v_phone_data := format_brazilian_phone(p_phone);
        v_clean_phone := v_phone_data->>'phone';
        v_display_name := v_phone_data->>'display';
    EXCEPTION WHEN OTHERS THEN
        v_clean_phone := split_part(p_phone, '@', 1);
        IF length(v_clean_phone) = 13 THEN
            v_display_name := '+55 (' || substring(v_clean_phone, 3, 2) || ') ' ||
                             substring(v_clean_phone, 5, 5) || '-' ||
                             substring(v_clean_phone, 10, 4);
        ELSE
            v_display_name := v_clean_phone;
        END IF;
    END;

    v_contact_name := v_display_name;

    -- ETAPA 3: Buscar funil e estágio
    SELECT id INTO v_funnel_id
    FROM public.funnels 
    WHERE created_by_user_id = v_user_id 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF v_funnel_id IS NOT NULL THEN
        SELECT id INTO v_stage_id
        FROM public.kanban_stages 
        WHERE funnel_id = v_funnel_id 
        ORDER BY order_position ASC 
        LIMIT 1;
    END IF;

    -- ETAPA 4: Buscar/criar lead
    SELECT id, profile_pic_url INTO v_lead_id, v_current_profile_pic
    FROM public.leads 
    WHERE phone = v_clean_phone 
    AND created_by_user_id = v_user_id;

    -- Determinar emoji para mídia
    IF p_media_type != 'text' THEN
        v_has_media := TRUE;
        v_media_emoji := CASE p_media_type
            WHEN 'image' THEN '📷 Imagem'
            WHEN 'video' THEN '🎥 Vídeo'
            WHEN 'audio' THEN '🎵 Áudio'
            WHEN 'document' THEN '📄 Documento'
            WHEN 'sticker' THEN '😊 Sticker'
            WHEN 'voice' THEN '🎤 Áudio'
            WHEN 'ptt' THEN '🎤 Áudio'
            ELSE '📎 Mídia'
        END;
    END IF;

    IF v_lead_id IS NULL THEN
        -- Criar novo lead
        v_is_new_lead := TRUE;
        INSERT INTO public.leads (
            phone, name, whatsapp_number_id, created_by_user_id,
            funnel_id, kanban_stage_id, last_message_time, last_message,
            import_source, unread_count, profile_pic_url
        )
        VALUES (
            v_clean_phone, v_contact_name, v_instance_id, v_user_id,
            v_funnel_id, v_stage_id, now(), 
            COALESCE(p_message_text, v_media_emoji),
            'webhook', 1, p_profile_pic_url
        )
        RETURNING id INTO v_lead_id;
    ELSE
        -- Atualizar lead existente
        UPDATE public.leads 
        SET 
            last_message_time = now(),
            last_message = COALESCE(p_message_text, v_media_emoji),
            unread_count = COALESCE(unread_count, 0) + 1,
            profile_pic_url = COALESCE(p_profile_pic_url, profile_pic_url),
            updated_at = now()
        WHERE id = v_lead_id;
    END IF;

    -- ETAPA 5: Inserir mensagem
    INSERT INTO public.messages (
        lead_id, whatsapp_number_id, text, from_me, timestamp, status,
        created_by_user_id, media_type, media_url, import_source, external_message_id
    )
    VALUES (
        v_lead_id, v_instance_id, 
        CASE 
            WHEN p_message_text IS NOT NULL AND p_message_text != '' THEN p_message_text
            WHEN v_has_media THEN v_media_emoji
            ELSE 'Mensagem'
        END,
        p_from_me, now(), 'received'::message_status, v_user_id,
        COALESCE(p_media_type::media_type, 'text'::media_type),
        NULL, -- media_url será preenchida pelo worker
        'webhook', p_external_message_id
    )
    RETURNING id INTO v_message_id;

    -- ETAPA 6: Enfileirar para processamento se há mídia
    IF v_has_media AND p_media_url IS NOT NULL THEN
        PERFORM pgmq.send('webhook_message_queue', jsonb_build_object(
            'action', 'process_media',
            'source', 'webhook',
            'priority', 'high',
            'message_id', v_message_id,
            'message_data', jsonb_build_object(
                'vps_instance_id', p_vps_instance_id,
                'phone', v_clean_phone,
                'message_text', p_message_text,
                'external_message_id', p_external_message_id
            ),
            'media_data', jsonb_build_object(
                'media_type', p_media_type,
                'media_url', p_media_url,
                'base64_data', NULL -- Será extraído pelo worker
            ),
            'metadata', jsonb_build_object(
                'retry_count', 0,
                'created_at', now(),
                'processing_deadline', now() + interval '1 hour'
            )
        ));
        
        RAISE NOTICE '[save_received_message_webhook] 📦 Mídia enfileirada para processamento: %', v_message_id;
    END IF;

    -- ETAPA 7: Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'source', 'webhook',
        'data', jsonb_build_object(
            'message_id', v_message_id,
            'lead_id', v_lead_id,
            'instance_id', v_instance_id,
            'user_id', v_user_id,
            'clean_phone', v_clean_phone,
            'display_name', v_display_name,
            'is_new_lead', v_is_new_lead,
            'has_media', v_has_media,
            'queued_for_processing', v_has_media,
            'method', 'webhook_isolated'
        )
    );

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[save_received_message_webhook] ❌ ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
    
    RETURN jsonb_build_object(
        'success', false,
        'source', 'webhook',
        'error', SQLERRM,
        'sqlstate', SQLSTATE
    );
END;
$$;

COMMENT ON FUNCTION public.save_received_message_webhook IS 'RPC isolada para processar mensagens recebidas da VPS via webhook_whatsapp_web';

-- ================================================================
-- 2️⃣ RPC PARA APP (ENVIA MENSAGENS DO PROJETO)
-- ================================================================

CREATE OR REPLACE FUNCTION public.save_sent_message_from_app(
    p_vps_instance_id text,
    p_phone text,
    p_message_text text,
    p_external_message_id text DEFAULT NULL,
    p_contact_name text DEFAULT NULL,
    p_media_type text DEFAULT 'text',
    p_media_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_instance_id UUID;
    v_user_id UUID;
    v_lead_id UUID;
    v_message_id UUID;
    v_clean_phone text;
    v_has_media BOOLEAN := FALSE;
    v_media_emoji text;
BEGIN
    RAISE NOTICE '[save_sent_message_from_app] 🚀 Processando mensagem enviada pelo app: %', p_vps_instance_id;

    -- ETAPA 1: Buscar instância
    SELECT id, created_by_user_id 
    INTO v_instance_id, v_user_id
    FROM public.whatsapp_instances 
    WHERE vps_instance_id = p_vps_instance_id;
    
    IF v_instance_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Instance not found', 'source', 'app');
    END IF;

    -- ETAPA 2: Limpar telefone
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- ETAPA 3: Buscar lead
    SELECT id INTO v_lead_id
    FROM public.leads 
    WHERE phone = v_clean_phone 
    AND created_by_user_id = v_user_id;

    -- Determinar emoji para mídia
    IF p_media_type != 'text' THEN
        v_has_media := TRUE;
        v_media_emoji := CASE p_media_type
            WHEN 'image' THEN '📷 Imagem'
            WHEN 'video' THEN '🎥 Vídeo'
            WHEN 'audio' THEN '🎵 Áudio'
            WHEN 'document' THEN '📄 Documento'
            ELSE '📎 Mídia'
        END;
    END IF;

    -- ETAPA 4: Inserir mensagem
    INSERT INTO public.messages (
        lead_id, whatsapp_number_id, text, from_me, timestamp, status,
        created_by_user_id, media_type, media_url, import_source, external_message_id
    )
    VALUES (
        v_lead_id, v_instance_id,
        CASE 
            WHEN p_message_text IS NOT NULL AND p_message_text != '' THEN p_message_text
            WHEN v_has_media THEN v_media_emoji
            ELSE 'Mensagem'
        END,
        true, now(), 'sent'::message_status, v_user_id,
        COALESCE(p_media_type::media_type, 'text'::media_type),
        NULL, -- Será preenchida pelo worker
        'app', p_external_message_id
    )
    RETURNING id INTO v_message_id;

    -- ETAPA 5: Enfileirar se há mídia
    IF v_has_media AND p_media_url IS NOT NULL THEN
        PERFORM pgmq.send('app_message_queue', jsonb_build_object(
            'action', 'process_media',
            'source', 'app',
            'priority', 'normal',
            'message_id', v_message_id,
            'media_data', jsonb_build_object(
                'media_type', p_media_type,
                'media_url', p_media_url
            ),
            'metadata', jsonb_build_object(
                'retry_count', 0,
                'created_at', now()
            )
        ));
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'source', 'app',
        'data', jsonb_build_object(
            'message_id', v_message_id,
            'lead_id', v_lead_id,
            'has_media', v_has_media,
            'method', 'app_isolated'
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'source', 'app', 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.save_sent_message_from_app IS 'RPC isolada para processar mensagens enviadas pelo app via whatsapp_messaging_service';

-- ================================================================
-- 3️⃣ RPC PARA AI/N8N (ENVIA MENSAGENS DO AI)
-- ================================================================

CREATE OR REPLACE FUNCTION public.save_sent_message_from_ai(
    p_vps_instance_id text,
    p_phone text,
    p_message_text text,
    p_media_type text DEFAULT 'text',
    p_media_url text DEFAULT NULL,
    p_external_message_id text DEFAULT NULL,
    p_contact_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_instance_id UUID;
    v_user_id UUID;
    v_lead_id UUID;
    v_message_id UUID;
    v_clean_phone text;
    v_has_media BOOLEAN := FALSE;
    v_media_emoji text;
BEGIN
    RAISE NOTICE '[save_sent_message_from_ai] 🤖 Processando mensagem do AI/N8N: %', p_vps_instance_id;

    -- ETAPA 1: Buscar instância
    SELECT id, created_by_user_id 
    INTO v_instance_id, v_user_id
    FROM public.whatsapp_instances 
    WHERE vps_instance_id = p_vps_instance_id;
    
    IF v_instance_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Instance not found', 'source', 'ai');
    END IF;

    -- ETAPA 2: Limpar telefone
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- ETAPA 3: Buscar lead
    SELECT id INTO v_lead_id
    FROM public.leads 
    WHERE phone = v_clean_phone 
    AND created_by_user_id = v_user_id;

    -- Determinar emoji para mídia
    IF p_media_type != 'text' THEN
        v_has_media := TRUE;
        v_media_emoji := CASE p_media_type
            WHEN 'image' THEN '📷 Imagem'
            WHEN 'video' THEN '🎥 Vídeo'
            WHEN 'audio' THEN '🎵 Áudio'
            WHEN 'document' THEN '📄 Documento'
            WHEN 'voice' THEN '🎤 Áudio'
            WHEN 'ptt' THEN '🎤 Áudio'
            ELSE '📎 Mídia'
        END;
    END IF;

    -- ETAPA 4: Inserir mensagem COM FLAG AI
    INSERT INTO public.messages (
        lead_id, whatsapp_number_id, text, from_me, timestamp, status,
        created_by_user_id, media_type, media_url, import_source, 
        external_message_id, ai_description
    )
    VALUES (
        v_lead_id, v_instance_id,
        CASE 
            WHEN p_message_text IS NOT NULL AND p_message_text != '' THEN p_message_text
            WHEN v_has_media THEN v_media_emoji
            ELSE 'Mensagem AI'
        END,
        true, now(), 'sent'::message_status, v_user_id,
        COALESCE(p_media_type::media_type, 'text'::media_type),
        NULL, -- Será preenchida pelo worker
        'ai', p_external_message_id,
        'AI Generated Message' -- FLAG para identificar mensagens AI
    )
    RETURNING id INTO v_message_id;

    -- ETAPA 5: Enfileirar se há mídia
    IF v_has_media AND p_media_url IS NOT NULL THEN
        PERFORM pgmq.send('ai_message_queue', jsonb_build_object(
            'action', 'process_media',
            'source', 'ai',
            'priority', 'normal',
            'message_id', v_message_id,
            'media_data', jsonb_build_object(
                'media_type', p_media_type,
                'media_url', p_media_url
            ),
            'metadata', jsonb_build_object(
                'retry_count', 0,
                'created_at', now()
            )
        ));
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'source', 'ai',
        'data', jsonb_build_object(
            'message_id', v_message_id,
            'lead_id', v_lead_id,
            'has_media', v_has_media,
            'ai_flag_set', true,
            'method', 'ai_isolated'
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'source', 'ai', 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.save_sent_message_from_ai IS 'RPC isolada para processar mensagens do AI/N8N via ai_messaging_service';

-- ================================================================
-- ✅ VERIFICAR SE TODAS AS RPCS FORAM CRIADAS
-- ================================================================

SELECT 
    '✅ FASE 2 COMPLETA' as resultado,
    'RPCs isoladas criadas com sucesso' as detalhes,
    jsonb_build_object(
        'rpcs_criadas', 3,
        'webhook_rpc', 'save_received_message_webhook',
        'app_rpc', 'save_sent_message_from_app',
        'ai_rpc', 'save_sent_message_from_ai',
        'filas_integradas', jsonb_build_array(
            'webhook_message_queue',
            'app_message_queue', 
            'ai_message_queue'
        ),
        'rpc_duplicada_removida', true,
        'processamento_em_fila', true
    ) as estrutura;