import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('[accept_invite] 🚀 Function called with method:', req.method)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[accept_invite] 🔧 Handling CORS preflight')
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    console.log('[accept_invite] ✅ Processing POST request...')
    
    // Parse request body
    const { invite_token, password } = await req.json()
    console.log('[accept_invite] 🎯 Aceitando convite para token:', invite_token)
    
    if (!invite_token || !password) {
      throw new Error('Parâmetros obrigatórios ausentes: invite_token, password')
    }

    // Initialize Supabase client with Service Role (bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Buscar dados do convite
    console.log('[accept_invite] 🔍 Buscando dados do convite...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('invite_token', invite_token)
      .eq('invite_status', 'invite_sent')
      .single()

    if (profileError || !profile) {
      console.error('[accept_invite] ❌ Convite não encontrado:', profileError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Convite não encontrado ou já foi usado'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('[accept_invite] ✅ Convite encontrado:', profile.full_name)

    // 2. Criar usuário no Auth usando o ID do profile (SINCRONIZADO)
    console.log('[accept_invite] 👤 Criando usuário no Auth com profile ID:', profile.id)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      user_id: profile.id, // ✅ CRUCIAL: Usar profile.id como user_id no Auth
      email: profile.email,
      password: password,
      email_confirm: true, // Criar já confirmado
      user_metadata: {
        full_name: profile.full_name,
        role: profile.role,
        is_invite: 'true',
        profile_synced: 'true'
      }
    })

    if (authError || !authUser.user) {
      console.error('[accept_invite] ❌ Erro ao criar usuário no Auth:', authError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao criar conta: ${authError?.message || 'Erro desconhecido'}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('[accept_invite] ✅ Usuário criado no Auth com ID sincronizado:', authUser.user.id)

    // 3. Atualizar status do convite (ID já sincronizado automaticamente)
    console.log('[accept_invite] ✅ Atualizando status do convite...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        invite_status: 'accepted',
        invite_token: null, // Limpar token usado
        temp_password: null
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('[accept_invite] ❌ Erro ao atualizar status:', updateError)
      // Limpar usuário criado se falhar
      await supabase.auth.admin.deleteUser(authUser.user.id)
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao finalizar convite: ${updateError.message}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('[accept_invite] ✅ Convite finalizado! IDs sincronizados: profile.id = auth.user.id =', profile.id)

    // 4. Gerar tokens de sessão para login automático
    console.log('[accept_invite] 🔐 Gerando tokens de sessão...')
    
    // Fazer login para obter tokens válidos
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: password
    })

    if (signInError || !signInData.session) {
      console.error('[accept_invite] ❌ Erro ao fazer login para obter tokens:', signInError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Conta criada, mas erro na sessão. Faça login manualmente.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Convite aceito com sucesso!',
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          full_name: profile.full_name,
          role: profile.role
        },
        auth: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[accept_invite] ❌ Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})