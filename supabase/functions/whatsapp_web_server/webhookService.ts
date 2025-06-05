
import { corsHeaders } from './config.ts';

export async function processIncomingWebhook(supabase: any, webhookData: any) {
  console.log('[Webhook Service] 📨 Processing incoming webhook:', webhookData);
  
  try {
    const { instanceName, data: messageData, event } = webhookData;
    
    if (!instanceName) {
      throw new Error('instanceName não fornecido no webhook');
    }

    // Buscar instância pelo vps_instance_id
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select(`
        *,
        companies!whatsapp_instances_company_id_fkey (
          id,
          name
        )
      `)
      .eq('vps_instance_id', instanceName)
      .eq('connection_type', 'web')
      .maybeSingle();

    if (instanceError || !instance) {
      console.error('[Webhook Service] ❌ Instância não encontrada:', instanceName);
      
      // CORREÇÃO: Tentar buscar por instance_name como fallback
      const { data: fallbackInstance, error: fallbackError } = await supabase
        .from('whatsapp_instances')
        .select(`
          *,
          companies!whatsapp_instances_company_id_fkey (
            id,
            name
          )
        `)
        .eq('instance_name', instanceName)
        .eq('connection_type', 'web')
        .maybeSingle();

      if (fallbackError || !fallbackInstance) {
        console.error('[Webhook Service] ❌ Instância não encontrada nem por VPS ID nem por nome:', instanceName);
        return { success: false, error: 'Instância não encontrada', instanceName };
      }
      
      instance = fallbackInstance;
      console.log('[Webhook Service] ✅ Instância encontrada via fallback (nome):', instance.instance_name);
    }

    console.log('[Webhook Service] ✅ Instância encontrada:', {
      id: instance.id,
      company: instance.companies?.name,
      company_id: instance.company_id
    });

    // Processar mensagem baseado no evento
    if (event === 'messages.upsert' && messageData.messages) {
      return await processIncomingMessage(supabase, instance, messageData);
    }

    // Processar mudanças de status da conexão
    if (event === 'connection.update') {
      return await processConnectionUpdate(supabase, instance, messageData);
    }

    return { success: true, processed: false };

  } catch (error) {
    console.error('[Webhook Service] ❌ Erro no processamento:', error);
    return { success: false, error: error.message };
  }
}

async function processIncomingMessage(supabase: any, instance: any, messageData: any) {
  console.log('[Webhook Service] 📨 Processando mensagem recebida');
  
  try {
    const message = messageData.messages?.[0];
    if (!message || message.key?.fromMe) {
      return { success: true, processed: false };
    }

    const fromNumber = message.key?.remoteJid?.replace('@s.whatsapp.net', '');
    const messageText = message.message?.conversation || 
                       message.message?.extendedTextMessage?.text || 
                       '[Mídia]';
    
    console.log('[Webhook Service] 👤 De:', fromNumber, '| Empresa:', instance.companies?.name);
    console.log('[Webhook Service] 💬 Mensagem:', messageText);

    // Buscar ou criar lead
    let { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', fromNumber)
      .eq('whatsapp_number_id', instance.id)
      .eq('company_id', instance.company_id)
      .maybeSingle();

    if (leadError || !lead) {
      console.log('[Webhook Service] 👤 Criando novo lead');
      
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          phone: fromNumber,
          name: fromNumber,
          whatsapp_number_id: instance.id,
          company_id: instance.company_id,
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: 1
        })
        .select()
        .single();

      if (createError) {
        console.error('[Webhook Service] ❌ Erro ao criar lead:', createError);
        return { success: false, error: createError.message };
      }
      
      lead = newLead;
      console.log('[Webhook Service] ✅ Lead criado:', lead.id);
    } else {
      // Atualizar lead existente
      await supabase
        .from('leads')
        .update({
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: (lead.unread_count || 0) + 1
        })
        .eq('id', lead.id);
      
      console.log('[Webhook Service] ✅ Lead atualizado:', lead.id);
    }

    // Salvar mensagem
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        lead_id: lead.id,
        whatsapp_number_id: instance.id,
        text: messageText,
        from_me: false,
        timestamp: new Date().toISOString(),
        external_id: message.key?.id,
        status: 'received'
      });

    if (messageError) {
      console.error('[Webhook Service] ❌ Erro ao salvar mensagem:', messageError);
      return { success: false, error: messageError.message };
    }

    console.log('[Webhook Service] ✅ Mensagem salva');
    return { success: true, processed: true, leadId: lead.id };

  } catch (error) {
    console.error('[Webhook Service] ❌ Erro ao processar mensagem:', error);
    return { success: false, error: error.message };
  }
}

async function processConnectionUpdate(supabase: any, instance: any, connectionData: any) {
  console.log('[Webhook Service] 🔌 Processando atualização de conexão');
  
  try {
    const { connection, lastDisconnect } = connectionData;
    
    // Atualizar status da instância
    const updateData: any = {
      connection_status: connection?.state || 'unknown',
      updated_at: new Date().toISOString()
    };

    if (connection?.state === 'open') {
      updateData.date_connected = new Date().toISOString();
      updateData.web_status = 'connected';
    } else if (connection?.state === 'close') {
      updateData.date_disconnected = new Date().toISOString();
      updateData.web_status = 'disconnected';
    }

    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', instance.id);

    if (updateError) {
      console.error('[Webhook Service] ❌ Erro ao atualizar status:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('[Webhook Service] ✅ Status atualizado:', updateData);
    return { success: true, processed: true };

  } catch (error) {
    console.error('[Webhook Service] ❌ Erro ao processar conexão:', error);
    return { success: false, error: error.message };
  }
}
