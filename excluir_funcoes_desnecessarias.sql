-- Excluir funções RPC que não são mais necessárias com a nova solução Resend

-- 1. Excluir função get_invite_data_by_token (não usamos mais)
DROP FUNCTION IF EXISTS get_invite_data_by_token(TEXT);

-- 2. Excluir função check_email_availability (não precisamos mais)
DROP FUNCTION IF EXISTS check_email_availability(TEXT);

-- 3. Excluir função cleanup_conflicting_invites (não precisamos mais)
DROP FUNCTION IF EXISTS cleanup_conflicting_invites(TEXT);

-- 4. Verificar funções restantes (devem permanecer)
SELECT 
    'funcoes_mantidas' as tipo,
    proname as nome_funcao,
    proargnames as argumentos
FROM pg_proc 
WHERE proname IN (
    'handle_new_user',
    'handle_invite_acceptance', 
    'accept_team_invite_safely'
)
ORDER BY proname;

-- 5. Confirmar que as funções desnecessárias foram removidas
SELECT 
    'funcoes_removidas_confirmacao' as tipo,
    COUNT(*) as total
FROM pg_proc 
WHERE proname IN (
    'get_invite_data_by_token',
    'check_email_availability',
    'cleanup_conflicting_invites'
);

-- Resultado esperado: total = 0 (nenhuma função encontrada)