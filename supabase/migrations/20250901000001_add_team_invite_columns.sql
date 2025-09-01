-- Remove foreign key constraint from profiles.id to allow temporary profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add columns for team invitation system
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS invite_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS temp_password text,
ADD COLUMN IF NOT EXISTS invite_token text UNIQUE,
ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS linked_auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_invite_status ON profiles(invite_status);
CREATE INDEX IF NOT EXISTS idx_profiles_invite_token ON profiles(invite_token);
CREATE INDEX IF NOT EXISTS idx_profiles_linked_auth_user_id ON profiles(linked_auth_user_id);

-- Add security policies for team management
CREATE POLICY "Prevent admin creation by non-admin" ON profiles
FOR INSERT WITH CHECK (
  CASE 
    WHEN role = 'admin' THEN 
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
      )
    ELSE true
  END
);

CREATE POLICY "Allow access to own invite data" ON profiles
FOR SELECT USING (
  auth.uid() = id OR 
  auth.uid() = created_by_user_id OR
  auth.uid() = linked_auth_user_id
);

-- Add comment
COMMENT ON COLUMN profiles.invite_status IS 'Status do convite: pending, invite_sent, invite_failed, accepted, active';
COMMENT ON COLUMN profiles.temp_password IS 'Senha temporária até o primeiro login (será removida)';
COMMENT ON COLUMN profiles.invite_token IS 'Token único para validar e aceitar convite';
COMMENT ON COLUMN profiles.linked_auth_user_id IS 'ID do usuário no auth.users quando ele aceita o convite';