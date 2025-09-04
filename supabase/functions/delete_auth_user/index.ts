import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('[delete_auth_user] 🚀 Function called with method:', req.method)
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('[delete_auth_user] 📋 Request body:', {
      user_id: body.user_id,
      email: body.email
    })

    const { user_id, email } = body

    if (!user_id) {
      throw new Error('user_id é obrigatório')
    }

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('[delete_auth_user] 🗑️ Deletando usuário do Auth:', {
      user_id,
      email: email || 'N/A'
    })

    // Usar Admin API para deletar usuário do Auth
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (error) {
      console.error('[delete_auth_user] ❌ Erro ao deletar usuário:', error)
      // Não falhar se usuário não existe - pode já ter sido deletado
      if (error.message?.includes('User not found')) {
        console.log('[delete_auth_user] ℹ️ Usuário já não existe no Auth - OK')
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Usuário já não existia no Auth',
            user_id: user_id,
            already_deleted: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }
      
      throw new Error(`Erro ao deletar usuário: ${error.message}`)
    }

    console.log('[delete_auth_user] ✅ Usuário deletado do Auth com sucesso:', user_id)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário deletado do Auth com sucesso',
        user_id: user_id,
        email: email || 'N/A',
        deleted_from_auth: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[delete_auth_user] ❌ Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Verifique se SUPABASE_SERVICE_ROLE_KEY está configurada nas variáveis de ambiente'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})