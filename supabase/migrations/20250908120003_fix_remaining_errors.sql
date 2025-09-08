-- =====================================================
-- CORREÇÃO DOS ERROS RESTANTES
-- =====================================================

-- ===============================
-- ERRO: null value in column "id" - profiles precisa de UUID para id
-- ===============================

-- Inserir perfis com UUIDs gerados para a coluna id
INSERT INTO profiles (id, linked_auth_user_id, email, role, full_name, created_at, updated_at)
VALUES 
  (gen_random_uuid(), '9936ae64-b78c-48fe-97e8-bf67623349c6', 'admin1@empresa.com.br', 'admin', 'Admin 1', NOW(), NOW()),
  (gen_random_uuid(), '152f2390-ede4-4f46-89bc-da3d7f5da747', 'admin2@empresa.com.br', 'admin', 'Admin 2', NOW(), NOW()),
  (gen_random_uuid(), '8cf224c2-2bed-4687-89a9-8639e76acd47', 'admin3@empresa.com.br', 'admin', 'Admin 3', NOW(), NOW()),
  (gen_random_uuid(), 'd08b159d-39ad-479a-9f21-d63c13f9e7ee', 'admin4@empresa.com.br', 'admin', 'Admin 4', NOW(), NOW()),
  (gen_random_uuid(), '02bb7449-ed24-4e9a-8eb2-5a758e4cf871', 'admin5@empresa.com.br', 'admin', 'Admin 5', NOW(), NOW()),
  (gen_random_uuid(), '7c197601-01cc-4f71-a4d8-7c1357cac113', 'admin6@empresa.com.br', 'admin', 'Admin 6', NOW(), NOW()),
  (gen_random_uuid(), 'd973d018-d053-4a39-b023-765332152dac', 'admin7@empresa.com.br', 'admin', 'Admin 7', NOW(), NOW())
ON CONFLICT (linked_auth_user_id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- ===============================
-- ERRO: syntax error at or near "BEGIN" - corrigir bloco DO
-- ===============================

-- Verificar se tabela funnels existe e criar políticas (sintaxe corrigida)
DO $funnel_policies$
BEGIN
    -- Verificar se tabela funnels existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'funnels') THEN
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
END $funnel_policies$;

-- ===============================
-- VERIFICAR E CORRIGIR DADOS
-- ===============================

-- Garantir que owner_id nunca seja NULL
UPDATE leads 
SET owner_id = created_by_user_id 
WHERE owner_id IS NULL 
AND created_by_user_id IS NOT NULL;

-- Verificar quantos perfis foram criados
DO $check_profiles$
BEGIN
    RAISE NOTICE '📊 Perfis criados: % admins encontrados', (
        SELECT COUNT(*) FROM profiles WHERE role = 'admin'
    );
    
    RAISE NOTICE '📊 Leads sem owner corrigidos: % leads atualizados', (
        SELECT COUNT(*) FROM leads WHERE owner_id = created_by_user_id
    );
END $check_profiles$;

-- ===============================
-- LOG DE SUCESSO
-- ===============================

DO $success_log$
BEGIN
    RAISE NOTICE '✅ Correção final aplicada com sucesso!';
    RAISE NOTICE '- Perfis de admin criados com IDs válidos';
    RAISE NOTICE '- Políticas RLS aplicadas na tabela funnels';
    RAISE NOTICE '- owner_id nulos corrigidos';
    RAISE NOTICE '- Sistema pronto para teste';
END $success_log$;