-- ============================================
-- CORREÇÕES PARA PLANOS PAGOS
-- Execute estas queries para corrigir os problemas
-- ============================================

-- ============================================
-- 1. CORRIGIR O PROBLEMA IMEDIATO DO USUÁRIO DE TESTE
-- ============================================

-- 1.1 Criar manualmente o profile para o usuário de teste
INSERT INTO profiles (
    id,
    full_name,
    username,
    document_id,
    whatsapp,
    role,
    selected_plan,
    email,
    created_by_user_id,
    created_at,
    updated_at
)
SELECT
    au.id,
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1),
    au.raw_user_meta_data->>'document_id',
    au.raw_user_meta_data->>'whatsapp',
    'admin'::user_role,
    au.raw_user_meta_data->>'selected_plan',
    au.email,
    au.id,
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'inaciojrdossantos@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = au.id);

-- ============================================
-- 2. INVESTIGAR TRIGGER on_auth_user_created
-- ============================================

-- 2.1 Verificar se o trigger existe e está ativo
SELECT
    t.tgname as trigger_name,
    p.proname as function_name,
    pg_get_triggerdef(t.oid) as trigger_definition,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'OTHER'
    END as status
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth'
  AND c.relname = 'users'
  AND t.tgname = 'on_auth_user_created';

-- 2.2 Verificar se a função handle_new_user existe
SELECT
    routine_name,
    routine_type,
    CASE
        WHEN routine_definition LIKE '%PLANO PAGO%' THEN 'TEM_LOGICA_PLANO_PAGO'
        ELSE 'SEM_LOGICA_PLANO_PAGO'
    END as tem_logica_planos
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- ============================================
-- 3. RECRIAR TRIGGER SE NECESSÁRIO
-- ============================================

-- 3.1 Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3.2 Recriar trigger apontando para a função correta
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. TESTAR CRIAÇÃO MANUAL DE USUÁRIO
-- ============================================

-- 4.1 Simular criação de usuário (TESTE - NÃO EXECUTAR EM PRODUÇÃO)
-- Esta query simula o que acontece quando um usuário se registra
-- COMENTADO PARA SEGURANÇA:
/*
DO $$
DECLARE
    test_user_data jsonb;
BEGIN
    -- Simular dados de registro
    test_user_data := jsonb_build_object(
        'full_name', 'TESTE TRIGGER',
        'document_id', '12345678901',
        'whatsapp', '62999999999',
        'role', 'admin',
        'selected_plan', 'pro_5k'
    );

    RAISE NOTICE 'Simulando criação de usuário com dados: %', test_user_data;

    -- Esta seria a chamada da função trigger
    -- handle_new_user() seria executada aqui
END $$;
*/

-- ============================================
-- 5. VERIFICAR SE EDGE FUNCTION PODE SER CHAMADA
-- ============================================

-- 5.1 Testar se plan_subscriptions foi criado para o usuário
SELECT
    ps.user_id,
    ps.plan_type,
    ps.status,
    ps.created_at,
    au.email
FROM plan_subscriptions ps
JOIN auth.users au ON au.id = ps.user_id
WHERE au.email = 'inaciojrdossantos@gmail.com';

-- 5.2 Se não existir, criar manualmente para testar edge function
INSERT INTO plan_subscriptions (
    user_id,
    plan_type,
    status,
    member_limit,
    current_period_start,
    current_period_end,
    created_at
)
SELECT
    au.id,
    'pro_5k',
    'pending_checkout',
    3,
    NULL,
    NULL,
    NOW()
FROM auth.users au
WHERE au.email = 'inaciojrdossantos@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM plan_subscriptions
    WHERE user_id = au.id
  );

-- ============================================
-- 6. VERIFICAÇÕES FINAIS
-- ============================================

-- 6.1 Verificar se profile foi criado
SELECT
    p.id,
    p.email,
    p.full_name,
    p.selected_plan,
    p.created_at,
    'Profile criado com sucesso' as status
FROM profiles p
WHERE p.email = 'inaciojrdossantos@gmail.com';

-- 6.2 Verificar se funil foi criado
SELECT
    f.id as funnel_id,
    f.name as funnel_name,
    COUNT(ks.id) as total_stages,
    f.created_at
FROM profiles p
JOIN funnels f ON f.created_by_user_id = p.id
LEFT JOIN kanban_stages ks ON ks.funnel_id = f.id
WHERE p.email = 'inaciojrdossantos@gmail.com'
GROUP BY f.id, f.name, f.created_at;

-- 6.3 Verificar se plan_subscription existe
SELECT
    ps.user_id,
    ps.plan_type,
    ps.status,
    ps.created_at
FROM profiles p
JOIN plan_subscriptions ps ON ps.user_id = p.id
WHERE p.email = 'inaciojrdossantos@gmail.com';

-- ============================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- 1. Execute as queries na ordem (1.1, 2.1, 2.2, 3.1, 3.2, 5.1, 5.2)
-- 2. Pule a query 4.1 (é apenas teste)
-- 3. Execute as verificações finais (6.1, 6.2, 6.3)
-- 4. Me envie todos os resultados
-- ============================================