-- Fix RLS policy to allow public access to invite data by token
-- This is needed for the AcceptInvite component to work for non-authenticated users

-- Add policy to allow public read access when using invite_token
CREATE POLICY "Allow public access to invite data by token" ON profiles
FOR SELECT USING (
  invite_token IS NOT NULL  -- Only if has invite token
  AND invite_status IN ('pending', 'invite_sent')  -- Only pending invites
);

-- Also fix the type mismatch: invite_token should be text, not uuid
-- The frontend generates string tokens, but DB expects UUID
ALTER TABLE profiles ALTER COLUMN invite_token TYPE text;