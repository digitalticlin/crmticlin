-- ============================================
-- CORREÇÃO RLS - TABELA kanban_stages  
-- ============================================
-- Permitir que operacionais vejam etapas de funis atribuídos via user_funnels

-- PASSO 1: Remover política problemática
DROP POLICY IF EXISTS "authenticated_users_kanban_stages_access" ON kanban_stages;

-- PASSO 2: Criar nova política multitenant
CREATE POLICY "kanban_stages_multitenant_access" ON kanban_stages
    FOR ALL
    USING (
        -- Admin: vê etapas dos funis que criou
        (EXISTS (
            SELECT 1 FROM funnels f 
            WHERE f.id = kanban_stages.funnel_id 
            AND f.created_by_user_id = auth.uid()
        ))
        OR
        -- Operacional: vê etapas dos funis atribuídos a ele
        (EXISTS (
            SELECT 1 FROM user_funnels uf
            JOIN funnels f ON f.id = uf.funnel_id
            WHERE uf.funnel_id = kanban_stages.funnel_id 
            AND uf.profile_id = auth.uid()
            -- E verifica que o funil pertence ao admin do operacional
            AND f.created_by_user_id = (
                SELECT p.created_by_user_id 
                FROM profiles p 
                WHERE p.id = auth.uid()
            )
        ))
    );

-- PASSO 3: Verificar se políticas foram aplicadas corretamente
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'kanban_stages'
ORDER BY policyname;

-- PASSO 4: Testar acesso direto às etapas (deve funcionar agora)
SELECT 
    ks.id,
    ks.title,
    ks.funnel_id,
    ks.order_position,
    'Via Nova Política RLS' as access_reason
FROM kanban_stages ks
WHERE ks.funnel_id = '28dfc9bb-3c5c-482c-aca6-805a5c2bf280'
ORDER BY ks.order_position;

-- PASSO 5: Contar total de etapas acessíveis ao usuário atual
SELECT 
    COUNT(*) as total_etapas_acessiveis,
    'Após correção RLS' as status
FROM kanban_stages ks
WHERE ks.funnel_id IN (
    SELECT uf.funnel_id 
    FROM user_funnels uf 
    WHERE uf.profile_id = auth.uid()
);

-- PASSO 6: Verificar dados do funil para debug
SELECT 
    f.id,
    f.name,
    f.created_by_user_id,
    'Dados do funil' as info
FROM funnels f
WHERE f.id = '28dfc9bb-3c5c-482c-aca6-805a5c2bf280';

-- PASSO 7: Verificar permissão do usuário operacional
SELECT 
    uf.profile_id,
    uf.funnel_id,
    p.email,
    p.created_by_user_id,
    'Permissão operacional' as info
FROM user_funnels uf
JOIN profiles p ON p.id = uf.profile_id
WHERE uf.profile_id = 'd0bdb8e2-556f-48da-af90-63f14c119340';

-- MENSAGEM FINAL
SELECT 'RLS CORRIGIDA! Operacionais agora podem ver etapas de funis atribuídos.' as resultado;