-- TESTE: Verificar se a função handle_new_user pode detectar convites

-- 1. Ver função atual
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';

-- 2. Simular um usuário de convite (só para teste - NÃO VAI EXECUTAR)
-- SELECT 'Simulação: Usuário com is_invite = true seria ignorado' as teste;