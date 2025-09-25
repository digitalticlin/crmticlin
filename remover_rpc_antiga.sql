-- ============================================
-- REMOVER RPC ANTIGA (14 parâmetros)
-- ============================================

-- O PostgreSQL criou 2 versões da mesma função:
-- 1. Versão antiga: 14 parâmetros (sem p_instance_funnel_id)
-- 2. Versão nova: 15 parâmetros (com p_instance_funnel_id)

-- PROBLEMA: A edge pode chamar a versão errada!
-- SOLUÇÃO: Remover a versão antiga para forçar uso da nova

-- Remover função antiga com 14 parâmetros
DROP FUNCTION IF EXISTS public.save_received_message_webhook(
    text, text, text, boolean, text, text, text, text, text, text, text, text, uuid, text
);

-- Verificar se só sobrou a versão nova (15 parâmetros)
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'save_received_message_webhook';

    IF v_count = 1 THEN
        RAISE NOTICE '✅ SUCCESS: Apenas 1 versão da RPC save_received_message_webhook existe!';

        -- Log dos detalhes da função restante
        RAISE NOTICE 'Função ativa encontrada com sucesso';

    ELSIF v_count > 1 THEN
        RAISE WARNING '⚠️ ATENÇÃO: Ainda existem % versões da função!', v_count;
    ELSE
        RAISE EXCEPTION '❌ ERRO: Nenhuma versão da função encontrada!';
    END IF;
END $$;

-- Verificação final
SELECT
    'LIMPEZA CONCLUÍDA!' as resultado,
    COUNT(*) as rpcs_restantes
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'save_received_message_webhook';