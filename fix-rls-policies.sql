-- SOLUÇÃO DEFINITIVA PARA RLS POLICIES
-- Execute este SQL no Supabase SQL Editor

-- =========================================
-- 1. VERIFICAR TABELAS E POLICIES ATUAIS
-- =========================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_whatsapp_numbers', 'user_funnels');

-- =========================================
-- 2. LIMPAR TODAS AS POLICIES EXISTENTES
-- =========================================

-- Remover TODAS as policies das duas tabelas
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover policies da tabela user_whatsapp_numbers
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_whatsapp_numbers') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_whatsapp_numbers', r.policyname);
    END LOOP;
    
    -- Remover policies da tabela user_funnels
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_funnels') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_funnels', r.policyname);
    END LOOP;
END $$;

-- =========================================
-- 3. DESABILITAR RLS TEMPORARIAMENTE
-- =========================================
ALTER TABLE user_whatsapp_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_funnels DISABLE ROW LEVEL SECURITY;

-- =========================================
-- 4. CRIAR POLICIES MAIS PERMISSIVAS
-- =========================================

-- Reabilitar RLS
ALTER TABLE user_whatsapp_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_funnels ENABLE ROW LEVEL SECURITY;

-- Policy SUPER PERMISSIVA para user_whatsapp_numbers
-- Permite tudo para usuários autenticados que são admins OU donos dos dados
CREATE POLICY "super_permissive_whatsapp_policy" ON user_whatsapp_numbers
FOR ALL 
TO authenticated
USING (
  -- Admin pode tudo
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
  )
  OR
  -- Ou é o próprio usuário
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = profile_id 
    AND p.linked_auth_user_id = auth.uid()
  )
)
WITH CHECK (
  -- Admin pode inserir/atualizar qualquer coisa
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
  )
  OR
  -- Ou é o próprio usuário
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = profile_id 
    AND p.linked_auth_user_id = auth.uid()
  )
);

-- Policy SUPER PERMISSIVA para user_funnels
-- Permite tudo para usuários autenticados que são admins OU donos dos dados
CREATE POLICY "super_permissive_funnel_policy" ON user_funnels
FOR ALL 
TO authenticated
USING (
  -- Admin pode tudo
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
  )
  OR
  -- Ou é o próprio usuário
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = profile_id 
    AND p.linked_auth_user_id = auth.uid()
  )
)
WITH CHECK (
  -- Admin pode inserir/atualizar qualquer coisa
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
  )
  OR
  -- Ou é o próprio usuário
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = profile_id 
    AND p.linked_auth_user_id = auth.uid()
  )
);

-- =========================================
-- 5. GARANTIR PERMISSÕES
-- =========================================
GRANT ALL ON user_whatsapp_numbers TO authenticated;
GRANT ALL ON user_funnels TO authenticated;

-- =========================================
-- 6. TESTAR AS POLICIES
-- =========================================

-- Verificar se as policies foram criadas corretamente
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'HAS USING CLAUSE' 
        ELSE 'NO USING CLAUSE' 
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'HAS WITH CHECK CLAUSE' 
        ELSE 'NO WITH CHECK CLAUSE' 
    END as with_check_clause
FROM pg_policies 
WHERE tablename IN ('user_whatsapp_numbers', 'user_funnels')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables 
WHERE tablename IN ('user_whatsapp_numbers', 'user_funnels');

-- =========================================
-- 7. TESTE DIRETO DE INSERT (PARA DEBUG)
-- =========================================

-- Uncomment estas linhas para testar diretamente:
-- SELECT auth.uid() as current_user_id;
-- SELECT id, role, linked_auth_user_id FROM profiles WHERE linked_auth_user_id = auth.uid();

-- SELECT 'TESTANDO INSERT WHATSAPP' as test_step;
-- INSERT INTO user_whatsapp_numbers (profile_id, whatsapp_number_id) 
-- VALUES (
--   '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2', 
--   'c3b6cfe7-bc4e-4b1f-9f18-4573f4232785'
-- );

-- SELECT 'TESTANDO INSERT FUNNEL' as test_step;
-- INSERT INTO user_funnels (profile_id, funnel_id) 
-- VALUES (
--   '6a7826d5-aed7-42aa-a660-4e3dc7b44fc2', 
--   'c018b005-f15a-4374-a054-d28a1c9596d2'
-- );