-- =====================================================
-- ADICIONAR POLÍTICAS RLS FALTANTES
-- Baseado no retorno: apenas LEADS tem política, falta FUNNELS e WHATSAPP_INSTANCES
-- =====================================================

-- 1. HABILITAR RLS NAS TABELAS SE NÃO ESTIVER
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICA FUNNELS
-- Admin: vê funis que criou (created_by_user_id)
-- Operacional: vê funis vinculados via user_funnels
CREATE POLICY "funnels_access" ON public.funnels
FOR SELECT
USING (
  -- ADMIN: acesso total aos funis onde created_by_user_id = auth.uid()
  created_by_user_id = auth.uid()
  OR
  -- OPERACIONAL: vê apenas funis vinculados via user_funnels
  (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.linked_auth_user_id = auth.uid() 
      AND p.role = 'operational'
    ) 
    AND EXISTS (
      SELECT 1 
      FROM user_funnels uf
      JOIN profiles p ON uf.profile_id = p.id
      WHERE p.linked_auth_user_id = auth.uid()
      AND uf.funnel_id = funnels.id
    )
  )
);

-- 3. POLÍTICA WHATSAPP INSTANCES
-- Admin: vê instâncias que criou (created_by_user_id)
-- Operacional: vê instâncias vinculadas via user_whatsapp_numbers
CREATE POLICY "whatsapp_instances_access" ON public.whatsapp_instances
FOR SELECT
USING (
  -- ADMIN: acesso total às instâncias onde created_by_user_id = auth.uid()
  created_by_user_id = auth.uid()
  OR
  -- OPERACIONAL: vê apenas instâncias vinculadas via user_whatsapp_numbers
  (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.linked_auth_user_id = auth.uid() 
      AND p.role = 'operational'
    ) 
    AND EXISTS (
      SELECT 1 
      FROM user_whatsapp_numbers uwn
      JOIN profiles p ON uwn.profile_id = p.id
      WHERE p.linked_auth_user_id = auth.uid()
      AND uwn.whatsapp_number_id = whatsapp_instances.id
    )
  )
);

-- 4. VERIFICAR POLÍTICAS IMPLEMENTADAS
SELECT 
    'Políticas RLS criadas' as status,
    tablename,
    policyname
FROM pg_policies
WHERE tablename IN ('funnels', 'whatsapp_instances', 'leads')
ORDER BY tablename, policyname;

-- 5. VERIFICAR RLS HABILITADO
SELECT 
    'Status RLS' as status,
    tablename,
    rowsecurity as habilitado
FROM pg_tables
WHERE tablename IN ('funnels', 'whatsapp_instances', 'leads')
AND schemaname = 'public'
ORDER BY tablename;

-- 6. LOG DE RESULTADO
DO $$
BEGIN
    RAISE NOTICE '✅ POLÍTICAS RLS ADICIONADAS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '📋 FUNNELS: Admin (created_by) + Operacional (vinculados)';
    RAISE NOTICE '📱 WHATSAPP_INSTANCES: Admin (created_by) + Operacional (vinculados)';
    RAISE NOTICE '👥 LEADS: Já existia - Admin (created_by) + Operacional (instância vinculada)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 RESULTADO: Operacionais agora podem acessar funis e instâncias vinculadas';
    RAISE NOTICE '🤝 MÚLTIPLOS operacionais na mesma instância = todos veem todos os leads';
END $$;