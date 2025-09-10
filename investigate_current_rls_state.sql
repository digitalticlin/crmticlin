-- =====================================================
-- INVESTIGAÇÃO ESPECÍFICA DO ESTADO ATUAL DAS RLS
-- Verificar se funis e instâncias estão configurados conforme solicitado
-- =====================================================

-- 1. VERIFICAR POLÍTICAS RLS EXISTENTES EM TODAS AS TABELAS RELEVANTES
SELECT 
    'POLÍTICAS RLS ATUAIS' as secao,
    tablename,
    policyname,
    cmd as operacao,
    LEFT(qual, 100) as condicao_resumida
FROM pg_policies
WHERE tablename IN ('funnels', 'whatsapp_instances', 'leads', 'user_funnels', 'user_whatsapp_numbers')
ORDER BY tablename, policyname;

-- 2. VERIFICAR SE RLS ESTÁ HABILITADO NAS TABELAS
SELECT 
    'STATUS RLS DAS TABELAS' as secao,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename IN ('funnels', 'whatsapp_instances', 'leads', 'user_funnels', 'user_whatsapp_numbers')
AND schemaname = 'public'
ORDER BY tablename;

-- 3. ESTRUTURA DETALHADA: user_funnels (vinculação funil -> operacional)
SELECT 
    'ESTRUTURA user_funnels' as secao,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_funnels'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. ESTRUTURA DETALHADA: user_whatsapp_numbers (vinculação instância -> operacional)  
SELECT 
    'ESTRUTURA user_whatsapp_numbers' as secao,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_whatsapp_numbers'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. DADOS ATUAIS: Verificar vinculações de funis existentes
SELECT 
    'VINCULAÇÕES FUNIS EXISTENTES' as secao,
    uf.id,
    uf.funnel_id,
    f.name as funnel_name,
    uf.profile_id,
    p.email as operacional_email,
    p.role,
    f.created_by_user_id as admin_dono_funil
FROM user_funnels uf
JOIN funnels f ON f.id = uf.funnel_id
JOIN profiles p ON p.id = uf.profile_id
ORDER BY f.name, p.email
LIMIT 10;

-- 6. DADOS ATUAIS: Verificar vinculações de WhatsApp existentes
SELECT 
    'VINCULAÇÕES WHATSAPP EXISTENTES' as secao,
    uwn.id,
    uwn.whatsapp_number_id,
    wi.name as instancia_name,
    uwn.profile_id,
    p.email as operacional_email,
    p.role,
    wi.created_by_user_id as admin_dono_instancia
FROM user_whatsapp_numbers uwn
JOIN whatsapp_instances wi ON wi.id = uwn.whatsapp_number_id
JOIN profiles p ON p.id = uwn.profile_id
ORDER BY wi.name, p.email
LIMIT 10;

-- 7. TESTE: Um operacional específico - que funis ele DEVERIA ver?
WITH operacional_teste AS (
    SELECT 
        p.linked_auth_user_id as op_id,
        p.email as op_email,
        p.id as profile_id
    FROM profiles p 
    WHERE p.role = 'operational' 
    AND p.linked_auth_user_id IS NOT NULL
    LIMIT 1
)
SELECT 
    'TESTE OPERACIONAL - Funis vinculados' as secao,
    ot.op_email as operacional,
    f.name as funnel_name,
    f.id as funnel_id,
    f.created_by_user_id as admin_dono
FROM operacional_teste ot
JOIN user_funnels uf ON uf.profile_id = ot.profile_id
JOIN funnels f ON f.id = uf.funnel_id;

-- 8. TESTE: Um operacional específico - que instâncias WhatsApp ele DEVERIA ver?
WITH operacional_teste AS (
    SELECT 
        p.linked_auth_user_id as op_id,
        p.email as op_email,
        p.id as profile_id
    FROM profiles p 
    WHERE p.role = 'operational' 
    AND p.linked_auth_user_id IS NOT NULL
    LIMIT 1
)
SELECT 
    'TESTE OPERACIONAL - Instâncias vinculadas' as secao,
    ot.op_email as operacional,
    wi.name as instancia_name,
    wi.id as instancia_id,
    wi.created_by_user_id as admin_dono
FROM operacional_teste ot
JOIN user_whatsapp_numbers uwn ON uwn.profile_id = ot.profile_id
JOIN whatsapp_instances wi ON wi.id = uwn.whatsapp_number_id;

-- 9. PROBLEMA IDENTIFICADO: Verificar se as políticas para funnels e whatsapp_instances existem
SELECT 
    'DIAGNÓSTICO - Políticas em falta' as secao,
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'funnels') 
        THEN 'FUNNELS tem políticas RLS'
        ELSE '❌ FUNNELS SEM POLÍTICAS RLS'
    END as status_funnels,
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_instances') 
        THEN 'WHATSAPP_INSTANCES tem políticas RLS'
        ELSE '❌ WHATSAPP_INSTANCES SEM POLÍTICAS RLS'
    END as status_whatsapp;

-- 10. RESUMO PARA DECISÃO
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '📋 INVESTIGAÇÃO CONCLUÍDA';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '🎯 Verificar se existem políticas RLS para:';
    RAISE NOTICE '   - FUNNELS (admin cria, operacional vê vinculados)';
    RAISE NOTICE '   - WHATSAPP_INSTANCES (admin cria, operacional vê vinculados)';
    RAISE NOTICE '📱 Se não existirem, precisam ser criadas';
    RAISE NOTICE '🔍 Se existirem, verificar se estão corretas';
END $$;