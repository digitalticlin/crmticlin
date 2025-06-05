
export async function processIncomingMessage(supabase: any, instance: any, messageData: any) {
  console.log('[Message Processor] 📨 Processando mensagens:', messageData);
  
  try {
    if (!messageData.messages || !Array.isArray(messageData.messages)) {
      console.log('[Message Processor] ⚠️ Nenhuma mensagem no payload');
      return { success: true, processed: false };
    }

    let processedCount = 0;
    
    for (const message of messageData.messages) {
      try {
        const messageKey = message.key;
        const messageContent = message.message;
        
        if (!messageKey || !messageContent) {
          console.log('[Message Processor] ⚠️ Mensagem sem key ou content');
          continue;
        }

        const fromMe = messageKey.fromMe === true;
        const remoteJid = messageKey.remoteJid;
        const messageId = messageKey.id;
        
        // Extrair número do telefone
        const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
        
        // Extrair texto da mensagem
        let messageText = '';
        if (messageContent.conversation) {
          messageText = messageContent.conversation;
        } else if (messageContent.extendedTextMessage?.text) {
          messageText = messageContent.extendedTextMessage.text;
        } else if (messageContent.imageMessage?.caption) {
          messageText = messageContent.imageMessage.caption;
        }

        if (!messageText) {
          console.log('[Message Processor] ⚠️ Mensagem sem texto');
          continue;
        }

        console.log('[Message Processor] 📝 Processando mensagem:', {
          fromMe,
          phone: phoneNumber,
          text: messageText.substring(0, 50) + '...',
          messageId
        });

        // 1. Verificar se mensagem já existe
        const { data: existingMessage } = await supabase
          .from('messages')
          .select('id')
          .eq('external_id', messageId)
          .eq('whatsapp_number_id', instance.id)
          .single();

        if (existingMessage) {
          console.log('[Message Processor] ⚠️ Mensagem já existe:', messageId);
          continue;
        }

        // 2. Buscar ou criar lead
        const leadId = await getOrCreateLead(supabase, instance.id, phoneNumber, instance.company_id);
        
        // 3. Salvar mensagem
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            whatsapp_number_id: instance.id,
            lead_id: leadId,
            text: messageText,
            from_me: fromMe,
            status: 'delivered',
            external_id: messageId,
            media_type: 'text',
            timestamp: new Date().toISOString()
          });

        if (messageError) {
          console.error('[Message Processor] ❌ Erro ao salvar mensagem:', messageError);
          continue;
        }

        // 4. Atualizar lead com última mensagem
        await supabase
          .from('leads')
          .update({
            last_message: messageText,
            last_message_time: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            unread_count: fromMe ? 0 : supabase.raw('unread_count + 1')
          })
          .eq('id', leadId);

        processedCount++;
        console.log('[Message Processor] ✅ Mensagem salva:', messageId);

      } catch (messageError) {
        console.error('[Message Processor] ❌ Erro ao processar mensagem individual:', messageError);
      }
    }

    console.log(`[Message Processor] ✅ Processamento concluído: ${processedCount} mensagens`);
    
    return {
      success: true,
      processed: processedCount,
      total: messageData.messages.length
    };

  } catch (error) {
    console.error('[Message Processor] ❌ Erro geral:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function getOrCreateLead(supabase: any, whatsappNumberId: string, phone: string, companyId: string): Promise<string> {
  const cleanPhone = phone.replace(/\D/g, '');
  
  console.log('[Message Processor] 🔍 Getting or creating lead:', {
    whatsappNumberId,
    cleanPhone,
    companyId
  });
  
  // Try to find existing lead
  const { data: existingLead } = await supabase
    .from('leads')
    .select('id')
    .eq('phone', cleanPhone)
    .eq('whatsapp_number_id', whatsappNumberId)
    .single();

  if (existingLead) {
    console.log('[Message Processor] ✅ Existing lead found:', existingLead.id);
    return existingLead.id;
  }

  // Create new lead
  console.log('[Message Processor] 🆕 Creating new lead');
  const { data: newLead, error } = await supabase
    .from('leads')
    .insert({
      phone: cleanPhone,
      name: `+${cleanPhone}`,
      whatsapp_number_id: whatsappNumberId,
      company_id: companyId,
      last_message: 'Conversa iniciada',
      last_message_time: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error || !newLead) {
    console.error('[Message Processor] ❌ Failed to create lead:', error);
    throw new Error('Failed to create lead');
  }

  console.log('[Message Processor] ✅ New lead created:', newLead.id);
  return newLead.id;
}
