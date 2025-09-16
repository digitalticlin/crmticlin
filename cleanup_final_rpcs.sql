-- ================================================================
-- 🧹 LIMPEZA CIRÚRGICA - REMOVER APENAS VERSÕES ANTIGAS/DUPLICADAS
-- ================================================================

-- 1️⃣ REMOVER VERSÕES ANTIGAS DE save_sent_message_from_ai (manter apenas a de 14 parâmetros)
DROP FUNCTION IF EXISTS public.save_sent_message_from_ai(text, text, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.save_sent_message_from_ai(text, text, text, boolean, text, text, text, text) CASCADE;

-- 2️⃣ REMOVER VERSÕES ANTIGAS DE save_sent_message_from_app (manter apenas a de 14 parâmetros)
DROP FUNCTION IF EXISTS public.save_sent_message_from_app(text, text, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.save_sent_message_from_app(text, text, text, boolean, text, text, text, text) CASCADE;

-- 3️⃣ REMOVER FUNÇÕES OBSOLETAS ANTIGAS
DROP FUNCTION IF EXISTS public.save_whatsapp_message_complete(text, text, text, boolean, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.save_whatsapp_message_complete(uuid, uuid, text, text, text, text, text, boolean, text) CASCADE;
DROP FUNCTION IF EXISTS public.save_whatsapp_message_complete_v2(text, text, text, boolean, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.save_whatsapp_message_simple(text, text, text, boolean, text) CASCADE;

-- 4️⃣ VALIDAR RESULTADO - APENAS 3 RPCS COM 14 PARÂMETROS CADA
SELECT
    '🎯 RESULTADO FINAL' as info,
    proname as function_name,
    pronargs as num_args
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN ('save_received_message_webhook', 'save_sent_message_from_app', 'save_sent_message_from_ai')
ORDER BY proname;

-- 5️⃣ CONFIRMAR LIMPEZA
SELECT '✅ LIMPEZA CIRÚRGICA CONCLUÍDA - MANTIDAS APENAS AS 3 RPCs ISOLADAS' as resultado;