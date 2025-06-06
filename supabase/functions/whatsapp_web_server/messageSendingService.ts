
import { VPS_CONFIG } from './config.ts';
import { createVPSRequest } from './vpsRequestService.ts';

export async function sendMessage(supabase: any, messageData: any) {
  console.log('[Message Sending] 📤 Enviando mensagem:', messageData);
  
  try {
    const { instanceId, phone, message, mediaUrl, mediaType } = messageData;
    
    if (!instanceId || !phone || !message) {
      throw new Error('instanceId, phone e message são obrigatórios');
    }

    // Verificar se a instância existe no Supabase
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      throw new Error('Instância não encontrada');
    }

    if (!instance.vps_instance_id) {
      throw new Error('Instância não possui VPS instance ID');
    }

    console.log('[Message Sending] 📋 Instância encontrada:', {
      instanceId: instance.id,
      vpsInstanceId: instance.vps_instance_id,
      instanceName: instance.instance_name
    });

    // Preparar payload para VPS
    const vpsPayload = {
      instanceId: instance.vps_instance_id,
      phone: phone,
      message: message
    };

    if (mediaUrl && mediaType) {
      vpsPayload.mediaUrl = mediaUrl;
      vpsPayload.mediaType = mediaType;
    }

    console.log('[Message Sending] 🌐 Enviando para VPS:', vpsPayload);

    // Enviar mensagem via VPS
    const result = await createVPSRequest('/send', 'POST', vpsPayload);

    if (result.success) {
      console.log('[Message Sending] ✅ Mensagem enviada com sucesso:', result.data);
      
      return {
        success: true,
        messageId: result.data.messageId,
        timestamp: result.data.timestamp || new Date().toISOString(),
        instanceId: instanceId
      };
    } else {
      throw new Error(`Falha ao enviar mensagem: ${result.error}`);
    }

  } catch (error: any) {
    console.error('[Message Sending] ❌ Erro ao enviar mensagem:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}
