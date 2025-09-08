-- Verificar se o convite com token específico existe
SELECT 
    id,
    full_name,
    email,
    role,
    invite_token,
    invite_status,
    invite_sent_at,
    created_by_user_id,
    created_at
FROM profiles 
WHERE invite_token = '7be0bf07-7617-43fc-a01e-e70f46814e78';

-- Verificar estrutura da tabela profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name IN ('invite_token', 'invite_status', 'email')
ORDER BY ordinal_position;

-- Verificar todos os convites pendentes
SELECT 
    id,
    full_name,
    email,
    invite_token,
    invite_status,
    created_at
FROM profiles 
WHERE invite_status IN ('pending', 'invite_sent')
ORDER BY created_at DESC
LIMIT 10;