
import { corsHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';

export async function removeWebhookForInstance(instanceId: string) {
  try {
    const vpsResponse = await makeVPSRequest(`/instance/${instanceId}/webhook`, 'DELETE');

    return new Response(
      JSON.stringify({
        success: vpsResponse.success,
        message: vpsResponse.success ? 'Webhook removido com sucesso' : 'Falha ao remover webhook',
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
