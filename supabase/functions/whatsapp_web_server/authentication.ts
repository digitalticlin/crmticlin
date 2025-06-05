
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function authenticateRequest(req: Request, supabase: any) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    throw new Error('Authorization header missing');
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('[Auth] Validating token...', { tokenLength: token.length, tokenPreview: `${token.substring(0, 20)}...` });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('[Auth] Authentication failed:', error);
    throw new Error('Invalid authentication token');
  }

  console.log('[Auth] User authenticated successfully:', {
    userId: user.id,
    email: user.email
  });

  return user;
}
