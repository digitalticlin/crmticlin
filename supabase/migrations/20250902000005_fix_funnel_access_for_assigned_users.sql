-- Migration: Fix funnel access for assigned users
-- Allow users to access funnels they created OR funnels assigned to them

-- ✅ 1. Drop the restrictive policy that only allows access to owned funnels
DROP POLICY IF EXISTS "authenticated_users_funnels_access" ON public.funnels;

-- ✅ 2. Create comprehensive policy that allows access to owned AND assigned funnels
CREATE POLICY "users_can_access_owned_or_assigned_funnels" ON public.funnels
FOR SELECT TO authenticated
USING (
  -- User is the original creator of the funnel
  created_by_user_id = auth.uid()
  OR
  -- User has been assigned to this funnel through user_funnels table
  EXISTS (
    SELECT 1 FROM user_funnels uf
    WHERE uf.funnel_id = funnels.id
    AND uf.profile_id = auth.uid()
  )
  OR
  -- User is admin/manager and funnel belongs to their organization (team members)
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'manager')
    AND (
      -- Direct ownership
      created_by_user_id = p.id
      OR
      -- Funnel is assigned to one of their team members
      EXISTS (
        SELECT 1 FROM user_funnels uf2
        JOIN profiles p2 ON uf2.profile_id = p2.id
        WHERE uf2.funnel_id = funnels.id
        AND p2.created_by_user_id = p.id
      )
    )
  )
);

-- ✅ 3. Update/Insert/Delete policies remain restrictive (only for owners)
CREATE POLICY "users_can_modify_owned_funnels" ON public.funnels
FOR ALL TO authenticated
USING (created_by_user_id = auth.uid())
WITH CHECK (created_by_user_id = auth.uid());

-- ✅ 4. Add comments for clarity
COMMENT ON POLICY "users_can_access_owned_or_assigned_funnels" ON public.funnels IS 
'Permite acesso de leitura aos funis que o usuário criou OU que foram atribuídos a ele';

COMMENT ON POLICY "users_can_modify_owned_funnels" ON public.funnels IS 
'Permite modificar apenas os funis que o usuário criou (não os atribuídos)';

-- ✅ 5. Ensure RLS is enabled
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;