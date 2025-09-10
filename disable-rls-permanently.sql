-- DESABILITAR RLS PERMANENTEMENTE PARA GESTÃO DE EQUIPE
-- Execute no Supabase SQL Editor

-- =========================================
-- 1. REMOVER TODAS AS POLICIES
-- =========================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover TODAS as policies de user_whatsapp_numbers
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_whatsapp_numbers') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_whatsapp_numbers', r.policyname);
        RAISE NOTICE 'Dropped policy: % from user_whatsapp_numbers', r.policyname;
    END LOOP;
    
    -- Remover TODAS as policies de user_funnels
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_funnels') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_funnels', r.policyname);
        RAISE NOTICE 'Dropped policy: % from user_funnels', r.policyname;
    END LOOP;
END $$;

-- =========================================
-- 2. DESABILITAR RLS COMPLETAMENTE
-- =========================================
ALTER TABLE user_whatsapp_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_funnels DISABLE ROW LEVEL SECURITY;

-- =========================================
-- 3. GARANTIR PERMISSÕES TOTAIS
-- =========================================
GRANT ALL PRIVILEGES ON user_whatsapp_numbers TO authenticated;
GRANT ALL PRIVILEGES ON user_funnels TO authenticated;
GRANT ALL PRIVILEGES ON user_whatsapp_numbers TO public;
GRANT ALL PRIVILEGES ON user_funnels TO public;

-- =========================================
-- 4. VERIFICAR STATUS FINAL
-- =========================================
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '❌ RLS AINDA ATIVO'
        ELSE '✅ RLS DESABILITADO'
    END as status
FROM pg_tables 
WHERE tablename IN ('user_whatsapp_numbers', 'user_funnels')
ORDER BY tablename;

-- Verificar se ainda existem policies
SELECT 
    'Policies restantes (deve estar vazio):' as info,
    tablename, 
    policyname
FROM pg_policies 
WHERE tablename IN ('user_whatsapp_numbers', 'user_funnels')
ORDER BY tablename, policyname;

-- =========================================
-- 5. TESTE FINAL DIRETO
-- =========================================
-- Limpar dados de teste
DELETE FROM user_whatsapp_numbers WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2';
DELETE FROM user_funnels WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2';

-- Inserir dados de teste
INSERT INTO user_whatsapp_numbers (profile_id, whatsapp_number_id, created_by_user_id) 
VALUES ('6a7826d5-aed7-42aa-a660-4e3dc7b44fc2', 'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785', '712e7708-2299-4a00-9128-577c8f113ca4')
ON CONFLICT (profile_id, whatsapp_number_id) DO NOTHING;

INSERT INTO user_funnels (profile_id, funnel_id, created_by_user_id) 
VALUES ('6a7826d5-aed7-42aa-a660-4e3dc7b44fc2', 'c018b005-f15a-4374-a054-d28a1c9596d2', '712e7708-2299-4a00-9128-577c8f113ca4')
ON CONFLICT (profile_id, funnel_id) DO NOTHING;

-- Verificar se foi inserido
SELECT 'Teste WhatsApp:' as tipo, profile_id, whatsapp_number_id, created_by_user_id 
FROM user_whatsapp_numbers 
WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2';

SELECT 'Teste Funnel:' as tipo, profile_id, funnel_id, created_by_user_id 
FROM user_funnels 
WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2';

SELECT '🎉 RLS DESABILITADO PERMANENTEMENTE - TESTE NO FRONTEND AGORA!' as resultado_final;