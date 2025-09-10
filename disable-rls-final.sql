-- SOLUÇÃO FINAL: DESABILITAR RLS PARA TABELAS DE GESTÃO DE EQUIPE
-- Execute este SQL no Supabase SQL Editor

-- =========================================
-- 1. VERIFICAR STATUS ATUAL
-- =========================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('user_whatsapp_numbers', 'user_funnels');

-- =========================================
-- 2. REMOVER TODAS AS POLICIES
-- =========================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover policies da tabela user_whatsapp_numbers
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_whatsapp_numbers') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_whatsapp_numbers', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
    
    -- Remover policies da tabela user_funnels
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_funnels') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_funnels', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- =========================================
-- 3. DESABILITAR RLS COMPLETAMENTE
-- =========================================
ALTER TABLE user_whatsapp_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_funnels DISABLE ROW LEVEL SECURITY;

-- =========================================
-- 4. GARANTIR PERMISSÕES TOTAIS
-- =========================================
GRANT ALL PRIVILEGES ON user_whatsapp_numbers TO authenticated;
GRANT ALL PRIVILEGES ON user_funnels TO authenticated;

-- =========================================
-- 5. VERIFICAR SE FOI APLICADO
-- =========================================
SELECT 
    'user_whatsapp_numbers' as table_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS ENABLED ❌'
        ELSE 'RLS DISABLED ✅'
    END as status
FROM pg_tables 
WHERE tablename = 'user_whatsapp_numbers'

UNION ALL

SELECT 
    'user_funnels' as table_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS ENABLED ❌'
        ELSE 'RLS DISABLED ✅'
    END as status
FROM pg_tables 
WHERE tablename = 'user_funnels';

-- =========================================
-- 6. VERIFICAR POLICIES (DEVE ESTAR VAZIO)
-- =========================================
SELECT 
    'Policies remaining (should be empty):' as info,
    tablename, 
    policyname
FROM pg_policies 
WHERE tablename IN ('user_whatsapp_numbers', 'user_funnels');

-- =========================================
-- 7. TESTE DIRETO DE INSERT
-- =========================================
SELECT 'Tentando INSERT de teste...' as test_info;

-- Test WhatsApp insert
INSERT INTO user_whatsapp_numbers (profile_id, whatsapp_number_id) 
VALUES ('6a7826d5-aed7-42aa-a660-4e3dc7b44fc2', 'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785')
ON CONFLICT (profile_id, whatsapp_number_id) DO NOTHING;

-- Test Funnel insert  
INSERT INTO user_funnels (profile_id, funnel_id) 
VALUES ('6a7826d5-aed7-42aa-a660-4e3dc7b44fc2', 'c018b005-f15a-4374-a054-d28a1c9596d2')
ON CONFLICT (profile_id, funnel_id) DO NOTHING;

-- Verificar se foi inserido
SELECT 'WhatsApp assignments:' as info, profile_id, whatsapp_number_id 
FROM user_whatsapp_numbers 
WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2';

SELECT 'Funnel assignments:' as info, profile_id, funnel_id 
FROM user_funnels 
WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2';

SELECT '✅ RLS DESABILITADO COM SUCESSO - TESTE NO FRONTEND AGORA!' as final_status;