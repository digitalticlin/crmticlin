-- SQL que chama a edge function delete_auth_user para deletar múltiplos usuários

-- Função para deletar usuários via edge function
DO $$
DECLARE
    user_record RECORD;
    result TEXT;
BEGIN
    -- Loop pelos usuários que queremos deletar
    FOR user_record IN 
        SELECT id, email 
        FROM auth.users 
        WHERE email IN ('teste@teste.com', 'umarketing506@gmail.com', 'inaciodomrua@gmail.com')
    LOOP
        -- Chamar edge function para cada usuário
        SELECT content INTO result 
        FROM http((
            'POST',
            current_setting('app.settings.supabase_url') || '/functions/v1/delete_auth_user',
            ARRAY[
                http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
                http_header('Content-Type', 'application/json')
            ],
            'application/json',
            json_build_object(
                'user_id', user_record.id,
                'email', user_record.email
            )::text
        ));
        
        RAISE NOTICE 'Deletando usuário %: %', user_record.email, result;
    END LOOP;
    
    RAISE NOTICE 'Processo de deleção concluído!';
END $$;

-- Verificar se foram deletados
SELECT 
    'verificacao_final' as tipo,
    COUNT(*) as usuarios_restantes,
    COALESCE(string_agg(email, ', '), 'Nenhum') as emails_que_ainda_existem
FROM auth.users 
WHERE email IN ('teste@teste.com', 'umarketing506@gmail.com', 'inaciodomrua@gmail.com');