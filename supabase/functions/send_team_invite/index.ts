
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// TODO: Definir chave de API Resend como secret no projeto
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  full_name: string;
  tempPassword: string;
  companyId: string;
}
serve(async (req) => {
  console.log('[send_team_invite] Function called with method:', req.method);
  
  if (req.method === "OPTIONS") {
    console.log('[send_team_invite] Responding to OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body = await req.json();
    console.log('[send_team_invite] Request body:', body);
    
    const { email, full_name, tempPassword, companyId }: InviteRequest = body;

    console.log('[send_team_invite] Sending email with params:', {
      from: "Ticlin <onboarding@resend.dev>",
      to: [email],
      subject: "Bem-vindo à sua equipe Ticlin"
    });

    const result = await resend.emails.send({
      from: "Ticlin <onboarding@resend.dev>",
      to: [email],
      subject: "Bem-vindo à sua equipe Ticlin",
      html: `
        <h2>Bem-vindo, ${full_name}!</h2>
        <p>Você foi convidado para se juntar à equipe Ticlin.</p>
        <p>Use as credenciais abaixo para acessar a plataforma:</p>
        <ul>
          <li><b>Email:</b> ${email}</li>
          <li><b>Senha (provisória):</b> ${tempPassword}</li>
        </ul>
        <p>Por motivos de segurança, será necessário alterar sua senha ao acessar pela primeira vez.</p>
        <p>Se não reconhece este convite, ignore este email.</p>
        <p>Atenciosamente,<br/>Equipe Ticlin</p>
      `,
    });
    
    console.log('[send_team_invite] Email sent result:', result);

    return new Response(
      JSON.stringify({ message: "Email de convite enviado", result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error('[send_team_invite] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
