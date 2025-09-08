-- =====================================================
-- TESTE COM USUÁRIO ESPECÍFICO
-- Execute este script NO CONTEXTO de um usuário autenticado
-- No Supabase Dashboard, use "Run as user" e selecione o usuário
-- =====================================================

-- 1. Verificar qual usuário está executando
SELECT 
    auth.uid() as current_auth_uid,
    auth.email() as current_email,
    auth.role() as current_role;

-- 2. Buscar perfil do usuário atual
SELECT 
    id,
    linked_auth_user_id,
    email,
    role,
    created_by_user_id,
    full_name
FROM profiles
WHERE linked_auth_user_id = auth.uid();

-- 3. Testar as funções auxiliares
SELECT 
    public.get_user_role() as my_role,
    public.get_user_organization_id() as my_organization;

-- 4. Verificar quantos leads EU DEVERIA ver baseado no meu role
WITH my_profile AS (
    SELECT * FROM profiles WHERE linked_auth_user_id = auth.uid()
)
SELECT 
    CASE 
        WHEN mp.role = 'admin' THEN 'Como admin, devo ver todos onde created_by_user_id = ' || auth.uid()
        WHEN mp.role = 'operational' THEN 'Como operacional, devo ver onde owner_id = ' || auth.uid()
        ELSE 'Sem role definido'
    END as expectativa,
    mp.role as meu_role,
    auth.uid() as meu_id
FROM my_profile mp;

-- 5. Contar quantos leads EU REALMENTE vejo
SELECT 
    COUNT(*) as total_leads_visiveis,
    COUNT(CASE WHEN created_by_user_id = auth.uid() THEN 1 END) as leads_que_criei,
    COUNT(CASE WHEN owner_id = auth.uid() THEN 1 END) as leads_onde_sou_owner,
    COUNT(CASE WHEN created_by_user_id != auth.uid() AND owner_id = auth.uid() THEN 1 END) as leads_atribuidos_a_mim
FROM leads;

-- 6. Ver primeiros 5 leads com detalhes
SELECT 
    id,
    name,
    created_by_user_id,
    owner_id,
    funnel_id,
    CASE 
        WHEN created_by_user_id = auth.uid() THEN 'SIM' 
        ELSE 'NÃO' 
    END as eu_criei,
    CASE 
        WHEN owner_id = auth.uid() THEN 'SIM' 
        ELSE 'NÃO' 
    END as sou_owner
FROM leads
ORDER BY created_at DESC
LIMIT 5;

-- 7. Verificar funis que posso ver
SELECT 
    f.id,
    f.name,
    f.created_by_user_id,
    CASE 
        WHEN f.created_by_user_id = auth.uid() THEN 'MEU FUNIL' 
        ELSE 'FUNIL DE OUTRO' 
    END as tipo,
    COUNT(DISTINCT l.id) as total_leads_no_funil
FROM sales_funnels f
LEFT JOIN leads l ON l.funnel_id = f.id
GROUP BY f.id, f.name, f.created_by_user_id
ORDER BY f.created_at DESC;

-- 8. Debug: Ver se há problemas com os dados
SELECT 
    'Leads sem created_by_user_id' as problema,
    COUNT(*) as quantidade
FROM leads 
WHERE created_by_user_id IS NULL
UNION ALL
SELECT 
    'Leads sem owner_id' as problema,
    COUNT(*) as quantidade
FROM leads 
WHERE owner_id IS NULL
UNION ALL
SELECT 
    'Leads com created_by que não existe' as problema,
    COUNT(*) as quantidade
FROM leads l
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = l.created_by_user_id
);