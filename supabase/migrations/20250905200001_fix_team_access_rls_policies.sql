-- Fix RLS policies for team management tables
-- Allow admins to manage team member access assignments

-- ========================================
-- user_whatsapp_numbers table policies
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "user_whatsapp_numbers_policy" ON user_whatsapp_numbers;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_whatsapp_numbers;

-- Admin can manage all WhatsApp assignments
CREATE POLICY "Admin manages all WhatsApp assignments" ON user_whatsapp_numbers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Users can view their own WhatsApp assignments
CREATE POLICY "Users see own WhatsApp assignments" ON user_whatsapp_numbers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = profile_id 
    AND p.linked_auth_user_id = auth.uid()
  )
);

-- ========================================
-- user_funnels table policies  
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "user_funnels_policy" ON user_funnels;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_funnels;

-- Admin can manage all funnel assignments
CREATE POLICY "Admin manages all funnel assignments" ON user_funnels
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.linked_auth_user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Users can view their own funnel assignments
CREATE POLICY "Users see own funnel assignments" ON user_funnels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = profile_id 
    AND p.linked_auth_user_id = auth.uid()
  )
);

-- ========================================
-- Ensure RLS is enabled
-- ========================================

ALTER TABLE user_whatsapp_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_funnels ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Grant necessary permissions
-- ========================================

-- Ensure authenticated users can insert/update/delete when policies allow
GRANT ALL ON user_whatsapp_numbers TO authenticated;
GRANT ALL ON user_funnels TO authenticated;