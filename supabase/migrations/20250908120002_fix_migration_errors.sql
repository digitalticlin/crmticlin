-- =====================================================
-- CORREÇÃO DOS ERROS DA MIGRAÇÃO ANTERIOR
-- =====================================================

-- ===============================
-- ERRO 1: Syntax error at end of input (linha vazia)
-- Criar função auxiliar que estava com syntax error
-- ===============================

-- Recriar função is_admin (garantindo que existe)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE linked_auth_user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================
-- ERRO 2: ON CONFLICT - profiles não tem constraint unique em linked_auth_user_id
-- Criar constraint e depois inserir perfis
-- ===============================

-- Adicionar constraint UNIQUE se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_linked_auth_user_id_key'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_linked_auth_user_id_key UNIQUE (linked_auth_user_id);
    END IF;
END $$;

-- Agora inserir perfis com ON CONFLICT funcionando
INSERT INTO profiles (linked_auth_user_id, email, role, full_name, created_at, updated_at)
VALUES 
  ('9936ae64-b78c-48fe-97e8-bf67623349c6', 'admin1@empresa.com.br', 'admin', 'Admin 1', NOW(), NOW()),
  ('152f2390-ede4-4f46-89bc-da3d7f5da747', 'admin2@empresa.com.br', 'admin', 'Admin 2', NOW(), NOW()),
  ('8cf224c2-2bed-4687-89a9-8639e76acd47', 'admin3@empresa.com.br', 'admin', 'Admin 3', NOW(), NOW()),
  ('d08b159d-39ad-479a-9f21-d63c13f9e7ee', 'admin4@empresa.com.br', 'admin', 'Admin 4', NOW(), NOW()),
  ('02bb7449-ed24-4e9a-8eb2-5a758e4cf871', 'admin5@empresa.com.br', 'admin', 'Admin 5', NOW(), NOW()),
  ('7c197601-01cc-4f71-a4d8-7c1357cac113', 'admin6@empresa.com.br', 'admin', 'Admin 6', NOW(), NOW()),
  ('d973d018-d053-4a39-b023-765332152dac', 'admin7@empresa.com.br', 'admin', 'Admin 7', NOW(), NOW())
ON CONFLICT (linked_auth_user_id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- ===============================
-- ERRO 3: Tabela sales_funnels não existe - usar funnels
-- ===============================

-- Verificar se tabela funnels existe e criar políticas para ela
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'funnels') THEN
        -- Remover políticas antigas se existirem
        DROP POLICY IF EXISTS "funnel_visibility" ON public.funnels;
        DROP POLICY IF EXISTS "funnel_insert" ON public.funnels;
        DROP POLICY IF EXISTS "funnel_update" ON public.funnels;
        DROP POLICY IF EXISTS "funnel_delete" ON public.funnels;

        -- Criar novas políticas para funnels
        CREATE POLICY "funnel_visibility" ON public.funnels
        FOR SELECT
        USING (
          -- Admin vê seus funis
          (public.is_admin() AND created_by_user_id = auth.uid())
          OR
          -- Operacional vê funis atribuídos a ele
          (public.is_operational() AND EXISTS (
            SELECT 1 FROM user_funnels uf
            JOIN profiles p ON uf.profile_id = p.id
            WHERE uf.funnel_id = funnels.id
            AND p.linked_auth_user_id = auth.uid()
          ))
        );

        CREATE POLICY "funnel_insert" ON public.funnels
        FOR INSERT
        WITH CHECK (
          public.is_admin() AND 
          created_by_user_id = auth.uid()
        );

        CREATE POLICY "funnel_update" ON public.funnels
        FOR UPDATE
        USING (
          public.is_admin() AND 
          created_by_user_id = auth.uid()
        );

        CREATE POLICY "funnel_delete" ON public.funnels
        FOR DELETE
        USING (
          public.is_admin() AND 
          created_by_user_id = auth.uid()
        );

        -- Habilitar RLS na tabela funnels
        ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Políticas RLS criadas para tabela funnels';
    ELSE
        RAISE NOTICE 'Tabela funnels não encontrada - pulando criação de políticas';
    END IF;
END $$;

-- ===============================
-- 4. VERIFICAR SE TODAS AS FUNÇÕES FORAM CRIADAS CORRETAMENTE
-- ===============================

-- Verificar funções auxiliares
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        RAISE EXCEPTION 'Função is_admin não foi criada!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_operational') THEN
        -- Criar função is_operational se não existir
        CREATE OR REPLACE FUNCTION public.is_operational()
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM profiles 
            WHERE linked_auth_user_id = auth.uid() 
            AND role = 'operational'
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    END IF;
    
    RAISE NOTICE 'Todas as funções auxiliares estão disponíveis';
END $$;

-- ===============================
-- 5. VERIFICAR E CORRIGIR owner_id NULOS
-- ===============================

-- Garantir que owner_id nunca seja NULL
UPDATE leads 
SET owner_id = created_by_user_id 
WHERE owner_id IS NULL 
AND created_by_user_id IS NOT NULL;

-- ===============================
-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ===============================

COMMENT ON FUNCTION public.is_admin() IS 
'Verifica se o usuário atual é admin baseado na tabela profiles';

COMMENT ON FUNCTION public.is_operational() IS 
'Verifica se o usuário atual é operacional baseado na tabela profiles';

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Migração de correção aplicada com sucesso!';
    RAISE NOTICE '- Funções auxiliares criadas/verificadas';
    RAISE NOTICE '- Constraint UNIQUE adicionada em profiles';
    RAISE NOTICE '- Perfis de admin criados';
    RAISE NOTICE '- Políticas RLS aplicadas na tabela correta';
    RAISE NOTICE '- owner_id nulos corrigidos';
END $$;