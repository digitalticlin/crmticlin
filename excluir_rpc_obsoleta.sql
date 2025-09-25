-- ============================================
-- EXCLUIR RPC OBSOLETA: process_whatsapp_message
-- ============================================

-- Esta RPC estava salvando leads com contact_name da VPS
-- e causando conflitos com save_received_message_webhook

-- REMOVER A FUNÇÃO OBSOLETA COMPLETAMENTE
DROP FUNCTION IF EXISTS public.process_whatsapp_message(
    text, text, text, boolean, text, text, text, text
);

-- REMOVER TODAS AS VARIAÇÕES POSSÍVEIS DA FUNÇÃO
DROP FUNCTION IF EXISTS public.process_whatsapp_message(
    p_vps_instance_id text,
    p_phone text,
    p_message_text text,
    p_from_me boolean,
    p_media_type text,
    p_media_url text,
    p_external_message_id text,
    p_contact_name text
);

-- VERIFICAR SE FOI REMOVIDA
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'process_whatsapp_message'
    ) THEN
        RAISE NOTICE '❌ ERRO: Função process_whatsapp_message ainda existe!';
    ELSE
        RAISE NOTICE '✅ SUCCESS: Função process_whatsapp_message removida com sucesso!';
    END IF;
END $$;

-- LISTAR FUNÇÕES RESTANTES RELACIONADAS A WHATSAPP
SELECT
    'Funções WhatsApp restantes:' as info,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%whatsapp%'
ORDER BY p.proname;

-- LOG DE CONCLUSÃO
SELECT 'RPC OBSOLETA REMOVIDA COM SUCESSO!' as resultado;