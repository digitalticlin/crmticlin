-- Migration: RLS Policies simplificadas - Admin/Operacional
-- Remove policies problemáticas e implementa lógica simples

-- ===============================
-- 1. LIMPEZA DE POLICIES PROBLEMÁTICAS
-- ===============================

-- Remover policies muito permissivas ou conflitantes nos leads
DROP POLICY IF EXISTS "Service role bypass - leads select" ON leads;
DROP POLICY IF EXISTS "Service role bypass - leads insert" ON leads;  
DROP POLICY IF EXISTS "Service role bypass - leads update" ON leads;
DROP POLICY IF EXISTS "authenticated_users_leads_access" ON leads;

-- ===============================
-- 2. POLICIES PARA LEADS (CORE DO SISTEMA)
-- ===============================

-- Policy 1: ADMIN vê todos os leads da sua organização
CREATE POLICY "Admin sees all organization leads" ON leads
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
        AND p.created_by_user_id = leads.created_by_user_id
    )
    OR
    -- Também permitir se o admin criou o lead diretamente
    created_by_user_id = auth.uid()
);

-- Policy 2: OPERACIONAL vê apenas leads onde é owner_id
CREATE POLICY "Operational sees only assigned leads" ON leads
FOR ALL USING (
    owner_id = auth.uid()
);

-- Policy 3: SERVICE_ROLE tem acesso total (para edge functions)
CREATE POLICY "Service role full access leads" ON leads
FOR ALL TO service_role USING (true);

-- Policy 4: WEBHOOK/ANON pode inserir leads (para webhooks externos)
CREATE POLICY "Webhook lead creation" ON leads
FOR INSERT TO anon WITH CHECK (
    created_by_user_id IS NOT NULL
);

-- ===============================
-- 3. POLICIES PARA USER_FUNNELS (atribuições)
-- ===============================

-- Remover policies antigas
DROP POLICY IF EXISTS "Allow admins to manage funnel assignments" ON user_funnels;
DROP POLICY IF EXISTS "Allow users to view their own funnel assignments" ON user_funnels;

-- Policy: ADMIN gerencia atribuições de funil
CREATE POLICY "Admin manages funnel assignments" ON user_funnels
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
);

-- Policy: OPERACIONAL vê suas próprias atribuições
CREATE POLICY "User sees own funnel assignments" ON user_funnels
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.id = user_funnels.profile_id
    )
);

-- ===============================
-- 4. POLICIES PARA USER_WHATSAPP_NUMBERS (atribuições)
-- ===============================

-- Remover policies antigas
DROP POLICY IF EXISTS "Allow admins to manage WhatsApp assignments" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Allow users to view their own WhatsApp assignments" ON user_whatsapp_numbers;

-- Policy: ADMIN gerencia atribuições de WhatsApp
CREATE POLICY "Admin manages whatsapp assignments" ON user_whatsapp_numbers
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
);

-- Policy: OPERACIONAL vê suas próprias atribuições
CREATE POLICY "User sees own whatsapp assignments" ON user_whatsapp_numbers
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.id = user_whatsapp_numbers.profile_id
    )
);

-- ===============================
-- 5. POLICIES PARA FUNNELS 
-- ===============================

-- Policy: ADMIN vê todos os funis da organização
CREATE POLICY "Admin sees organization funnels" ON funnels
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
        AND p.created_by_user_id = funnels.created_by_user_id
    )
    OR
    created_by_user_id = auth.uid()
);

-- Policy: OPERACIONAL vê apenas funis atribuídos
CREATE POLICY "Operational sees assigned funnels" ON funnels
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_funnels uf
        JOIN profiles p ON uf.profile_id = p.id
        WHERE uf.funnel_id = funnels.id
        AND p.linked_auth_user_id = auth.uid()
        AND p.role = 'operational'
    )
);

-- Policy: ADMIN pode inserir funis
CREATE POLICY "Admin inserts funnels" ON funnels
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
);

-- Policy: ADMIN pode atualizar funis
CREATE POLICY "Admin updates funnels" ON funnels
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
);

-- Policy: ADMIN pode deletar funis
CREATE POLICY "Admin deletes funnels" ON funnels
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
);

-- ===============================
-- 6. POLICIES PARA WHATSAPP_INSTANCES
-- ===============================

-- Policy: ADMIN vê todas as instâncias da organização
CREATE POLICY "Admin sees organization whatsapp" ON whatsapp_instances
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
        AND p.created_by_user_id = whatsapp_instances.created_by_user_id
    )
    OR
    created_by_user_id = auth.uid()
);

-- Policy: OPERACIONAL vê apenas instâncias atribuídas
CREATE POLICY "Operational sees assigned whatsapp" ON whatsapp_instances
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_whatsapp_numbers uwn
        JOIN profiles p ON uwn.profile_id = p.id
        WHERE uwn.whatsapp_number_id = whatsapp_instances.id
        AND p.linked_auth_user_id = auth.uid()
        AND p.role = 'operational'
    )
);

-- Policy: ADMIN pode inserir instâncias
CREATE POLICY "Admin inserts whatsapp instances" ON whatsapp_instances
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
);

-- Policy: ADMIN pode atualizar instâncias
CREATE POLICY "Admin updates whatsapp instances" ON whatsapp_instances
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
);

-- Policy: ADMIN pode deletar instâncias
CREATE POLICY "Admin deletes whatsapp instances" ON whatsapp_instances
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
);

-- ===============================
-- 7. POLICIES PARA MESSAGES (conversas WhatsApp)
-- ===============================

-- Policy: Baseada nos leads/contatos que o usuário tem acesso
CREATE POLICY "Messages access based on lead ownership" ON messages
FOR ALL USING (
    -- ADMIN: vê mensagens de leads da sua organização
    EXISTS (
        SELECT 1 FROM leads l
        JOIN profiles p ON p.linked_auth_user_id = auth.uid()
        WHERE l.id = messages.lead_id
        AND p.role = 'admin'
        AND l.created_by_user_id = p.created_by_user_id
    )
    OR
    -- OPERACIONAL: vê mensagens de leads onde é owner
    EXISTS (
        SELECT 1 FROM leads l
        WHERE l.id = messages.lead_id
        AND l.owner_id = auth.uid()
    )
    OR
    -- SERVICE_ROLE: acesso total
    current_setting('role') = 'service_role'
);

-- ===============================
-- 8. VERIFICAR STATUS DAS POLICIES
-- ===============================

-- Verificar se RLS está habilitado nas tabelas principais
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled' 
        ELSE '❌ RLS Disabled' 
    END as status
FROM pg_tables 
WHERE tablename IN ('leads', 'profiles', 'user_funnels', 'user_whatsapp_numbers', 'funnels', 'whatsapp_instances', 'messages')
AND schemaname = 'public'
ORDER BY tablename;

-- ===============================
-- 9. COMENTÁRIOS E DOCUMENTAÇÃO
-- ===============================

COMMENT ON POLICY "Admin sees all organization leads" ON leads IS 
'Admins veem todos os leads da sua organização (created_by_user_id)';

COMMENT ON POLICY "Operational sees only assigned leads" ON leads IS 
'Operacionais veem apenas leads onde são owner_id';

COMMENT ON POLICY "Admin manages funnel assignments" ON user_funnels IS 
'Apenas admins podem criar/editar/deletar atribuições de funil';

COMMENT ON POLICY "Admin manages whatsapp assignments" ON user_whatsapp_numbers IS 
'Apenas admins podem criar/editar/deletar atribuições de WhatsApp';

-- ===============================
-- 10. GRANTS NECESSÁRIOS
-- ===============================

-- Garantir que authenticated tem acesso às tabelas
GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON user_funnels TO authenticated;
GRANT SELECT ON user_whatsapp_numbers TO authenticated;
GRANT SELECT ON funnels TO authenticated;
GRANT SELECT ON whatsapp_instances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;

-- Service role precisa de acesso total
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ✅ RLS Policies Admin/Operacional configuradas com sucesso!