import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  console.log('[send_resend_invite] 🚀 Function called with method:', req.method)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[send_resend_invite] 🔧 Handling CORS preflight')
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    console.log('[send_resend_invite] ✅ Processing POST request...')
    
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY não configurado')
    }

    // Parse request body
    const { email, profile_id, invite_token, user_data, redirect_url, is_resend } = await req.json()
    console.log('[send_resend_invite] 📧 Enviando convite para:', email)
    
    if (!email || !profile_id || !invite_token) {
      throw new Error('Parâmetros obrigatórios ausentes: email, profile_id, invite_token')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Verificar se é REENVIO ou NOVO convite
    if (!is_resend) {
      // NOVO CONVITE: Verificar se email já existe no Auth
      console.log('[send_resend_invite] 📧 NOVO convite - verificando se email já existe no Auth...')
      const { data: existingAuthUsers, error: authCheckError } = await supabase.auth.admin.listUsers()
      
      if (authCheckError) {
        console.error('[send_resend_invite] ❌ Erro ao verificar Auth:', authCheckError)
      } else {
        const emailExists = existingAuthUsers.users.some(user => user.email === email)
        if (emailExists) {
          console.log('[send_resend_invite] ❌ Email já existe no Auth:', email)
          return new Response(
            JSON.stringify({
              success: false,
              error: `Email ${email} já está registrado no sistema`,
              error_code: 'email_exists'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }
      }
    } else {
      console.log('[send_resend_invite] 🔄 REENVIO detectado - pulando verificação do Auth')
    }

    // 2. Verificar se profile já existe
    console.log('[send_resend_invite] 🔍 Verificando se profile já existe...')
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .neq('id', profile_id) // Excluir o profile atual sendo criado
      .maybeSingle()

    if (profileCheckError) {
      console.error('[send_resend_invite] ❌ Erro ao verificar profile:', profileCheckError)
    } else if (existingProfile) {
      console.log('[send_resend_invite] ❌ Profile já existe:', email)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Profile com email ${email} já existe`,
          error_code: 'profile_exists'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // 3. Criar template HTML bonito
    const emailHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite para equipe - Ticlin CRM</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', Arial, sans-serif;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 20px;
            line-height: 1.6;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            animation: slideUp 0.8s ease-out;
        }
        
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .header {
            background: linear-gradient(135deg, #D3D800 0%, #16A34A 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(20px, -20px) rotate(120deg); }
            66% { transform: translate(-10px, 10px) rotate(240deg); }
        }
        
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            position: relative;
            z-index: 2;
            animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .header h1 {
            color: white;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
            z-index: 2;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header p {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            font-weight: 400;
            position: relative;
            z-index: 2;
        }
        
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        
        .welcome-text {
            font-size: 18px;
            color: #374151;
            margin-bottom: 30px;
            font-weight: 500;
        }
        
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #D3D800 0%, #16A34A 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 10px 25px -5px rgba(211, 216, 0, 0.3);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        
        .btn:hover::before {
            left: 100%;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 35px -5px rgba(211, 216, 0, 0.4);
        }
        
        .security-note {
            background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
            border-radius: 16px;
            padding: 20px;
            margin: 30px 0;
            border-left: 4px solid #D3D800;
        }
        
        .security-note p {
            color: #6B7280;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .footer {
            background: #F9FAFB;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
        }
        
        .footer p {
            color: #9CA3AF;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .social-links {
            margin-top: 20px;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #9CA3AF;
            text-decoration: none;
            font-size: 14px;
            transition: color 0.3s ease;
        }
        
        .social-links a:hover {
            color: #D3D800;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://tcsojzlstguclfcmhqff.supabase.co/storage/v1/object/public/assets/lovable-uploads/ae7ddc52-d3ed-478f-af96-603a69278f3b.png" alt="Ticlin CRM" class="logo">
            <h1>🎉 Você foi convidado!</h1>
            <p>Junte-se à equipe no Ticlin CRM</p>
        </div>
        
        <div class="content">
            <p class="welcome-text">
                Olá <strong>${user_data.full_name}</strong>! 👋<br>
                Você foi convidado para fazer parte da equipe <strong>${user_data.company_name}</strong> no Ticlin CRM como <strong>${user_data.role.toUpperCase()}</strong>.
            </p>
            
            <a href="${redirect_url}" class="btn">
                ✨ Aceitar convite e criar senha
            </a>
            
            <div class="security-note">
                <p><strong>🔒 Segurança em primeiro lugar:</strong></p>
                <p>Este link é único e válido por 7 dias. Se você não esperava este convite, pode ignorar este e-mail com segurança.</p>
                <p><strong>Email:</strong> ${email}</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Ticlin CRM</strong> - Seu CRM inteligente</p>
            <p>Transformando relacionamentos em resultados desde 2024</p>
            <div class="social-links">
                <a href="#">Suporte</a> | 
                <a href="#">Política de Privacidade</a> | 
                <a href="#">Termos de Uso</a>
            </div>
        </div>
    </div>
</body>
</html>`

    // 4. Enviar email via Resend
    console.log('[send_resend_invite] 📤 Enviando email via Resend...')
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ticlin CRM <app@ticlin.com.br>',
        to: [email],
        subject: `🎉 Convite para equipe - ${user_data.company_name}`,
        html: emailHTML,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text()
      console.error('[send_resend_invite] ❌ Erro do Resend:', errorData)
      throw new Error(`Erro do Resend: ${resendResponse.status} - ${errorData}`)
    }

    const resendResult = await resendResponse.json()
    console.log('[send_resend_invite] ✅ Email enviado com sucesso:', resendResult.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Convite enviado com sucesso para ${email}`,
        email_id: resendResult.id,
        redirect_url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[send_resend_invite] ❌ Error:', error)
    
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