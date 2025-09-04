-- Migration: Fix team management permissions
-- Add RLS policies for team member management

-- ✅ 1. Policies for user_funnels table
CREATE POLICY "Allow admins to manage funnel assignments" ON user_funnels
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Allow users to view their own funnel assignments" ON user_funnels
FOR SELECT USING (
  profile_id = auth.uid()
);

-- ✅ 2. Policies for user_whatsapp_numbers table  
CREATE POLICY "Allow admins to manage WhatsApp assignments" ON user_whatsapp_numbers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Allow users to view their own WhatsApp assignments" ON user_whatsapp_numbers
FOR SELECT USING (
  profile_id = auth.uid()
);

-- ✅ 3. Ensure RLS is enabled on both tables
ALTER TABLE user_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_whatsapp_numbers ENABLE ROW LEVEL SECURITY;

-- ✅ 4. Additional policies for profile management
CREATE POLICY "Allow admins to create team profiles" ON profiles
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Allow admins to update team profiles" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'manager')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'manager')
  )
);

-- ✅ 5. Allow authenticated users to read funnels and whatsapp instances for assignments
CREATE POLICY "Allow authenticated users to read funnels for assignments" ON funnels
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read whatsapp instances for assignments" ON whatsapp_instances  
FOR SELECT USING (auth.role() = 'authenticated');

-- ✅ 6. Add helpful comments
COMMENT ON POLICY "Allow admins to manage funnel assignments" ON user_funnels IS 
'Permite que admins e managers gerenciem atribuições de funis para membros da equipe';

COMMENT ON POLICY "Allow admins to manage WhatsApp assignments" ON user_whatsapp_numbers IS 
'Permite que admins e managers gerenciem atribuições de instâncias WhatsApp para membros da equipe';

COMMENT ON POLICY "Allow users to view their own funnel assignments" ON user_funnels IS 
'Permite que usuários vejam suas próprias atribuições de funis';

COMMENT ON POLICY "Allow users to view their own WhatsApp assignments" ON user_whatsapp_numbers IS 
'Permite que usuários vejam suas próprias atribuições de WhatsApp';