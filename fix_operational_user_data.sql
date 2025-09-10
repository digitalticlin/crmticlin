-- =====================================================
-- 🚨 CORREÇÃO URGENTE: DADOS PARA USUÁRIO OPERACIONAL
-- =====================================================

-- 1. PRIMEIRO: Verificar qual usuário operacional você está usando
SELECT 
    'USUARIOS OPERACIONAIS EXISTENTES' as info,
    id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
WHERE role = 'operational'
ORDER BY created_at DESC;

-- 2. Verificar se existem funis disponíveis
SELECT 
    'FUNIS EXISTENTES' as info,
    id,
    name,
    created_by_user_id,
    created_at
FROM funnels 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar se existem instâncias WhatsApp
SELECT 
    'INSTANCIAS WHATSAPP EXISTENTES' as info,
    id,
    instance_name,
    phone,
    created_by_user_id,
    created_at
FROM whatsapp_instances 
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar mapeamentos atuais
SELECT 
    'MAPEAMENTOS USER_FUNNELS ATUAIS' as info,
    uf.*,
    p.full_name as user_name,
    f.name as funnel_name
FROM user_funnels uf
LEFT JOIN profiles p ON uf.profile_id = p.id
LEFT JOIN funnels f ON uf.funnel_id = f.id;

SELECT 
    'MAPEAMENTOS USER_WHATSAPP ATUAIS' as info,
    uwn.*,
    p.full_name as user_name,
    wi.instance_name
FROM user_whatsapp_numbers uwn
LEFT JOIN profiles p ON uwn.profile_id = p.id
LEFT JOIN whatsapp_instances wi ON uwn.whatsapp_number_id = wi.id;

-- =====================================================
-- 🔧 CRIAÇÃO DE DADOS DE TESTE
-- SUBSTITUA OS IDs ABAIXO PELOS IDs REAIS DO SEU SISTEMA
-- =====================================================

-- EXEMPLO: Atribuir primeiro funil disponível ao primeiro usuário operacional
/*
INSERT INTO user_funnels (
    profile_id,
    funnel_id,
    created_by_user_id,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM profiles WHERE role = 'operational' LIMIT 1),
    (SELECT id FROM funnels ORDER BY created_at DESC LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'operational' LIMIT 1),
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM user_funnels 
    WHERE profile_id = (SELECT id FROM profiles WHERE role = 'operational' LIMIT 1)
    AND funnel_id = (SELECT id FROM funnels ORDER BY created_at DESC LIMIT 1)
);
*/

-- EXEMPLO: Atribuir primeira instância WhatsApp ao primeiro usuário operacional
/*
INSERT INTO user_whatsapp_numbers (
    profile_id,
    whatsapp_number_id,
    created_by_user_id,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM profiles WHERE role = 'operational' LIMIT 1),
    (SELECT id FROM whatsapp_instances ORDER BY created_at DESC LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'operational' LIMIT 1),
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM user_whatsapp_numbers 
    WHERE profile_id = (SELECT id FROM profiles WHERE role = 'operational' LIMIT 1)
    AND whatsapp_number_id = (SELECT id FROM whatsapp_instances ORDER BY created_at DESC LIMIT 1)
);
*/

-- =====================================================
-- 🎯 INSERÇÃO AUTOMÁTICA MAIS SEGURA
-- Descomente o bloco abaixo para inserir automaticamente
-- =====================================================

/*
DO $$
DECLARE
    operational_user_id uuid;
    test_funnel_id uuid;
    test_whatsapp_id uuid;
BEGIN
    -- Pegar primeiro usuário operacional
    SELECT id INTO operational_user_id 
    FROM profiles 
    WHERE role = 'operational' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Pegar primeiro funil
    SELECT id INTO test_funnel_id 
    FROM funnels 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Pegar primeira instância WhatsApp
    SELECT id INTO test_whatsapp_id 
    FROM whatsapp_instances 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Informar dados encontrados
    RAISE NOTICE 'Usuario operacional: %', operational_user_id;
    RAISE NOTICE 'Funil de teste: %', test_funnel_id;
    RAISE NOTICE 'WhatsApp de teste: %', test_whatsapp_id;
    
    -- Inserir mapeamentos se todos os dados existirem
    IF operational_user_id IS NOT NULL AND test_funnel_id IS NOT NULL THEN
        INSERT INTO user_funnels (
            profile_id, funnel_id, created_by_user_id, created_at, updated_at
        ) VALUES (
            operational_user_id, test_funnel_id, operational_user_id, now(), now()
        ) ON CONFLICT DO NOTHING;
        RAISE NOTICE 'Funil atribuído com sucesso!';
    END IF;
    
    IF operational_user_id IS NOT NULL AND test_whatsapp_id IS NOT NULL THEN
        INSERT INTO user_whatsapp_numbers (
            profile_id, whatsapp_number_id, created_by_user_id, created_at, updated_at
        ) VALUES (
            operational_user_id, test_whatsapp_id, operational_user_id, now(), now()
        ) ON CONFLICT DO NOTHING;
        RAISE NOTICE 'WhatsApp atribuído com sucesso!';
    END IF;
    
END $$;
*/