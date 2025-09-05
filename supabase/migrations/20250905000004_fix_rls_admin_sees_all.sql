-- Migration: Corrigir RLS - Admin vê TODOS os leads (sem restrição de created_by_user_id)
-- Data: 2025-09-05
-- Problema: Admin não estava vendo leads porque policies restringiam por created_by_user_id

-- ===============================
-- 1. REMOVER POLICIES RESTRITIVAS
-- ===============================

DROP POLICY IF EXISTS "Admin sees all organization leads" ON leads;
DROP POLICY IF EXISTS "Admin sees organization funnels" ON funnels;  
DROP POLICY IF EXISTS "Admin sees organization whatsapp" ON whatsapp_instances;

-- ===============================
-- 2. POLICY SIMPLES: ADMIN VÊ TUDO
-- ===============================

-- Policy 1: ADMIN vê TODOS os leads (sem filtro de organização)
CREATE POLICY "Admin sees all leads" ON leads
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
    OR
    -- OPERACIONAL vê apenas seus leads
    owner_id = auth.uid()
);

-- Policy 2: ADMIN vê TODOS os funis
CREATE POLICY "Admin sees all funnels" ON funnels
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
    OR
    -- OPERACIONAL vê apenas funis atribuídos
    EXISTS (
        SELECT 1 FROM user_funnels uf
        JOIN profiles p ON uf.profile_id = p.id
        WHERE uf.funnel_id = funnels.id
        AND p.linked_auth_user_id = auth.uid()
        AND p.role = 'operational'
    )
);

-- Policy 3: ADMIN vê TODAS as instâncias WhatsApp
CREATE POLICY "Admin sees all whatsapp instances" ON whatsapp_instances
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
    OR
    -- OPERACIONAL vê apenas instâncias atribuídas
    EXISTS (
        SELECT 1 FROM user_whatsapp_numbers uwn
        JOIN profiles p ON uwn.profile_id = p.id
        WHERE uwn.whatsapp_number_id = whatsapp_instances.id
        AND p.linked_auth_user_id = auth.uid()
        AND p.role = 'operational'
    )
);

-- Policy 4: ADMIN pode gerenciar funis
CREATE POLICY "Admin manages all funnels" ON funnels
FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
);

-- Policy 5: ADMIN pode gerenciar instâncias WhatsApp
CREATE POLICY "Admin manages all whatsapp instances" ON whatsapp_instances
FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
);

-- ===============================
-- 3. POLICY PARA DEALS (KPIs)
-- ===============================

-- Garantir que admin vê todos os deals
DROP POLICY IF EXISTS "Admin sees organization deals" ON deals;
CREATE POLICY "Admin sees all deals" ON deals
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
    OR
    -- OPERACIONAL vê deals de leads onde é owner
    EXISTS (
        SELECT 1 FROM leads l
        WHERE l.funnel_id = deals.funnel_id
        AND l.owner_id = auth.uid()
    )
);

-- ===============================
-- 4. POLICY PARA KANBAN_STAGES (KPIs)
-- ===============================

-- Garantir que admin vê todos os estágios
DROP POLICY IF EXISTS "Admin sees organization stages" ON kanban_stages;
CREATE POLICY "Admin sees all kanban stages" ON kanban_stages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
    OR
    -- OPERACIONAL vê estágios de funis atribuídos
    EXISTS (
        SELECT 1 FROM user_funnels uf
        JOIN profiles p ON uf.profile_id = p.id
        WHERE uf.funnel_id = kanban_stages.funnel_id
        AND p.linked_auth_user_id = auth.uid()
        AND p.role = 'operational'
    )
);

-- ===============================
-- 5. VERIFICAÇÃO
-- ===============================

-- Verificar policies ativas
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN cmd = 'r' THEN 'SELECT'
        WHEN cmd = 'a' THEN 'INSERT'  
        WHEN cmd = 'w' THEN 'UPDATE'
        WHEN cmd = 'd' THEN 'DELETE'
        WHEN cmd = '*' THEN 'ALL'
        ELSE cmd
    END as operation,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('leads', 'funnels', 'whatsapp_instances', 'deals', 'kanban_stages')
ORDER BY tablename, policyname;

-- ===============================
-- 6. COMENTÁRIOS
-- ===============================

COMMENT ON POLICY "Admin sees all leads" ON leads IS 
'Admins veem TODOS os leads, operacionais veem apenas owner_id próprios';

COMMENT ON POLICY "Admin sees all funnels" ON funnels IS 
'Admins veem TODOS os funis, operacionais veem apenas atribuídos';

COMMENT ON POLICY "Admin sees all whatsapp instances" ON whatsapp_instances IS 
'Admins veem TODAS as instâncias, operacionais veem apenas atribuídas';

-- ✅ RLS Policies corrigidas - Admin agora vê TODOS os dados!