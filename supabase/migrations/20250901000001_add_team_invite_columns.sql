-- Add columns for team invitation system
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS invite_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS temp_password text,
ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS linked_auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_invite_status ON profiles(invite_status);
CREATE INDEX IF NOT EXISTS idx_profiles_linked_auth_user_id ON profiles(linked_auth_user_id);

-- Add comment
COMMENT ON COLUMN profiles.invite_status IS 'Status do convite: pending, invite_sent, invite_failed, accepted, active';
COMMENT ON COLUMN profiles.temp_password IS 'Senha temporária até o primeiro login (será removida)';
COMMENT ON COLUMN profiles.linked_auth_user_id IS 'ID do usuário no auth.users quando ele aceita o convite';