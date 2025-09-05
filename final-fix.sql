-- FINAL FIX - LIMPAR TUDO E DESABILITAR RLS
-- Execute no Supabase SQL Editor

-- 1. DROP TODAS AS POLICIES EXISTENTES
DROP POLICY IF EXISTS "Admin manages all funnel assignments" ON user_funnels;
DROP POLICY IF EXISTS "Admin manages funnel assignments" ON user_funnels;
DROP POLICY IF EXISTS "User sees own funnel assignments" ON user_funnels;
DROP POLICY IF EXISTS "Users can manage funnel assignments in their organization" ON user_funnels;
DROP POLICY IF EXISTS "Users can view funnel assignments in their organization" ON user_funnels;
DROP POLICY IF EXISTS "Users see own funnel assignments" ON user_funnels;
DROP POLICY IF EXISTS "service_role_user_funnels_access" ON user_funnels;
DROP POLICY IF EXISTS "super_permissive_funnel_policy" ON user_funnels;

DROP POLICY IF EXISTS "Admin manages all WhatsApp assignments" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Admin manages whatsapp assignments" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "User sees own whatsapp assignments" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Users can manage assignments in their organization" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Users can view assignments in their organization" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Users see own WhatsApp assignments" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "service_role_user_whatsapp_numbers_access" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "super_permissive_whatsapp_policy" ON user_whatsapp_numbers;

-- 2. DESABILITAR RLS COMPLETAMENTE
ALTER TABLE user_whatsapp_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_funnels DISABLE ROW LEVEL SECURITY;

-- 3. GARANTIR PERMISSÕES
GRANT ALL ON user_whatsapp_numbers TO authenticated;
GRANT ALL ON user_funnels TO authenticated;
GRANT ALL ON user_whatsapp_numbers TO public;
GRANT ALL ON user_funnels TO public;

-- 4. VERIFICAR RESULTADO
SELECT 'RLS Status:' as info, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_whatsapp_numbers', 'user_funnels');

SELECT 'Remaining Policies (should be empty):' as info, tablename, policyname
FROM pg_policies 
WHERE tablename IN ('user_whatsapp_numbers', 'user_funnels');

-- 5. TESTE FINAL
DELETE FROM user_whatsapp_numbers WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2';
DELETE FROM user_funnels WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2';

INSERT INTO user_whatsapp_numbers (profile_id, whatsapp_number_id) 
VALUES ('6a7826d5-aed7-42aa-a660-4e3dc7b44fc2', 'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785');

INSERT INTO user_funnels (profile_id, funnel_id) 
VALUES ('6a7826d5-aed7-42aa-a660-4e3dc7b44fc2', 'c018b005-f15a-4374-a054-d28a1c9596d2');

SELECT '✅ SUCESSO! RLS DESABILITADO - TESTE NO FRONTEND!' as status;