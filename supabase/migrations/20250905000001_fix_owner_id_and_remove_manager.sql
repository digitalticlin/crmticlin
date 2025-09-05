-- Migration: Fix owner_id type and remove manager role
-- Part 1: Fix owner_id from TEXT to UUID

-- ===============================
-- 1. BACKUP E CORREÇÃO DO OWNER_ID
-- ===============================

-- Backup da coluna atual (apenas para segurança)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_id_backup text;
UPDATE leads SET owner_id_backup = owner_id WHERE owner_id IS NOT NULL;

-- Remover coluna TEXT problemática
ALTER TABLE leads DROP COLUMN IF EXISTS owner_id;

-- Criar coluna UUID correta
ALTER TABLE leads ADD COLUMN owner_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id);

-- ===============================
-- 2. REMOVER ROLE 'MANAGER' OBSOLETO
-- ===============================

-- Converter managers existentes para admin (se houver)
UPDATE profiles SET role = 'admin' WHERE role = 'manager';

-- Remover TODAS as policies que dependem da coluna role
DROP POLICY IF EXISTS "Prevent admin creation by non-admin" ON profiles;
DROP POLICY IF EXISTS "Allow access to own invite data" ON profiles;
DROP POLICY IF EXISTS "Allow admins to manage funnel assignments" ON user_funnels;
DROP POLICY IF EXISTS "Allow admins to manage WhatsApp assignments" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Allow admins to create team profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admins to update team profiles" ON profiles;

-- Primeiro, alterar coluna para text temporariamente
ALTER TABLE profiles ALTER COLUMN role TYPE text;

-- Recriar ENUM sem manager
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'operational');

-- Converter coluna de volta para o novo ENUM
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::text::user_role;

-- Recriar policies necessárias sem manager
CREATE POLICY "Prevent admin creation by non-admin" ON profiles
FOR INSERT WITH CHECK (
  CASE 
    WHEN role = 'admin' THEN 
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE linked_auth_user_id = auth.uid() 
        AND role = 'admin'
      )
    ELSE true
  END
);

CREATE POLICY "Allow access to own invite data" ON profiles
FOR SELECT USING (
  linked_auth_user_id = auth.uid() OR 
  created_by_user_id = auth.uid() OR
  id = auth.uid()
);

CREATE POLICY "Allow admins to manage funnel assignments" ON user_funnels
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

CREATE POLICY "Allow admins to manage WhatsApp assignments" ON user_whatsapp_numbers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

CREATE POLICY "Allow admins to create team profiles" ON profiles
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

CREATE POLICY "Allow admins to update team profiles" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- ===============================
-- 3. FUNÇÃO DE SINCRONIZAÇÃO MELHORADA
-- ===============================

CREATE OR REPLACE FUNCTION sync_lead_ownership()
RETURNS TABLE(
    total_leads INTEGER,
    leads_synced INTEGER,
    funnel_assignments INTEGER,
    whatsapp_assignments INTEGER,
    admin_fallback INTEGER
) AS $$
DECLARE
    total_count INTEGER;
    synced_count INTEGER := 0;
    funnel_count INTEGER := 0;
    whatsapp_count INTEGER := 0;
    admin_count INTEGER := 0;
    lead_record RECORD;
BEGIN
    -- Contar total de leads
    SELECT COUNT(*) INTO total_count FROM leads;
    
    RAISE NOTICE '🔄 Iniciando sincronização de % leads...', total_count;
    
    -- Loop através de todos os leads sem owner_id
    FOR lead_record IN 
        SELECT l.id, l.funnel_id, l.whatsapp_number_id, l.created_by_user_id
        FROM leads l 
        WHERE l.owner_id IS NULL
    LOOP
        DECLARE
            assigned_user_id uuid := NULL;
        BEGIN
            -- 1. Tentar encontrar usuário atribuído ao funil
            IF lead_record.funnel_id IS NOT NULL THEN
                SELECT p.linked_auth_user_id INTO assigned_user_id
                FROM user_funnels uf
                JOIN profiles p ON uf.profile_id = p.id
                WHERE uf.funnel_id = lead_record.funnel_id
                AND p.linked_auth_user_id IS NOT NULL
                AND p.role = 'operational'
                ORDER BY uf.created_at DESC
                LIMIT 1;
                
                IF assigned_user_id IS NOT NULL THEN
                    funnel_count := funnel_count + 1;
                END IF;
            END IF;
            
            -- 2. Se não encontrou no funil, tentar WhatsApp
            IF assigned_user_id IS NULL AND lead_record.whatsapp_number_id IS NOT NULL THEN
                SELECT p.linked_auth_user_id INTO assigned_user_id
                FROM user_whatsapp_numbers uwn
                JOIN profiles p ON uwn.profile_id = p.id
                WHERE uwn.whatsapp_number_id = lead_record.whatsapp_number_id
                AND p.linked_auth_user_id IS NOT NULL
                AND p.role = 'operational'
                ORDER BY uwn.created_at DESC
                LIMIT 1;
                
                IF assigned_user_id IS NOT NULL THEN
                    whatsapp_count := whatsapp_count + 1;
                END IF;
            END IF;
            
            -- 3. Fallback: usar created_by_user_id (admin)
            IF assigned_user_id IS NULL THEN
                assigned_user_id := lead_record.created_by_user_id;
                admin_count := admin_count + 1;
            END IF;
            
            -- 4. Atualizar lead com owner_id
            UPDATE leads 
            SET owner_id = assigned_user_id 
            WHERE id = lead_record.id;
            
            synced_count := synced_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '❌ Erro ao sincronizar lead %: %', lead_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '✅ Sincronização concluída: % leads atualizados', synced_count;
    RAISE NOTICE '📊 Estatísticas: Funil=%, WhatsApp=%, Admin=%', funnel_count, whatsapp_count, admin_count;
    
    RETURN QUERY SELECT total_count, synced_count, funnel_count, whatsapp_count, admin_count;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 4. EXECUTAR SINCRONIZAÇÃO
-- ===============================

-- Executar a função de sincronização
SELECT * FROM sync_lead_ownership();

-- ===============================
-- 5. VALIDAR RESULTADOS
-- ===============================

-- Verificar resultados da sincronização
SELECT 
    'SYNC_RESULTS' as status,
    COUNT(*) as total_leads,
    COUNT(owner_id) as leads_with_owner,
    COUNT(*) - COUNT(owner_id) as leads_without_owner,
    ROUND(COUNT(owner_id) * 100.0 / COUNT(*), 2) as percentage_synced
FROM leads;

-- Verificar distribuição por usuário
SELECT 
    'OWNER_DISTRIBUTION' as status,
    p.full_name,
    p.role,
    COUNT(l.id) as leads_count
FROM leads l
LEFT JOIN profiles p ON l.owner_id = p.linked_auth_user_id
GROUP BY p.full_name, p.role
ORDER BY leads_count DESC;

-- ===============================
-- 6. COMENTÁRIOS E DOCUMENTAÇÃO
-- ===============================

COMMENT ON COLUMN leads.owner_id IS 'UUID do usuário responsável pelo lead (auth.users.id)';
COMMENT ON FUNCTION sync_lead_ownership() IS 'Sincroniza ownership de leads: 1) Usuário atribuído ao funil, 2) Usuário atribuído ao WhatsApp, 3) Admin criador';

-- ===============================
-- 7. LIMPEZA (após validação)
-- ===============================

-- ATENÇÃO: Executar apenas após validar que tudo está correto
-- ALTER TABLE leads DROP COLUMN IF EXISTS owner_id_backup;