
import { findInstanceV2 } from './instanceServiceV2.ts';
import { processQRUpdateV3 } from './qrProcessorV3.ts';
import { processIncomingMessage } from './messageProcessor.ts';
import { processConnectionUpdate } from './connectionProcessor.ts';

export async function handleWebhookV2(supabase: any, webhookData: any) {
  console.log('[Webhook Handler V2] 📨 PROCESSANDO WEBHOOK V2 COM CORREÇÕES');
  
  const { instanceName, data: messageData, event } = webhookData;
  
  if (!instanceName) {
    console.error('[Webhook Handler V2] ❌ instanceName not provided');
    return {
      success: false,
      error: 'instanceName not provided'
    };
  }

  // CORREÇÃO: Usar findInstanceV2 que busca por vps_instance_id
  const instance = await findInstanceV2(supabase, instanceName);
  if (!instance) {
    console.error('[Webhook Handler V2] ❌ Instância não encontrada:', instanceName);
    return {
      success: false, 
      error: 'Instance not found', 
      instanceName
    };
  }

  console.log('[Webhook Handler V2] ✅ Instância encontrada:', {
    id: instance.id,
    name: instance.instance_name,
    vpsInstanceId: instance.vps_instance_id
  });

  // CORREÇÃO: Processar QR.UPDATE com processador V3 (normalização + status correto)
  if (event === 'qr.update') {
    console.log('[Webhook Handler V2] 📱 Processando QR.UPDATE com processador V3');
    const result = await processQRUpdateV3(supabase, instance, messageData);
    return result;
  }

  // Manter compatibilidade com outros eventos
  if (event === 'messages.upsert' && messageData.messages) {
    const result = await processIncomingMessage(supabase, instance, messageData);
    return result;
  }

  if (event === 'connection.update') {
    const result = await processConnectionUpdate(supabase, instance, messageData);
    return result;
  }

  console.log('[Webhook Handler V2] ℹ️ Event not processed:', event);
  return { success: true, processed: false, event };
}
