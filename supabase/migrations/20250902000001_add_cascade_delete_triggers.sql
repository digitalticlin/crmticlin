-- Migration: Add CASCADE DELETE triggers for profiles cleanup
-- When a profile is deleted, automatically clean up related data

-- ✅ 1. Add CASCADE DELETE to existing foreign keys
ALTER TABLE user_whatsapp_numbers 
DROP CONSTRAINT IF EXISTS user_whatsapp_numbers_profile_id_fkey,
ADD CONSTRAINT user_whatsapp_numbers_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE user_funnels 
DROP CONSTRAINT IF EXISTS user_funnels_profile_id_fkey,
ADD CONSTRAINT user_funnels_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ✅ Add CASCADE DELETE for funnels created by the user
ALTER TABLE funnels 
DROP CONSTRAINT IF EXISTS funnels_created_by_user_id_fkey,
ADD CONSTRAINT funnels_created_by_user_id_fkey 
FOREIGN KEY (created_by_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ✅ Add CASCADE DELETE for other common tables that reference profiles
-- (These will only apply if the tables/constraints exist)

-- Leads created by user
ALTER TABLE leads 
DROP CONSTRAINT IF EXISTS leads_created_by_user_id_fkey,
ADD CONSTRAINT leads_created_by_user_id_fkey 
FOREIGN KEY (created_by_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- AI Agents created by user  
ALTER TABLE ai_agents
DROP CONSTRAINT IF EXISTS ai_agents_created_by_user_id_fkey,
ADD CONSTRAINT ai_agents_created_by_user_id_fkey 
FOREIGN KEY (created_by_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- AI Agent Prompts created by user
ALTER TABLE ai_agent_prompts
DROP CONSTRAINT IF EXISTS ai_agent_prompts_created_by_user_id_fkey,
ADD CONSTRAINT ai_agent_prompts_created_by_user_id_fkey 
FOREIGN KEY (created_by_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ✅ 2. Create trigger to delete auth.users when profile is deleted
CREATE OR REPLACE FUNCTION cleanup_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion
    RAISE LOG 'Profile deleted: %, email: %, linked_auth_user_id: %', OLD.id, OLD.email, OLD.linked_auth_user_id;
    
    -- Delete from auth.users if linked_auth_user_id exists
    IF OLD.linked_auth_user_id IS NOT NULL THEN
        RAISE LOG 'Deleting auth user: %', OLD.linked_auth_user_id;
        
        -- Delete from auth.users
        DELETE FROM auth.users WHERE id = OLD.linked_auth_user_id;
        
        RAISE LOG 'Auth user deleted successfully: %', OLD.linked_auth_user_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_cleanup_auth_user_on_profile_delete ON profiles;
CREATE TRIGGER trigger_cleanup_auth_user_on_profile_delete
    AFTER DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_auth_user_on_profile_delete();

-- ✅ 3. Create helper function to completely remove a user
CREATE OR REPLACE FUNCTION remove_user_completely(user_email TEXT)
RETURNS JSON AS $$
DECLARE
    profile_record profiles%ROWTYPE;
    result JSON;
BEGIN
    -- Find the profile by email
    SELECT * INTO profile_record FROM profiles WHERE email = user_email LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Profile not found for email: ' || user_email
        );
    END IF;
    
    -- Delete the profile (this will trigger cascade deletes)
    DELETE FROM profiles WHERE id = profile_record.id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'User completely removed',
        'profile_id', profile_record.id,
        'email', user_email,
        'linked_auth_user_id', profile_record.linked_auth_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ 4. Add helpful comments
COMMENT ON FUNCTION cleanup_auth_user_on_profile_delete() IS 
'Trigger function that automatically deletes auth.users when a profile is deleted';

COMMENT ON FUNCTION remove_user_completely(TEXT) IS 
'Helper function to completely remove a user by email (profiles + auth.users + all related data)';

-- ✅ 5. Grant necessary permissions
-- Note: These permissions might need to be adjusted based on your RLS policies
GRANT EXECUTE ON FUNCTION remove_user_completely(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_auth_user_on_profile_delete() TO service_role;

-- ✅ 6. Test query to verify cascade setup
-- This query can be used to test the cascade behavior:
-- SELECT remove_user_completely('test@example.com');