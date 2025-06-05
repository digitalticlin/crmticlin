
import { corsHeaders, VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function configureWebhookForInstance(instanceId: string) {
  console.log('[Webhook Configuration] 🔧 Configurando webhook para instância:', instanceId);
  
  try {
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp_web_server`;
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/webhook`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({
        instanceId,
        webhookUrl,
        enabled: true
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Webhook Configuration] ✅ Webhook configurado com sucesso:', data);
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: data,
          message: 'Webhook configurado com sucesso'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      console.error('[Webhook Configuration] ❌ VPS webhook config failed:', errorText);
      throw new Error(`VPS webhook config failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('[Webhook Configuration] 💥 Error configuring webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function removeWebhookForInstance(instanceId: string) {
  console.log('[Webhook Configuration] 🗑️ Removendo webhook para instância:', instanceId);
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/webhook`, {
      method: 'DELETE',
      headers: getVPSHeaders(),
      body: JSON.stringify({
        instanceId
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Webhook Configuration] ✅ Webhook removido com sucesso:', data);
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: data,
          message: 'Webhook removido com sucesso'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      console.error('[Webhook Configuration] ❌ VPS webhook removal failed:', errorText);
      throw new Error(`VPS webhook removal failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('[Webhook Configuration] 💥 Error removing webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
