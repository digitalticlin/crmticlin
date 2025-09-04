-- Migration: Enforce access rules for operational users
-- Ensure operational users must have at least one funnel or WhatsApp instance assigned

-- ✅ 1. Remove obrigatoriedade de vinculações - usuários podem ser criados sem acessos inicialmente
-- Função removida - não é mais necessária validar acessos obrigatórios

-- ✅ 2. Sistema de OWNER_ID dinâmico - atualiza leads quando vinculações mudam

-- Função para encontrar o owner correto de um funil
CREATE OR REPLACE FUNCTION get_funnel_owner(funnel_id_param uuid)
RETURNS uuid AS $$
DECLARE
    assigned_user_id uuid;
    funnel_creator_id uuid;
BEGIN
    -- Buscar usuário atribuído ao funil (mais recente se houver múltiplos)
    SELECT profile_id INTO assigned_user_id
    FROM user_funnels uf
    JOIN profiles p ON uf.profile_id = p.id
    WHERE uf.funnel_id = funnel_id_param 
    AND p.invite_status = 'accepted' 
    AND p.linked_auth_user_id IS NOT NULL
    ORDER BY uf.created_at DESC
    LIMIT 1;
    
    -- Se encontrou usuário atribuído, usar seu linked_auth_user_id
    IF assigned_user_id IS NOT NULL THEN
        SELECT linked_auth_user_id INTO funnel_creator_id
        FROM profiles
        WHERE id = assigned_user_id;
        
        RETURN funnel_creator_id;
    END IF;
    
    -- Senão, retornar o criador original do funil
    SELECT created_by_user_id INTO funnel_creator_id
    FROM funnels
    WHERE id = funnel_id_param;
    
    RETURN funnel_creator_id;
END;
$$ LANGUAGE plpgsql;

-- Função para encontrar o owner correto de uma instância WhatsApp
CREATE OR REPLACE FUNCTION get_whatsapp_owner(whatsapp_id_param uuid)
RETURNS uuid AS $$
DECLARE
    assigned_user_id uuid;
    whatsapp_creator_id uuid;
BEGIN
    -- Buscar usuário atribuído à instância (mais recente se houver múltiplos)
    SELECT profile_id INTO assigned_user_id
    FROM user_whatsapp_numbers uwn
    JOIN profiles p ON uwn.profile_id = p.id
    WHERE uwn.whatsapp_number_id = whatsapp_id_param 
    AND p.invite_status = 'accepted' 
    AND p.linked_auth_user_id IS NOT NULL
    ORDER BY uwn.created_at DESC
    LIMIT 1;
    
    -- Se encontrou usuário atribuído, usar seu linked_auth_user_id
    IF assigned_user_id IS NOT NULL THEN
        SELECT linked_auth_user_id INTO whatsapp_creator_id
        FROM profiles
        WHERE id = assigned_user_id;
        
        RETURN whatsapp_creator_id;
    END IF;
    
    -- Senão, retornar o criador original da instância
    SELECT created_by_user_id INTO whatsapp_creator_id
    FROM whatsapp_instances
    WHERE id = whatsapp_id_param;
    
    RETURN whatsapp_creator_id;
END;
$$ LANGUAGE plpgsql;

-- ✅ 5. Create function to safely accept invite with validations
CREATE OR REPLACE FUNCTION accept_team_invite_safely(
    p_invite_token text,
    p_auth_user_id uuid
)
RETURNS JSON AS $$
DECLARE
    invite_profile profiles%ROWTYPE;
    funnel_count integer;
    whatsapp_count integer;
BEGIN
    -- Find and lock the invite profile
    SELECT * INTO invite_profile 
    FROM profiles 
    WHERE invite_token = p_invite_token 
    AND invite_status IN ('invite_sent', 'pending')
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Convite não encontrado ou já foi aceito'
        );
    END IF;
    
    -- Check if auth user is already linked to another profile
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE linked_auth_user_id = p_auth_user_id 
        AND id != invite_profile.id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Este email já está vinculado a outra conta'
        );
    END IF;
    
    -- Count assigned accesses (para informação apenas)
    SELECT COUNT(*) INTO funnel_count
    FROM user_funnels WHERE profile_id = invite_profile.id;
    
    SELECT COUNT(*) INTO whatsapp_count
    FROM user_whatsapp_numbers WHERE profile_id = invite_profile.id;
    
    -- Não validar mais acessos obrigatórios - usuários podem ser criados sem acessos
    
    -- Update profile to link with auth user
    UPDATE profiles 
    SET 
        linked_auth_user_id = p_auth_user_id,
        invite_status = 'accepted',
        temp_password = NULL,
        invite_token = NULL
    WHERE id = invite_profile.id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Convite aceito com sucesso',
        'profile_id', invite_profile.id,
        'user_role', invite_profile.role,
        'assigned_funnels', funnel_count,
        'assigned_whatsapp', whatsapp_count
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro interno: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ 3. Triggers para atualizar OWNER_ID automaticamente

-- Trigger para atualizar leads quando vinculação de funil muda
CREATE OR REPLACE FUNCTION update_leads_owner_on_funnel_change()
RETURNS TRIGGER AS $$
DECLARE
    new_owner_id uuid;
BEGIN
    -- Determinar novo owner do funil
    SELECT get_funnel_owner(COALESCE(NEW.funnel_id, OLD.funnel_id)) INTO new_owner_id;
    
    -- Atualizar todos os leads deste funil
    UPDATE leads 
    SET created_by_user_id = new_owner_id
    WHERE funnel_id = COALESCE(NEW.funnel_id, OLD.funnel_id);
    
    RAISE LOG 'Updated leads owner for funnel % to user %', COALESCE(NEW.funnel_id, OLD.funnel_id), new_owner_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar leads quando vinculação de WhatsApp muda
CREATE OR REPLACE FUNCTION update_leads_owner_on_whatsapp_change()
RETURNS TRIGGER AS $$
DECLARE
    new_owner_id uuid;
    whatsapp_id uuid;
BEGIN
    whatsapp_id := COALESCE(NEW.whatsapp_number_id, OLD.whatsapp_number_id);
    
    -- Determinar novo owner da instância WhatsApp
    SELECT get_whatsapp_owner(whatsapp_id) INTO new_owner_id;
    
    -- Atualizar todos os leads desta instância WhatsApp
    UPDATE leads 
    SET created_by_user_id = new_owner_id
    WHERE whatsapp_instance_id = whatsapp_id;
    
    RAISE LOG 'Updated leads owner for WhatsApp % to user %', whatsapp_id, new_owner_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar triggers
DROP TRIGGER IF EXISTS trigger_update_funnel_leads_owner_insert ON user_funnels;
CREATE TRIGGER trigger_update_funnel_leads_owner_insert
    AFTER INSERT ON user_funnels
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_owner_on_funnel_change();

DROP TRIGGER IF EXISTS trigger_update_funnel_leads_owner_delete ON user_funnels;
CREATE TRIGGER trigger_update_funnel_leads_owner_delete
    AFTER DELETE ON user_funnels
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_owner_on_funnel_change();

DROP TRIGGER IF EXISTS trigger_update_whatsapp_leads_owner_insert ON user_whatsapp_numbers;
CREATE TRIGGER trigger_update_whatsapp_leads_owner_insert
    AFTER INSERT ON user_whatsapp_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_owner_on_whatsapp_change();

DROP TRIGGER IF EXISTS trigger_update_whatsapp_leads_owner_delete ON user_whatsapp_numbers;
CREATE TRIGGER trigger_update_whatsapp_leads_owner_delete
    AFTER DELETE ON user_whatsapp_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_owner_on_whatsapp_change();

-- ✅ 4. Grant permissions
GRANT EXECUTE ON FUNCTION accept_team_invite_safely(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_funnel_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_whatsapp_owner(uuid) TO authenticated;

-- ✅ 5. Add helpful comments
COMMENT ON FUNCTION get_funnel_owner(uuid) IS 
'Retorna o owner correto de um funil: usuário atribuído ou criador original';

COMMENT ON FUNCTION get_whatsapp_owner(uuid) IS 
'Retorna o owner correto de uma instância WhatsApp: usuário atribuído ou criador original';

COMMENT ON FUNCTION accept_team_invite_safely(text, uuid) IS 
'Aceita convite de equipe de forma segura, sem validar acessos obrigatórios';

COMMENT ON FUNCTION update_leads_owner_on_funnel_change() IS 
'Atualiza owner_id dos leads quando vinculação de funil muda';

COMMENT ON FUNCTION update_leads_owner_on_whatsapp_change() IS 
'Atualiza owner_id dos leads quando vinculação de WhatsApp muda';