
import { corsHeaders } from './config.ts';

export async function authenticateUser(req: Request, supabase: any) {
  console.log('[Authentication] 🔐 Iniciando autenticação do usuário...');
  
  try {
    // Obter token de autorização
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Authentication] ❌ Token de autorização ausente ou inválido');
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            success: false,
            error: 'Token de autorização necessário'
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar usuário autenticado
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('[Authentication] ❌ Usuário não autenticado:', error);
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            success: false,
            error: 'Usuário não autenticado'
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      };
    }

    console.log('[Authentication] ✅ Usuário autenticado:', user.id, user.email);
    
    return {
      success: true,
      user
    };
    
  } catch (error: any) {
    console.error('[Authentication] 💥 Erro na autenticação:', error);
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          success: false,
          error: 'Erro na autenticação: ' + error.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    };
  }
}
