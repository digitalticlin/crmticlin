-- =====================================================
-- 🔧 CORRIGIR ACESSO DE OPERACIONAIS ÀS STAGES
-- Problema: Policies antigas só permitem ver stages onde created_by_user_id = auth.uid()
-- Solução: Permitir operacionais verem stages dos funis atribuídos
-- =====================================================

-- 1. Desabilitar RLS temporariamente para fazer as mudanças
ALTER TABLE kanban_stages DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as policies antigas que estão causando conflito
DROP POLICY IF EXISTS "Users can view stages in their organization" ON kanban_stages;
DROP POLICY IF EXISTS "Users can manage stages in their organization" ON kanban_stages;
DROP POLICY IF EXISTS "Users can view stages of their funnels" ON kanban_stages;
DROP POLICY IF EXISTS "Users can create stages for their funnels" ON kanban_stages;
DROP POLICY IF EXISTS "Users can update stages of their funnels" ON kanban_stages;
DROP POLICY IF EXISTS "Users can delete stages of their funnels" ON kanban_stages;

-- 3. Criar nova policy para SELECT que funciona para admin e operacional
CREATE POLICY "View stages based on role" ON kanban_stages
FOR SELECT USING (
    -- Admin vê stages dos funis que criou
    (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
        AND
        EXISTS (
            SELECT 1 FROM funnels f
            WHERE f.id = kanban_stages.funnel_id
            AND f.created_by_user_id = auth.uid()
        )
    )
    OR
    -- Operacional vê stages dos funis atribuídos a ele
    EXISTS (
        SELECT 1 FROM user_funnels uf
        JOIN profiles p ON uf.profile_id = p.id
        WHERE uf.funnel_id = kanban_stages.funnel_id
        AND p.id = auth.uid()
        AND p.role = 'operational'
    )
);

-- 4. Policies para INSERT, UPDATE, DELETE - apenas admin
CREATE POLICY "Admin manages stages" ON kanban_stages
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);

CREATE POLICY "Admin updates stages" ON kanban_stages
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
    AND
    EXISTS (
        SELECT 1 FROM funnels f
        WHERE f.id = kanban_stages.funnel_id
        AND f.created_by_user_id = auth.uid()
    )
);

CREATE POLICY "Admin deletes stages" ON kanban_stages
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
    AND
    EXISTS (
        SELECT 1 FROM funnels f
        WHERE f.id = kanban_stages.funnel_id
        AND f.created_by_user_id = auth.uid()
    )
);

-- 5. Service role bypass para edge functions
CREATE POLICY "Service role bypass stages" ON kanban_stages
FOR ALL TO service_role USING (true);

-- 6. Reabilitar RLS
ALTER TABLE kanban_stages ENABLE ROW LEVEL SECURITY;

-- 7. Verificar se funcionou
SELECT 
    'TESTE FINAL' as status,
    COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'kanban_stages';