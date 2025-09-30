-- ============================================
-- FIX: Corrigir trigger de limpeza do auth.users
-- Data: 2025-09-27
-- ============================================

-- A tabela profiles usa profiles.id = auth.users.id diretamente
-- Não existe coluna "linked_auth_user_id"

CREATE OR REPLACE FUNCTION cleanup_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion
    RAISE LOG 'Profile deleted: %, email: %', OLD.id, OLD.email;

    -- Delete from auth.users using the profile ID (which is the same as auth.users.id)
    RAISE LOG 'Deleting auth user: %', OLD.id;

    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = OLD.id;

    RAISE LOG 'Auth user deleted successfully: %', OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_cleanup_auth_user_on_profile_delete ON profiles;
CREATE TRIGGER trigger_cleanup_auth_user_on_profile_delete
    AFTER DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_auth_user_on_profile_delete();

-- FIM DA MIGRATION