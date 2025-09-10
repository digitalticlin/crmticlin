-- =====================================================
-- INVESTIGAÇÃO DA LÓGICA DE NEGÓCIO COMPLETA
-- =====================================================

-- 1. ESTRUTURA: user_funnels (vinculação funil -> operacional)
SELECT 
    'Estrutura user_funnels' as secao,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_funnels'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. ESTRUTURA: user_whatsapp_numbers (vinculação instância -> operacional)  
SELECT 
    'Estrutura user_whatsapp_numbers' as secao,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_whatsapp_numbers'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. DADOS: Verificar vinculações de funis existentes
SELECT 
    'Vinculações de funis existentes' as secao,
    uf.id,
    uf.funnel_id,
    f.name as funnel_name,
    uf.profile_id,
    p.email as operacional_email,
    p.role,
    f.created_by_user_id as admin_dono_funil
FROM user_funnels uf
JOIN funnels f ON f.id = uf.funnel_id
JOIN profiles p ON p.id = uf.profile_id
ORDER BY f.name, p.email;

-- 4. DADOS: Verificar vinculações de WhatsApp existentes
SELECT 
    'Vinculações WhatsApp existentes' as secao,
    uwn.id,
    uwn.whatsapp_number_id,
    wi.name as instancia_name,
    uwn.profile_id,
    p.email as operacional_email,
    p.role,
    wi.created_by_user_id as admin_dono_instancia
FROM user_whatsapp_numbers uwn
JOIN whatsapp_instances wi ON wi.id = uwn.whatsapp_number_id
JOIN profiles p ON p.id = uwn.profile_id
ORDER BY wi.name, p.email;

-- 5. LÓGICA: Para cada operacional, quantos leads deveria ver?
-- (owner_id = ele) OU (instância WhatsApp vinculada a ele)
WITH operacional_leads AS (
    SELECT 
        p.email as operacional,
        p.linked_auth_user_id as op_id,
        -- Leads onde é owner
        COUNT(DISTINCT CASE WHEN l.owner_id = p.linked_auth_user_id THEN l.id END) as leads_como_owner,
        -- Leads de instâncias vinculadas
        COUNT(DISTINCT CASE WHEN uwn.whatsapp_number_id IS NOT NULL THEN l2.id END) as leads_instancia_vinculada,
        -- Total que deveria ver
        COUNT(DISTINCT CASE 
            WHEN l.owner_id = p.linked_auth_user_id OR uwn.whatsapp_number_id IS NOT NULL 
            THEN COALESCE(l.id, l2.id) 
        END) as total_deveria_ver
    FROM profiles p
    LEFT JOIN leads l ON l.owner_id = p.linked_auth_user_id
    LEFT JOIN user_whatsapp_numbers uwn ON uwn.profile_id = p.id
    LEFT JOIN leads l2 ON l2.whatsapp_number_id = uwn.whatsapp_number_id
    WHERE p.role = 'operational' AND p.linked_auth_user_id IS NOT NULL
    GROUP BY p.email, p.linked_auth_user_id
)
SELECT 
    'Leads que operacionais deveriam ver' as secao,
    operacional,
    leads_como_owner,
    leads_instancia_vinculada,
    total_deveria_ver
FROM operacional_leads
ORDER BY total_deveria_ver DESC;

-- 6. RLS ATUAL: Verificar políticas existentes nas tabelas
SELECT 
    'Políticas RLS existentes' as secao,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('funnels', 'whatsapp_instances', 'leads')
ORDER BY tablename, policyname;

-- 7. RLS STATUS: Verificar se RLS está habilitado nas tabelas
SELECT 
    'Status RLS das tabelas' as secao,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename IN ('funnels', 'whatsapp_instances', 'leads', 'user_funnels', 'user_whatsapp_numbers')
AND schemaname = 'public'
ORDER BY tablename;