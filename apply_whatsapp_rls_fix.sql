-- APLICAR FIX RLS PARA USER_WHATSAPP_NUMBERS
-- Este fix é modular e não afeta outras funcionalidades

-- 1. Verificar políticas atuais
SELECT 
    '=== POLÍTICAS ATUAIS USER_WHATSAPP_NUMBERS ===' as info,
    schemaname,
    tablename,
    policyname,
    cmd as comando,
    qual as condicao_where
FROM pg_policies 
WHERE tablename = 'user_whatsapp_numbers'
ORDER BY policyname;

-- 2. Habilitar RLS se necessário
ALTER TABLE user_whatsapp_numbers ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas se existirem para evitar conflito
DROP POLICY IF EXISTS "Admins can assign WhatsApp to users" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Users can view their WhatsApp assignments" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Admins can update WhatsApp assignments" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Admins can delete WhatsApp assignments" ON user_whatsapp_numbers;

-- 4. Criar políticas modulares
-- Política para INSERT - Admins podem criar atribuições
CREATE POLICY "Admins can assign WhatsApp to users" ON user_whatsapp_numbers
    FOR INSERT
    WITH CHECK (
        -- Apenas admins podem inserir atribuições
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.linked_auth_user_id = auth.uid() 
            AND p.role = 'admin'
        )
        AND
        -- Admin só pode atribuir para usuários da sua organização
        EXISTS (
            SELECT 1 FROM profiles target_user
            WHERE target_user.id = user_whatsapp_numbers.profile_id
            AND target_user.created_by_user_id = (
                SELECT p2.id FROM profiles p2 
                WHERE p2.linked_auth_user_id = auth.uid()
            )
        )
    );

-- Política para SELECT - Usuários podem ver suas próprias atribuições  
CREATE POLICY "Users can view their WhatsApp assignments" ON user_whatsapp_numbers
    FOR SELECT
    USING (
        -- Admin vê todas atribuições que criou
        created_by_user_id = (
            SELECT p.id FROM profiles p 
            WHERE p.linked_auth_user_id = auth.uid()
        )
        OR
        -- Usuário vê suas próprias atribuições
        profile_id = (
            SELECT p.id FROM profiles p 
            WHERE p.linked_auth_user_id = auth.uid()
        )
    );

-- Política para UPDATE - Admins podem atualizar
CREATE POLICY "Admins can update WhatsApp assignments" ON user_whatsapp_numbers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.linked_auth_user_id = auth.uid() 
            AND p.role = 'admin'
            AND p.id = user_whatsapp_numbers.created_by_user_id
        )
    );

-- Política para DELETE - Admins podem deletar  
CREATE POLICY "Admins can delete WhatsApp assignments" ON user_whatsapp_numbers
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.linked_auth_user_id = auth.uid() 
            AND p.role = 'admin'
            AND p.id = user_whatsapp_numbers.created_by_user_id
        )
    );

-- 5. Verificar se as políticas foram criadas
SELECT 
    '=== VERIFICAÇÃO APÓS CRIAÇÃO ===' as info,
    COUNT(*) as total_politicas_whatsapp
FROM pg_policies 
WHERE tablename = 'user_whatsapp_numbers';