
import { cleanPhoneNumber } from './phoneService.ts';

export async function processMessages(supabase: any, messages: any[], instance: any) {
  let messagesImported = 0;
  
  if (!messages || !Array.isArray(messages)) {
    console.log(`[Message Service] ℹ️ No messages to process`);
    return messagesImported;
  }

  console.log(`[Message Service] 💬 Processing ${messages.length} messages`);
  
  for (const message of messages) {
    try {
      const phoneNumber = message.from || message.phone || message.remoteJid || '';
      if (!phoneNumber) {
        console.warn(`[Message Service] ⚠️ Message without phone:`, message);
        continue;
      }

      const cleanPhone = cleanPhoneNumber(phoneNumber.replace('@c.us', ''));
      if (!cleanPhone) {
        console.warn(`[Message Service] ⚠️ Invalid phone after cleaning: ${phoneNumber}`);
        continue;
      }

      // Find or create lead
      let leadId: string;
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', cleanPhone)
        .eq('whatsapp_number_id', instance.id)
        .single();

      if (existingLead) {
        leadId = existingLead.id;
      } else {
        // Create new lead
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            phone: cleanPhone,
            name: `Lead-${cleanPhone.substring(cleanPhone.length - 4)}`,
            whatsapp_number_id: instance.id,
            company_id: instance.company_id,
            last_message: 'Imported conversation',
            last_message_time: new Date().toISOString()
          })
          .select('id')
          .single();

        if (leadError || !newLead) {
          console.warn(`[Message Service] ⚠️ Error creating lead for ${cleanPhone}:`, leadError);
          continue;
        }
        leadId = newLead.id;
        console.log(`[Message Service] ✅ Lead created: ${cleanPhone} -> ${leadId}`);
      }

      // Check if message already exists
      const messageId = message.id || message.messageId || `import_${Date.now()}_${Math.random()}`;
      const { data: existingMessage } = await supabase
        .from('messages')
        .select('id')
        .eq('external_id', messageId)
        .single();

      if (!existingMessage) {
        const { error } = await supabase
          .from('messages')
          .insert({
            whatsapp_number_id: instance.id,
            lead_id: leadId,
            text: message.body || message.text || message.message || '',
            from_me: message.fromMe || false,
            status: message.fromMe ? 'sent' : 'received',
            external_id: messageId,
            media_type: message.type || 'text',
            media_url: message.mediaUrl,
            timestamp: message.timestamp || new Date().toISOString()
          });

        if (!error) {
          messagesImported++;
          if (messagesImported % 10 === 0) {
            console.log(`[Message Service] 📊 ${messagesImported} messages processed...`);
          }
        } else {
          console.error(`[Message Service] ❌ Error saving message:`, error);
        }
      }
    } catch (error: any) {
      console.warn(`[Message Service] ⚠️ Error processing message:`, error.message);
    }
  }

  return messagesImported;
}
