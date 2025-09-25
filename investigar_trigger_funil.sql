-- ============================================
-- INVESTIGAR POR QUE TRIGGER DE FUNIL NÃO DISPARA
-- ============================================

-- 1. VERIFICAR SE O TRIGGER EXISTE
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_create_default_funnel'
   OR trigger_name ILIKE '%funnel%'
   OR trigger_name ILIKE '%funil%';

-- 2. VERIFICAR SE A FUNÇÃO EXISTE
SELECT
    proname as function_name,
    proowner,
    prosecdef as security_definer,
    provolatile,
    proparallel
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND proname = 'create_default_funnel_for_admin';

-- 3. VERIFICAR ÚLTIMOS PROFILES CRIADOS E SE TÊM FUNIS
SELECT
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.created_by_user_id,
    p.created_at,
    -- Verificar se tem funis
    COUNT(f.id) as total_funis,
    -- Primeiro funil criado
    MIN(f.created_at) as primeiro_funil_em
FROM profiles p
LEFT JOIN funnels f ON p.id = f.created_by_user_id
WHERE p.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.id, p.full_name, p.email, p.role, p.created_by_user_id, p.created_at
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. VERIFICAR ADMINS SEM FUNIS
SELECT
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.created_by_user_id,
    p.created_at
FROM profiles p
LEFT JOIN funnels f ON p.id = f.created_by_user_id
WHERE p.role = 'admin'
    AND p.created_by_user_id IS NULL  -- Admin não é operational
    AND f.id IS NULL  -- Sem funis
ORDER BY p.created_at DESC;

-- 5. TESTAR SE O TRIGGER ESTÁ ATIVO - SIMULAR INSERT
-- (NÃO EXECUTE - APENAS PARA EXEMPLO)
/*
BEGIN;
  -- Simular criação de admin
  INSERT INTO profiles (
    id,
    full_name,
    email,
    role,
    created_by_user_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'Teste Admin Trigger',
    'teste.trigger@example.com',
    'admin',
    NULL,
    NOW(),
    NOW()
  );

  -- Verificar se funil foi criado
  SELECT COUNT(*) FROM funnels WHERE created_by_user_id = (SELECT id FROM profiles WHERE email = 'teste.trigger@example.com');
ROLLBACK;
*/

-- 6. VERIFICAR LOGS DE NOTICE DO TRIGGER
-- (Se estiver executando, aparecerá nos logs do Supabase)
SELECT
    'Verifique logs do Supabase para mensagens como:' as instrucao,
    '[create_default_funnel] 🚀 Criando funil padrão para admin:' as mensagem_esperada;

-- 7. VERIFICAR SE HÁ OUTROS TRIGGERS EM PROFILES QUE PODEM CONFLITAR
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;