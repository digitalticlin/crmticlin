-- 🔧 FIX: Correção da função com erro de sintaxe
-- Erro: "current_role" é palavra reservada no PostgreSQL

DROP FUNCTION IF EXISTS test_auth_context_detailed();

CREATE OR REPLACE FUNCTION test_auth_context_detailed()
RETURNS TABLE (
    test_name text,
    auth_uid_result uuid,
    user_role text,  -- ✅ Mudança: current_role → user_role
    profile_found boolean,
    leads_visible bigint,
    status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_exists boolean;
    visible_leads bigint;
BEGIN
    -- Verificar se auth.uid() funciona
    SELECT EXISTS(
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
    ) INTO profile_exists;
    
    -- Contar leads visíveis
    SELECT count(*) FROM leads INTO visible_leads;
    
    RETURN QUERY
    SELECT 
        'Context Test'::text as test_name,
        auth.uid() as auth_uid_result,
        current_setting('role')::text as user_role,  -- ✅ Corrigido
        profile_exists as profile_found,
        visible_leads as leads_visible,
        CASE 
            WHEN auth.uid() IS NULL THEN 'AUTH CONTEXT BROKEN'
            WHEN visible_leads > 1000 THEN 'RLS NOT WORKING - TOO MANY LEADS'
            WHEN visible_leads < 100 THEN 'RLS WORKING - FILTERED'
            ELSE 'UNKNOWN STATE'
        END::text as status;
END;
$$;

COMMENT ON FUNCTION test_auth_context_detailed() IS 'Diagnóstico completo do contexto de autenticação e RLS';