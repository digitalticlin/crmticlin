-- =====================================================
-- TESTE ESPECÍFICO COM USUÁRIO 9936ae64-b78c-48fe-97e8-bf67623349c6
-- Execute no Supabase Dashboard SEM "Run as user" 
-- =====================================================

-- 1. TESTE DIRETO: Simular ser o usuário 9936ae64-b78c-48fe-97e8-bf67623349c6
WITH test_user AS (
    SELECT '9936ae64-b78c-48fe-97e8-bf67623329c6'::uuid as user_id
)
SELECT 
    'Informações do usuário teste' as secao,
    user_id as id_testando
FROM test_user;

-- 2. Verificar perfil deste usuário específico
SELECT 
    'Perfil do usuário 9936ae64' as secao,
    id as profile_id,
    linked_auth_user_id,
    email,
    role,
    created_by_user_id,
    full_name
FROM profiles
WHERE linked_auth_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6';

-- 3. Quantos leads este usuário DEVERIA ver como ADMIN
SELECT 
    'ADMIN - Leads onde ele é created_by_user_id' as secao,
    COUNT(*) as total
FROM leads
WHERE created_by_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6';

-- 4. Verificar se as funções RLS funcionam para este usuário
-- (Simulando auth.uid() = este usuário)
WITH simulated_context AS (
    SELECT 
        '9936ae64-b78c-48fe-97e8-bf67623349c6'::uuid as simulated_uid,
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE linked_auth_user_id = '9936ae64-b78c-48fe-97e8-bf67623349c6'
            AND role = 'admin'
        ) as is_admin_user
)
SELECT 
    'Simulação de contexto' as secao,
    simulated_uid,
    is_admin_user
FROM simulated_context;

-- 5. TESTE OPERACIONAL: Buscar um usuário operacional e suas instâncias
SELECT 
    'OPERACIONAIS - Lista de usuários' as secao,
    p.linked_auth_user_id,
    p.email,
    p.role,
    p.created_by_user_id as admin_que_criou
FROM profiles p
WHERE p.role = 'operational'
ORDER BY p.email
LIMIT 5;

-- 6. TESTE OPERACIONAL: Verificar instâncias WhatsApp vinculadas a operacionais
SELECT 
    'OPERACIONAIS - Instâncias WhatsApp vinculadas' as secao,
    p.email as operacional_email,
    p.linked_auth_user_id as operacional_id,
    uwn.whatsapp_number_id as instancia_id,
    wi.name as nome_instancia,
    COUNT(l.id) as leads_na_instancia
FROM profiles p
JOIN user_whatsapp_numbers uwn ON uwn.profile_id = p.id
JOIN whatsapp_instances wi ON wi.id = uwn.whatsapp_number_id
LEFT JOIN leads l ON l.whatsapp_number_id = uwn.whatsapp_number_id
WHERE p.role = 'operational'
GROUP BY p.email, p.linked_auth_user_id, uwn.whatsapp_number_id, wi.name
ORDER BY leads_na_instancia DESC
LIMIT 10;

-- 7. TESTE OPERACIONAL: Para um operacional específico, simular quantos leads deveria ver
WITH operacional_teste AS (
    SELECT linked_auth_user_id as op_id
    FROM profiles 
    WHERE role = 'operational' 
    AND linked_auth_user_id IS NOT NULL
    LIMIT 1
)
SELECT 
    'OPERACIONAL - Leads que deveria ver' as secao,
    op.op_id as operacional_testado,
    COUNT(DISTINCT l.id) as total_leads_visiveis
FROM operacional_teste op
LEFT JOIN user_whatsapp_numbers uwn ON uwn.profile_id = (
    SELECT id FROM profiles WHERE linked_auth_user_id = op.op_id
)
LEFT JOIN leads l ON l.whatsapp_number_id = uwn.whatsapp_number_id
GROUP BY op.op_id;

-- 8. Verificar se a política RLS para operacional está correta
SELECT 
    'Política RLS - Operacional' as secao,
    policyname,
    qual as condicao
FROM pg_policies
WHERE tablename = 'leads' 
AND policyname LIKE '%visibility%';

-- 9. DIAGNÓSTICO: Leads órfãos (sem instância WhatsApp)
SELECT 
    'DIAGNÓSTICO - Leads sem whatsapp_instance_id' as secao,
    COUNT(*) as total_leads_sem_instancia
FROM leads
WHERE whatsapp_number_id IS NULL;

-- 10. DIAGNÓSTICO: Verificar estrutura user_whatsapp_numbers
SELECT 
    'DIAGNÓSTICO - Estrutura user_whatsapp_numbers' as secao,
    COUNT(*) as total_vinculacoes,
    COUNT(DISTINCT profile_id) as profiles_vinculados,
    COUNT(DISTINCT whatsapp_number_id) as instancias_vinculadas
FROM user_whatsapp_numbers;