
import { cleanPhoneNumber } from './phoneService.ts';

export async function processMessages(supabase: any, messages: any[], instance: any) {
  let messagesImported = 0;
  
  if (!messages || !Array.isArray(messages)) {
    console.log(`[Message Service] ℹ️ No messages to process`);
    return messagesImported;
  }

  console.log(`[Message Service] 💬 Processing ${messages.length} messages`);
  
  // Processar mensagens em lotes para melhor performance
  const batchSize = 25;
  
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    console.log(`[Message Service] 📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(messages.length / batchSize)}`);
    
    for (const message of batch) {
      try {
        // Extrair telefone da mensagem
        const rawPhone = message.from || message.remoteJid || '';
        const cleanPhone = cleanPhoneNumber(rawPhone);
        
        if (!cleanPhone) {
          console.warn(`[Message Service] ⚠️ Message without valid phone:`, message);
          continue;
        }

        // Buscar ou criar lead
        let leadId = await findOrCreateLead(supabase, cleanPhone, instance);
        
        if (!leadId) {
          console.warn(`[Message Service] ⚠️ Could not find/create lead for:`, cleanPhone);
          continue;
        }

        // Preparar dados da mensagem
        const messageData = {
          lead_id: leadId,
          whatsapp_number_id: instance.id,
          text: message.body || message.text || '',
          from_me: message.fromMe || false,
          timestamp: message.timestamp ? new Date(message.timestamp * 1000).toISOString() : new Date().toISOString(),
          created_by_user_id: instance.created_by_user_id, // 🔥 CRÍTICO: Vincular ao criador da instância
          media_type: getMediaType(message),
          media_url: message.mediaUrl || null
        };

        // Verificar se mensagem já existe (evitar duplicatas)
        const { data: existingMessage } = await supabase
          .from('messages')
          .select('id')
          .eq('lead_id', leadId)
          .eq('text', messageData.text)
          .eq('timestamp', messageData.timestamp)
          .maybeSingle();

        if (!existingMessage) {
          const { error } = await supabase
            .from('messages')
            .insert(messageData);

          if (!error) {
            messagesImported++;
            console.log(`[Message Service] ✅ Message saved for: ${cleanPhone}`);
          } else {
            console.error(`[Message Service] ❌ Error saving message:`, error);
          }
        } else {
          console.log(`[Message Service] ℹ️ Message already exists`);
        }
      } catch (error: any) {
        console.warn(`[Message Service] ⚠️ Error processing message:`, error.message);
      }
    }

    // Pequena pausa entre lotes
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`[Message Service] ✅ Messages processed: ${messagesImported}/${messages.length}`);
  return messagesImported;
}

async function findOrCreateLead(supabase: any, phone: string, instance: any) {
  try {
    // Buscar lead existente
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .eq('whatsapp_number_id', instance.id)
      .maybeSingle();

    if (existingLead) {
      return existingLead.id;
    }

    // Criar novo lead
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        phone,
        name: `Contato +${phone}`,
        whatsapp_number_id: instance.id,
        created_by_user_id: instance.created_by_user_id, // 🔥 CRÍTICO: Vincular ao criador da instância
        last_message: 'Imported contact',
        last_message_time: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[Message Service] ❌ Error creating lead:`, error);
      return null;
    }

    console.log(`[Message Service] ✅ Lead created: ${phone}`);
    return newLead.id;
  } catch (error: any) {
    console.error(`[Message Service] ❌ Error in findOrCreateLead:`, error.message);
    return null;
  }
}

function getMediaType(message: any): string {
  if (message.type === 'image' || message.messageType === 'imageMessage') return 'image';
  if (message.type === 'video' || message.messageType === 'videoMessage') return 'video';
  if (message.type === 'audio' || message.messageType === 'audioMessage') return 'audio';
  if (message.type === 'document' || message.messageType === 'documentMessage') return 'document';
  return 'text';
}
