-- ================================================================
-- INVESTIGAÇÃO: AS FUNÇÕES SÃO OVERLOADS OU DUPLICATAS?
-- ================================================================

-- 1. IDENTIFICAR OVERLOADS (funções com mesmo nome mas assinaturas diferentes)
SELECT 
    p.proname as function_name,
    p.oid::regprocedure as full_signature,
    p.pronargs as num_args,
    array_agg(t.typname ORDER BY a.argposition) as arg_types,
    obj_description(p.oid, 'pg_proc') as function_comment
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN LATERAL unnest(p.proargtypes) WITH ORDINALITY as a(argtype, argposition) ON true
LEFT JOIN pg_type t ON t.oid = a.argtype
WHERE n.nspname = 'public'
AND p.proname = 'save_whatsapp_message_service_role'
GROUP BY p.proname, p.oid, p.pronargs
ORDER BY p.pronargs;

-- 2. VER O CÓDIGO FONTE DE CADA VERSÃO
\echo '=== VERSÃO 1 DA FUNÇÃO ==='
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'save_whatsapp_message_service_role' 
AND pronargs = 8
LIMIT 1;

\echo '=== VERSÃO 2 DA FUNÇÃO ==='
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'save_whatsapp_message_service_role' 
AND pronargs = 9
LIMIT 1;

-- 3. RASTREAR QUAL EDGE USA QUAL FUNÇÃO
-- Analisando o código das edges:
-- webhook_whatsapp_web chama com 9 parâmetros: 
--   p_vps_instance_id, p_phone, p_message_text, p_from_me, 
--   p_media_type, p_media_url, p_external_message_id, 
--   p_contact_name, p_profile_pic_url

-- 4. VERIFICAR CHAMADAS REAIS NO BANCO
WITH function_calls AS (
    SELECT 
        'save_whatsapp_message_service_role com p_from_me' as function_variant,
        COUNT(*) as total_calls,
        COUNT(CASE WHEN from_me = true THEN 1 END) as from_me_true,
        COUNT(CASE WHEN from_me = false THEN 1 END) as from_me_false,
        COUNT(profile_pic_url) as with_profile_pic
    FROM messages
    WHERE created_at > NOW() - INTERVAL '30 days'
)
SELECT * FROM function_calls;

-- 5. PROPOSTA DE RENOMEAÇÃO PARA ISOLAMENTO COMPLETO
-- ================================================================
SELECT 
    'PROPOSTA DE RENOMEAÇÃO' as action,
    jsonb_build_object(
        'webhook_whatsapp_web', jsonb_build_object(
            'função_atual', 'save_whatsapp_message_service_role (9 params com p_from_me)',
            'nova_função', 'save_received_message_webhook',
            'descrição', 'Exclusiva para receber mensagens do webhook'
        ),
        'whatsapp_messaging_service', jsonb_build_object(
            'função_atual', 'save_sent_message_only',
            'nova_função', 'save_sent_message_from_app',
            'descrição', 'Exclusiva para enviar mensagens do app'
        ),
        'ai_messaging_service', jsonb_build_object(
            'função_atual', 'save_whatsapp_message_ai_agent',
            'nova_função', 'save_sent_message_from_ai',
            'descrição', 'Exclusiva para enviar mensagens do AI/N8N'
        )
    ) as renaming_proposal;

-- 6. VERIFICAR SE JÁ EXISTEM ESSAS NOVAS FUNÇÕES
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'save_received_message_webhook',
    'save_sent_message_from_app',
    'save_sent_message_from_ai'
)
ORDER BY routine_name;

-- 7. ANALISAR PARÂMETROS NECESSÁRIOS PARA CADA EDGE
SELECT 
    'PARÂMETROS NECESSÁRIOS POR EDGE' as analysis,
    jsonb_build_object(
        'webhook_whatsapp_web', jsonb_build_array(
            'p_vps_instance_id',
            'p_phone',
            'p_message_text',
            'p_from_me (sempre false)',
            'p_media_type',
            'p_media_url',
            'p_external_message_id',
            'p_contact_name',
            'p_profile_pic_url'
        ),
        'whatsapp_messaging_service', jsonb_build_array(
            'p_vps_instance_id',
            'p_phone',
            'p_message_text',
            'p_external_message_id',
            'p_contact_name',
            'p_media_type',
            'p_media_url'
        ),
        'ai_messaging_service', jsonb_build_array(
            'p_vps_instance_id',
            'p_phone',
            'p_message_text',
            'p_media_type',
            'p_media_url',
            'p_external_message_id',
            'p_contact_name'
        )
    ) as parameters_by_edge;

-- 8. VERIFICAR CONFLITOS POTENCIAIS
-- Mensagens duplicadas ou com timestamps muito próximos
SELECT 
    lead_id,
    text,
    from_me,
    COUNT(*) as duplicates,
    array_agg(id) as message_ids,
    array_agg(created_at) as timestamps,
    MAX(created_at) - MIN(created_at) as time_diff
FROM messages
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY lead_id, text, from_me
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 10;