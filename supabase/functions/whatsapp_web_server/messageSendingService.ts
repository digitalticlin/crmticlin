
import { corsHeaders } from './config.ts';
import { VPS_CONFIG, getVPSHeaders } from './config.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Message Sending] 🌐 FASE 2.0 - Tentativa ${attempt}/${retries} - ${options.method} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });
      
      console.log(`[Message Sending] 📊 FASE 2.0 - Status: ${response.status} (tentativa ${attempt})`);
      return response;
      
    } catch (error: any) {
      console.error(`[Message Sending] ❌ FASE 2.0 - Tentativa ${attempt} falhou:`, {
        error: error.message,
        url,
        method: options.method
      });
      
      if (attempt === retries) {
        throw error;
      }
      
      const delay = 1000 * Math.pow(2, attempt - 1);
      console.log(`[Message Sending] ⏳ FASE 2.0 - Aguardando ${delay}ms antes do retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function sendMessage(supabase: any, messageData: any, userId: string) {
  const sendId = `send_${Date.now()}`;
  console.log(`[Message Sending] 📤 FASE 2.0 - Enviando mensagem [${sendId}]:`, {
    instanceId: messageData.instanceId,
    phone: messageData.phone,
    messageLength: messageData.message?.length
  });

  try {
    const { instanceId, phone, message } = messageData;
    
    if (!instanceId || !phone || !message?.trim()) {
      throw new Error('Dados obrigatórios: instanceId, phone, message');
    }

    console.log(`[Message Sending] 🔍 FASE 2.0 - Validando instância: ${instanceId}`);

    // 1. Buscar instância no Supabase
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      console.error(`[Message Sending] ❌ FASE 2.0 - Instância não encontrada:`, instanceError);
      throw new Error('Instância não encontrada ou sem permissão');
    }

    if (!instance.vps_instance_id) {
      throw new Error('Instância não possui vps_instance_id');
    }

    console.log(`[Message Sending] ✅ FASE 2.0 - Instância válida [${sendId}]:`, {
      id: instance.id,
      vpsInstanceId: instance.vps_instance_id,
      connectionStatus: instance.connection_status
    });

    // 2. Enviar mensagem via VPS
    console.log(`[Message Sending] 🌐 FASE 2.0 - Enviando para VPS [${sendId}]:`, {
      vpsInstanceId: instance.vps_instance_id,
      phone: phone.replace(/\D/g, ''),
      messageLength: message.length
    });

    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/send`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({
        instanceId: instance.vps_instance_id,
        phone: phone.replace(/\D/g, ''),
        message: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Message Sending] ❌ FASE 2.0 - VPS retornou erro:`, response.status, errorText);
      throw new Error(`VPS send failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[Message Sending] 📡 FASE 2.0 - Resposta VPS [${sendId}]:`, result);

    if (!result.success) {
      throw new Error(result.error || 'VPS returned success: false');
    }

    // 3. Salvar mensagem no banco (opcional - pode vir via webhook)
    const messageId = result.messageId || `msg_${Date.now()}`;
    console.log(`[Message Sending] 💾 FASE 2.0 - Salvando mensagem enviada [${sendId}]`);

    // Buscar lead pelo telefone
    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .eq('whatsapp_number_id', instanceId)
      .single();

    if (lead) {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          external_id: messageId,
          text: message,
          from_me: true,
          lead_id: lead.id,
          whatsapp_number_id: instanceId,
          status: 'sent',
          timestamp: new Date().toISOString(),
          created_by_user_id: userId
        });

      if (messageError) {
        console.warn(`[Message Sending] ⚠️ FASE 2.0 - Erro ao salvar mensagem:`, messageError);
      } else {
        console.log(`[Message Sending] ✅ FASE 2.0 - Mensagem salva no banco [${sendId}]`);
        
        // Atualizar última mensagem do lead
        await supabase
          .from('leads')
          .update({
            last_message: message,
            last_message_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.id);
      }
    }

    console.log(`[Message Sending] ✅ FASE 2.0 - Mensagem enviada com sucesso [${sendId}]`);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: messageId,
        timestamp: result.timestamp || new Date().toISOString(),
        sendId: sendId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Message Sending] 💥 FASE 2.0 - ERRO CRÍTICO [${sendId}]:`, {
      error: error.message,
      stack: error.stack,
      messageData
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        sendId: sendId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
