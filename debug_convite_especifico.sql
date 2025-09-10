-- DEBUG: Verificar o convite específico que está falhando

-- 1. Buscar profile com esse token específico
SELECT 
    id,
    full_name,
    email,
    invite_token,
    invite_status,
    created_at
FROM profiles 
WHERE invite_token = '0612826f-d353-4156-8189-d7c4d5b95f73';

-- 2. Se não encontrou, ver se é problema de tipo (UUID vs TEXT)
SELECT 
    id,
    full_name,
    email,
    invite_token,
    invite_status,
    pg_typeof(invite_token) as tipo_coluna
FROM profiles 
WHERE invite_token::text = '0612826f-d353-4156-8189-d7c4d5b95f73';

-- 3. Ver todos os convites pendentes para comparar
SELECT 
    id,
    full_name,
    email,
    invite_token,
    invite_status,
    pg_typeof(invite_token) as tipo
FROM profiles 
WHERE invite_status IN ('pending', 'invite_sent')
ORDER BY created_at DESC
LIMIT 5;

-- 4. Testar a função com dados reais
SELECT public.process_accepted_invite(
    '00000000-0000-0000-0000-000000000000'::uuid,  -- auth_user_id fictício
    (SELECT id FROM profiles WHERE invite_token::text = '0612826f-d353-4156-8189-d7c4d5b95f73' LIMIT 1),  -- profile_id real
    '0612826f-d353-4156-8189-d7c4d5b95f73'         -- token real
) as teste_funcao;