-- SOLUÇÃO SIMPLES E DIRETA
-- Execute linha por linha se necessário

-- 1. DESABILITAR RLS
ALTER TABLE user_whatsapp_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_funnels DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR STATUS
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('user_whatsapp_numbers', 'user_funnels');

-- 3. TESTE SIMPLES (execute apenas se status mostrar rowsecurity = false)
-- DELETE FROM user_whatsapp_numbers WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2';
-- DELETE FROM user_funnels WHERE profile_id = '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2';