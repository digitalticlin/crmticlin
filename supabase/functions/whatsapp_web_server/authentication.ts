
export async function authenticateRequest(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    console.error('[Auth] No authorization header provided');
    throw new Error('Authorization header required');
  }

  const token = authHeader.replace('Bearer ', '');
  
  console.log('[Auth] Validating token...', {
    tokenLength: token.length,
    tokenPreview: `${token.substring(0, 20)}...`
  });
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.error('[Auth] Invalid token details:', {
      error: error?.message,
      hasUser: !!user,
      userSub: user?.id || 'missing'
    });
    throw new Error('Invalid authentication token');
  }

  console.log(`[Auth] User authenticated successfully:`, {
    userId: user.id,
    email: user.email
  });
  
  return user;
}
