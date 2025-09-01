import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  console.log('[send_team_invite] Function called with method:', req.method);
  if (req.method === "OPTIONS") {
    console.log('[send_team_invite] Responding to OPTIONS request');
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json();
    console.log('[send_team_invite] Request body:', body);
    const { email, full_name, tempPassword, companyId, inviteToken, companyName = "Ticlin" } = body;
    const inviteUrl = `https://app.ticlin.com.br/invite/${inviteToken}`;
    console.log('[send_team_invite] Sending email with params:', {
      from: "Ticlin IA <app@ticlin.com.br>",
      to: [
        email
      ],
      subject: `Convite para equipe ${companyName}`
    });
    const result = await resend.emails.send({
      from: "Ticlin IA <app@ticlin.com.br>",
      to: [
        email
      ],
      subject: `Convite para equipe ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite para Equipe</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 10px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; font-size: 28px; margin: 0;">🎉 Bem-vindo à equipe!</h1>
            </div>

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0; font-size: 24px;">Olá, ${full_name}!</h2>
              <p style="margin: 0; font-size: 16px; opacity: 0.9;">Você foi convidado para se juntar à equipe <strong>${companyName}</strong> na plataforma Ticlin.</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #2563eb; margin-top: 0;">📋 Suas credenciais de acesso:</h3>
              <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
                <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>🔑 Senha temporária:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></p>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                ✨ ACEITAR CONVITE E ACESSAR PLATAFORMA
              </a>
            </div>
            
            <div style="text-align: center; margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                <strong>Link direto (copie e cole no navegador):</strong><br>
                <span style="font-family: monospace; font-size: 12px; word-break: break-all;">${inviteUrl}</span>
              </p>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>🔐 Segurança:</strong> Por motivos de segurança, será necessário alterar sua senha no primeiro acesso.</p>
            </div>

            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px; text-align: center; color: #6c757d;">
              <p style="margin: 5px 0; font-size: 14px;">Se você não reconhece este convite, pode ignorar este email.</p>
              <p style="margin: 5px 0; font-size: 14px;">
                Atenciosamente,<br>
                <strong>Equipe Ticlin</strong> 🚀
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    console.log('[send_team_invite] Email sent result:', result);
    return new Response(JSON.stringify({
      success: true,
      message: "Email de convite enviado com sucesso",
      result,
      inviteUrl
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (err) {
    console.error('[send_team_invite] Error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
      stack: err.stack
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
