export async function authenticateUser(req: Request, supabase: any) {
  console.log('[Auth Service] 🔐 Iniciando autenticação...');
  
  const authHeader = req.headers.get('Authorization');
  console.log('[Auth Service] 📋 Authorization header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader) {
    console.error('[Auth Service] ❌ No authorization header');
    return { success: false, error: 'No authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('[Auth Service] 🔑 Token length:', token.length);
  console.log('[Auth Service] 🔑 Token preview:', token.substring(0, 20) + '...');

  const { data: { user }, error } = await supabase.auth.getUser(token);

  console.log('[Auth Service] 👤 User data:', user ? { id: user.id, email: user.email } : 'null');
  console.log('[Auth Service] ❌ Auth error:', error);

  if (error || !user) {
    console.error('[Auth Service] ❌ Invalid token:', error?.message);
    return { success: false, error: `Invalid token: ${error?.message || 'No user found'}` };
  }

  console.log('[Auth Service] ✅ Authentication successful for user:', user.id);
  return { success: true, user };
}
