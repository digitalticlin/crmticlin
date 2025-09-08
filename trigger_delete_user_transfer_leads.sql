-- TRIGGER PARA TRANSFERIR LEADS QUANDO USUÁRIO É DELETADO
-- Resolve o problema de foreign key constraint automaticamente

-- 1. Função para transferir leads na deleção de usuário
CREATE OR REPLACE FUNCTION transfer_leads_on_user_delete()
RETURNS TRIGGER AS $$
DECLARE
    admin_id uuid;
BEGIN
    -- Buscar o admin que criou este usuário operacional
    SELECT created_by_user_id INTO admin_id
    FROM profiles
    WHERE linked_auth_user_id = OLD.id;
    
    -- Se encontrou o admin, transferir todos os leads
    IF admin_id IS NOT NULL THEN
        -- Transferir ownership de volta para o admin
        UPDATE leads 
        SET owner_id = admin_id
        WHERE owner_id = OLD.id;
        
        -- Log da operação
        RAISE NOTICE 'Leads transferidos do usuário % para admin % na deleção', OLD.id, admin_id;
    ELSE
        RAISE NOTICE 'Admin não encontrado para usuário %, leads mantidos', OLD.id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger BEFORE DELETE na tabela auth.users
DROP TRIGGER IF EXISTS trigger_transfer_leads_on_user_delete ON auth.users;

CREATE TRIGGER trigger_transfer_leads_on_user_delete
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION transfer_leads_on_user_delete();

-- 3. Comentário explicativo
COMMENT ON FUNCTION transfer_leads_on_user_delete() IS 
'Transfere automaticamente o owner_id dos leads para o admin quando um usuário operacional é deletado, resolvendo foreign key constraints';

COMMENT ON TRIGGER trigger_transfer_leads_on_user_delete ON auth.users IS 
'Trigger executado antes de deletar usuário para transferir leads e evitar violação de foreign key';

-- 4. Verificar se o trigger foi criado
SELECT 
    '=== TRIGGER CRIADO ===' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_transfer_leads_on_user_delete';