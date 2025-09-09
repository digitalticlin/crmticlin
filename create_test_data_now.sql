-- =====================================================
-- 🚀 CRIAÇÃO AUTOMÁTICA DE DADOS DE TESTE
-- Execute este script no Supabase para criar dados imediatamente
-- =====================================================

DO $$
DECLARE
    operational_user_id uuid;
    admin_user_id uuid;
    test_funnel_id uuid;
    test_whatsapp_id uuid;
    test_lead_id uuid;
BEGIN
    RAISE NOTICE '🚀 Iniciando criação de dados de teste...';
    
    -- 1. Buscar usuário operacional existente
    SELECT id INTO operational_user_id 
    FROM profiles 
    WHERE role = 'operational' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- 2. Buscar usuário admin para criar recursos
    SELECT id INTO admin_user_id 
    FROM profiles 
    WHERE role = 'admin' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- 3. Criar funil de teste se não existir
    INSERT INTO funnels (
        id,
        name,
        description,
        created_by_user_id,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'Funil Teste Operacional',
        'Funil criado para testes do sistema operacional',
        COALESCE(admin_user_id, operational_user_id),
        now(),
        now()
    ) ON CONFLICT DO NOTHING
    RETURNING id INTO test_funnel_id;
    
    -- Se não retornou ID, buscar funil existente
    IF test_funnel_id IS NULL THEN
        SELECT id INTO test_funnel_id 
        FROM funnels 
        WHERE name = 'Funil Teste Operacional'
        LIMIT 1;
    END IF;
    
    -- Se ainda não tem funil, pegar qualquer um
    IF test_funnel_id IS NULL THEN
        SELECT id INTO test_funnel_id 
        FROM funnels 
        ORDER BY created_at DESC 
        LIMIT 1;
    END IF;
    
    -- 4. Criar instância WhatsApp de teste se não existir
    INSERT INTO whatsapp_instances (
        id,
        instance_name,
        phone,
        status,
        created_by_user_id,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'Teste Operacional',
        '+55 (11) 99999-9999',
        'connected',
        COALESCE(admin_user_id, operational_user_id),
        now(),
        now()
    ) ON CONFLICT DO NOTHING
    RETURNING id INTO test_whatsapp_id;
    
    -- Se não retornou ID, buscar instância existente
    IF test_whatsapp_id IS NULL THEN
        SELECT id INTO test_whatsapp_id 
        FROM whatsapp_instances 
        WHERE instance_name = 'Teste Operacional'
        LIMIT 1;
    END IF;
    
    -- Se ainda não tem instância, pegar qualquer uma
    IF test_whatsapp_id IS NULL THEN
        SELECT id INTO test_whatsapp_id 
        FROM whatsapp_instances 
        ORDER BY created_at DESC 
        LIMIT 1;
    END IF;
    
    -- 5. Informar dados encontrados/criados
    RAISE NOTICE '📊 Dados identificados:';
    RAISE NOTICE '   👤 Usuario operacional: %', operational_user_id;
    RAISE NOTICE '   👑 Usuario admin: %', admin_user_id;
    RAISE NOTICE '   🎯 Funil: %', test_funnel_id;
    RAISE NOTICE '   📱 WhatsApp: %', test_whatsapp_id;
    
    -- 6. Verificar se usuário operacional existe
    IF operational_user_id IS NULL THEN
        RAISE NOTICE '❌ ERRO: Nenhum usuário operacional encontrado!';
        RAISE NOTICE '💡 Solução: Crie um usuário com role = operacional primeiro';
        RETURN;
    END IF;
    
    -- 7. Atribuir funil ao usuário operacional
    IF test_funnel_id IS NOT NULL THEN
        INSERT INTO user_funnels (
            profile_id,
            funnel_id,
            created_by_user_id,
            created_at,
            updated_at
        ) VALUES (
            operational_user_id,
            test_funnel_id,
            operational_user_id,
            now(),
            now()
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Funil atribuído ao usuário operacional!';
    END IF;
    
    -- 8. Atribuir instância WhatsApp ao usuário operacional
    IF test_whatsapp_id IS NOT NULL THEN
        INSERT INTO user_whatsapp_numbers (
            profile_id,
            whatsapp_number_id,
            created_by_user_id,
            created_at,
            updated_at
        ) VALUES (
            operational_user_id,
            test_whatsapp_id,
            operational_user_id,
            now(),
            now()
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ WhatsApp atribuído ao usuário operacional!';
    END IF;
    
    -- 9. Criar leads de teste para o usuário operacional
    IF test_funnel_id IS NOT NULL THEN
        -- Lead 1
        INSERT INTO leads (
            name,
            phone,
            funnel_id,
            owner_id,
            created_by_user_id,
            created_at,
            updated_at
        ) VALUES (
            'Lead Teste Operacional 1',
            '+55 (11) 98888-1111',
            test_funnel_id,
            operational_user_id,
            operational_user_id,
            now(),
            now()
        ) ON CONFLICT DO NOTHING;
        
        -- Lead 2
        INSERT INTO leads (
            name,
            phone,
            funnel_id,
            owner_id,
            created_by_user_id,
            created_at,
            updated_at
        ) VALUES (
            'Lead Teste Operacional 2',
            '+55 (11) 98888-2222',
            test_funnel_id,
            operational_user_id,
            operational_user_id,
            now(),
            now()
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Leads de teste criados para o usuário operacional!';
    END IF;
    
    RAISE NOTICE '🎉 Dados de teste criados com sucesso!';
    RAISE NOTICE '🔍 Agora teste em: http://localhost:8081/test-operational';
    
END $$;