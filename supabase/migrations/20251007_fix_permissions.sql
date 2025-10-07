-- 🔧 Corrigir permissões após DROP CASCADE

-- 1️⃣ Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_numbers') THEN
        RAISE EXCEPTION '❌ TABELA whatsapp_numbers NÃO EXISTE! Verifique o schema.';
    ELSE
        RAISE NOTICE '✅ Tabela whatsapp_numbers existe';
    END IF;
END $$;

-- 2️⃣ Garantir permissões para a função
GRANT SELECT ON public.whatsapp_numbers TO postgres;
GRANT SELECT, INSERT, UPDATE ON public.leads TO postgres;
GRANT SELECT, INSERT, UPDATE ON public.messages TO postgres;
GRANT SELECT ON public.instance_funnels TO postgres;
GRANT SELECT ON public.funnel_stages TO postgres;

-- 3️⃣ Garantir que a função pode executar com SECURITY DEFINER
ALTER FUNCTION public.save_received_message_webhook OWNER TO postgres;

-- 4️⃣ Verificar se extensão pg_net está ativa (necessária para net.http_post)
CREATE EXTENSION IF NOT EXISTS pg_net;

RAISE NOTICE '✅ Permissões corrigidas!';
