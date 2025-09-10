-- =====================================================
-- 🧪 SETUP TESTE USUÁRIO OPERACIONAL
-- Execute este SQL no painel do Supabase para criar dados de teste
-- =====================================================

-- 1. Criar um usuário operacional de teste (se não existir)
-- SUBSTITUA 'teste@operacional.com' pelo email real do usuário que você quer usar para teste
DO $$
DECLARE
    test_user_id uuid;
    test_funnel_id uuid;
    test_whatsapp_id uuid;
BEGIN
    -- Buscar ou criar usuário de teste operacional
    SELECT id INTO test_user_id 
    FROM profiles 
    WHERE email = 'teste@operacional.com' AND role = 'operational'
    LIMIT 1;
    
    -- Se não encontrou, mostrar instruções
    IF test_user_id IS NULL THEN
        RAISE NOTICE '❌ Usuário operacional não encontrado. Crie um usuário com email teste@operacional.com e role operational primeiro.';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Usuário operacional encontrado: %', test_user_id;
    
    -- Buscar um funil existente para atribuir
    SELECT id INTO test_funnel_id 
    FROM funnels 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Buscar uma instância WhatsApp existente para atribuir
    SELECT id INTO test_whatsapp_id 
    FROM whatsapp_instances 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Atribuir funil ao usuário operacional (se não estiver já atribuído)
    IF test_funnel_id IS NOT NULL THEN
        INSERT INTO user_funnels (
            profile_id,
            funnel_id,
            created_by_user_id,
            created_at,
            updated_at
        )
        SELECT 
            test_user_id,
            test_funnel_id,
            test_user_id,
            now(),
            now()
        WHERE NOT EXISTS (
            SELECT 1 FROM user_funnels 
            WHERE profile_id = test_user_id AND funnel_id = test_funnel_id
        );
        
        RAISE NOTICE '✅ Funil atribuído ao usuário operacional: %', test_funnel_id;
    END IF;
    
    -- Atribuir instância WhatsApp ao usuário operacional (se não estiver já atribuída)
    IF test_whatsapp_id IS NOT NULL THEN
        INSERT INTO user_whatsapp_numbers (
            profile_id,
            whatsapp_number_id,
            created_by_user_id,
            created_at,
            updated_at
        )
        SELECT 
            test_user_id,
            test_whatsapp_id,
            test_user_id,
            now(),
            now()
        WHERE NOT EXISTS (
            SELECT 1 FROM user_whatsapp_numbers 
            WHERE profile_id = test_user_id AND whatsapp_number_id = test_whatsapp_id
        );
        
        RAISE NOTICE '✅ Instância WhatsApp atribuída ao usuário operacional: %', test_whatsapp_id;
    END IF;
    
    -- Criar alguns leads para o usuário operacional
    INSERT INTO leads (
        name,
        phone,
        funnel_id,
        owner_id,
        created_by_user_id,
        created_at,
        updated_at
    )
    SELECT 
        'Lead Teste ' || i,
        '+55 (11) 9999' || LPAD(i::text, 4, '0'),
        test_funnel_id,
        test_user_id,
        test_user_id,
        now(),
        now()
    FROM generate_series(1, 3) as i
    WHERE test_funnel_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM leads 
        WHERE owner_id = test_user_id AND name = 'Lead Teste ' || i
    );
    
    RAISE NOTICE '✅ Leads de teste criados para o usuário operacional';
    
END $$;