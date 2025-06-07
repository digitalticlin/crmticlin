
import { corsHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';

export async function sendMessage(supabase: any, messageData: any) {
  try {
    const { instanceId, to, message, type = 'text' } = messageData;
    
    if (!instanceId || !to || !message) {
      throw new Error('Instance ID, destinatário e mensagem são obrigatórios');
    }

    // Buscar instância
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id')
      .eq('id', instanceId)
      .single();

    if (!instance?.vps_instance_id) {
      throw new Error('Instância não encontrada');
    }

    const vpsResponse = await makeVPSRequest(`/instance/${instance.vps_instance_id}/message`, 'POST', {
      to,
      message,
      type
    });

    return {
      success: vpsResponse.success,
      data: vpsResponse.data,
      error: vpsResponse.error
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getChatHistory(supabase: any, chatData: any) {
  try {
    const { instanceId, chatId, limit = 50 } = chatData;
    
    if (!instanceId || !chatId) {
      throw new Error('Instance ID e Chat ID são obrigatórios');
    }

    // Buscar instância
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id')
      .eq('id', instanceId)
      .single();

    if (!instance?.vps_instance_id) {
      throw new Error('Instância não encontrada');
    }

    const vpsResponse = await makeVPSRequest(`/instance/${instance.vps_instance_id}/chat/${chatId}/messages?limit=${limit}`, 'GET');

    return {
      success: vpsResponse.success,
      messages: vpsResponse.data?.messages || [],
      error: vpsResponse.error
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
