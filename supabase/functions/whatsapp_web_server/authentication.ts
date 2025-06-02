
export async function authenticateRequest(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    console.error('[Auth] No authorization header provided');
    throw new Error('Authorization header required');
  }

  const token = authHeader.replace('Bearer ', '');
  
  console.log('[Auth] Validating token...');
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.error('[Auth] Invalid token:', error?.message);
    throw new Error('Invalid authentication token');
  }

  console.log(`[Auth] User authenticated: ${user.id}`);
  return user;
}
