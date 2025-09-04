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

    console.log('[send_native_invite] 📧 Enviando convite personalizado sem auth automático...')

    // IMPORTANTE: NÃO usar inviteUserByEmail pois loga automaticamente o usuário
    // Em vez disso, enviar email personalizado que redireciona para criação de senha
    
    // Chamar a função de email personalizado com link para AcceptInvite
    const inviteUrl = `${redirect_url || `${new URL(Deno.env.get('SUPABASE_URL') || '').origin}/invite`}/${invite_token}`;
    
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send_team_invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        full_name: user_data.full_name,
        companyName: user_data.company_name || 'TicLin CRM',
        inviteToken: invite_token,
        inviteUrl: inviteUrl,
        customMessage: `Você foi convidado para fazer parte da equipe como ${user_data.role === 'admin' ? 'Administrador' : user_data.role === 'manager' ? 'Gerente' : 'Operacional'}. Clique no link para criar sua senha e acessar o sistema.`
      })
    })

    if (!emailResponse.ok) {
      console.error('[send_native_invite] ❌ Erro no envio de email personalizado')
      throw new Error('Falha ao enviar convite personalizado')
    }
    
    console.log('[send_native_invite] ✅ Convite personalizado enviado com sucesso!')
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Convite de equipe enviado via email personalizado',
        method: 'custom_email_invite',
        invite_token: invite_token,
        redirect_url,
        email_sent_to: email
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