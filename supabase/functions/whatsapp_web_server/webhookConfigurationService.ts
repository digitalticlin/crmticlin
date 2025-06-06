
import { corsHeaders, VPS_CONFIG } from './config.ts';
import { createVPSRequest } from './vpsRequestService.ts';

export async function configureWebhookForInstance(instanceId: string) {
  console.log('[Webhook Config] 🔧 Configurando webhook para instância:', instanceId);
  
  try {
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    const webhookPayload = {
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
      events: ['messages.upsert', 'qr.update', 'connection.update']
    };

    console.log('[Webhook Config] 📡 Configurando webhook:', webhookPayload);

    // Configurar webhook na VPS
    const result = await createVPSRequest(`/instance/${instanceId}/webhook`, 'POST', webhookPayload);

    if (result.success) {
      console.log('[Webhook Config] ✅ Webhook configurado com sucesso');
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook configurado com sucesso',
          instanceId: instanceId,
          webhookUrl: webhookPayload.webhookUrl,
          events: webhookPayload.events
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(`Falha ao configurar webhook: ${result.error}`);
    }

  } catch (error: any) {
    console.error('[Webhook Config] ❌ Erro ao configurar webhook:', error);
    
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

export async function removeWebhookForInstance(instanceId: string) {
  console.log('[Webhook Remove] 🗑️ Removendo webhook para instância:', instanceId);
  
  try {
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    // Remover webhook da VPS (configurar com URL vazia)
    const webhookPayload = {
      webhookUrl: '',
      events: []
    };

    const result = await createVPSRequest(`/instance/${instanceId}/webhook`, 'POST', webhookPayload);

    if (result.success) {
      console.log('[Webhook Remove] ✅ Webhook removido com sucesso');
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook removido com sucesso',
          instanceId: instanceId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(`Falha ao remover webhook: ${result.error}`);
    }

  } catch (error: any) {
    console.error('[Webhook Remove] ❌ Erro ao remover webhook:', error);
    
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
