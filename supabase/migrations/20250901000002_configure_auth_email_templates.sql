-- Configure team invite system for Supabase Dashboard-based email templates
-- This migration prepares the database for team invites using Supabase's built-in email system

-- Notification: Email templates are managed via Supabase Dashboard
DO $$ 
BEGIN
    RAISE NOTICE '=== TEAM INVITE SYSTEM CONFIGURATION ===';
    RAISE NOTICE 'Email templates are managed via Supabase Dashboard';
    RAISE NOTICE 'Go to: Authentication > Settings > Email Templates';
    RAISE NOTICE 'Configure "Invite user" template with custom redirect URL';
    RAISE NOTICE 'Recommended redirect URL pattern: {{ .SiteURL }}/invite/{{ .Token }}';
    RAISE NOTICE 'SMTP must be configured in: Authentication > Settings > SMTP';
    RAISE NOTICE '================================================';
END $$;

-- Create function to check team invite setup
CREATE OR REPLACE FUNCTION check_team_invite_setup()
RETURNS TABLE (
  profiles_table_ready boolean,
  invite_columns_exist boolean,
  message text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') as profiles_ready,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'invite_token' AND table_schema = 'public') as invite_cols,
    'Team invite system configured. Configure SMTP in Supabase Dashboard for email sending.' as msg;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION check_team_invite_setup() IS 'Check if team invite system is properly configured';