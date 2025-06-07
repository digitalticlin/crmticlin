
import { corsHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';

export async function configureWebhookForInstance(instanceId: string) {
  try {
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`;
    
    const vpsResponse = await makeVPSRequest(`/instance/${instanceId}/webhook`, 'POST', {
      url: webhookUrl,
      events: ['messages.upsert', 'qr.update', 'connection.update']
    });

    return new Response(
      JSON.stringify({
        success: vpsResponse.success,
        message: vpsResponse.success ? 'Webhook configurado com sucesso' : 'Falha ao configurar webhook',
        error: vpsResponse.error
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
