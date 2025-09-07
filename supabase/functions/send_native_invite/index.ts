import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('[send_native_invite] 🚀 Function called with method:', req.method)
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('[send_native_invite] 📧 Request body:', body)

    const { 
      email, 
      profile_id, 
      invite_token, 
      user_data, 
      redirect_url 
    } = body

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

    console.log('[send_native_invite] 📧 Enviando convite via template NATIVO do Supabase...')

    // Construir URL do convite que leva para /invite/token
    const inviteUrl = redirect_url || `${new URL(req.url).origin}/invite/${invite_token}`;
    
    console.log('[send_native_invite] 🔗 Link do convite (deve ir para /invite):', inviteUrl);
    console.log('[send_native_invite] 📝 Dados do usuário:', {
      email,
      full_name: user_data.full_name,
      role: user_data.role,
      company_name: user_data.company_name
    });

    // ✅ Usar template NATIVO do Supabase com inviteUserByEmail
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: inviteUrl,
        data: {
          full_name: user_data.full_name,
          role: user_data.role,
          company_name: user_data.company_name || 'TicLin CRM',
          invite_token: invite_token,
          profile_id: profile_id
        }
      }
    )

    if (inviteError) {
      console.error('[send_native_invite] ❌ Erro ao enviar convite nativo:', inviteError);
      
      // Se falhar por email_exists, é porque usuário já tem conta
      if (inviteError.message?.includes('email_exists') || inviteError.message?.includes('already exists')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Este email já possui uma conta no sistema. O usuário deve ser removido primeiro antes de reenviar o convite.',
            error_code: 'email_exists',
            solution: 'Remova o usuário existente do sistema primeiro, depois reenvie o convite.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409,
          }
        )
      }
      
      throw inviteError;
    }

    console.log('[send_native_invite] ✅ Convite nativo enviado com sucesso:', inviteData);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Convite enviado via template nativo do Supabase',
        method: 'supabase_native',
        invite_token: invite_token,
        redirect_url: inviteUrl,
        email_sent_to: email,
        flow: 'Email → /invite/token → Criar senha → Login → Dashboard',
        supabase_user_id: inviteData?.user?.id,
        note: 'Sistema usando template nativo do Supabase'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[send_native_invite] ❌ Error:', error)
    
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