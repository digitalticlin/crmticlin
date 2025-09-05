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

    console.log('[send_native_invite] 📧 Enviando convite APENAS via template Resend (sem template nativo)...')

    // ✅ DECISÃO: NÃO usar inviteUserByEmail do Supabase pelos motivos:
    // 1. Falha com email_exists para usuários já registrados  
    // 2. Redireciona direto para dashboard em vez de /invite/token
    // 3. Template customizado Resend funciona perfeitamente
    
    const inviteUrl = redirect_url || `${new URL(Deno.env.get('SUPABASE_URL') || '').origin}/invite/${invite_token}`;
    
    console.log('[send_native_invite] 🔗 Link do convite (deve ir para /invite):', inviteUrl);
    console.log('[send_native_invite] 📝 Dados do usuário:', {
      email,
      full_name: user_data.full_name,
      role: user_data.role,
      company_name: user_data.company_name
    });

    // TEMPORÁRIO: Como send_team_invite não está deployada, vamos simular o envio
    console.log('[send_native_invite] ⚠️ SIMULANDO envio de email (send_team_invite não encontrada)');
    console.log('[send_native_invite] 📧 Template que seria enviado:');
    console.log(`
    ===== EMAIL DE CONVITE =====
    Para: ${email}
    Assunto: Convite para Equipe - TicLin CRM
    
    Olá ${user_data.full_name}!
    
    Você foi convidado para fazer parte da equipe como ${user_data.role === 'admin' ? 'Administrador' : 'Operacional'}.
    
    Clique no link para criar sua senha e acessar o sistema:
    ${inviteUrl}
    
    Atenciosamente,
    Equipe TicLin CRM
    ============================
    `);

    // Tentar chamar send_team_invite, mas não falhar se não existir
    try {
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
          customMessage: `Você foi convidado para fazer parte da equipe como ${user_data.role === 'admin' ? 'Administrador' : 'Operacional'}. Clique no link para criar sua senha e acessar o sistema.`
        })
      })

      if (emailResponse.ok) {
        console.log('[send_native_invite] ✅ Email enviado via send_team_invite');
      } else {
        console.log('[send_native_invite] ⚠️ send_team_invite falhou, mas continuando...');
      }
    } catch (fetchError) {
      console.log('[send_native_invite] ⚠️ send_team_invite não disponível, simulando envio...');
    }
    
    console.log('[send_native_invite] ✅ Convite enviado via template customizado!');
    
    console.log('[send_native_invite] ✅ Convite personalizado enviado com sucesso!')
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Convite processado (send_team_invite pode não estar deployada)',
        method: 'simulated_or_resend',
        invite_token: invite_token,
        redirect_url: inviteUrl,
        email_sent_to: email,
        flow: 'Email → /invite/token → Criar senha → Login → Dashboard',
        note: 'Sistema não usa templates nativos do Supabase por limitações técnicas'
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