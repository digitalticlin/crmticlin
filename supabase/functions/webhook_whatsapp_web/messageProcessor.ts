
import { WhatsAppInstance, MessageData } from './types.ts';

export async function processIncomingMessage(supabase: any, instance: WhatsAppInstance, messageData: MessageData) {
  console.log('[Message Processor] 📨 Processing incoming message');
  
  try {
    const message = messageData.messages?.[0];
    if (!message) {
      console.log('[Message Processor] ⏭️ No message found');
      return {
        success: true,
        processed: false,
        reason: 'no_message'
      };
    }

    // NOVA VERIFICAÇÃO: Bloquear mensagens de grupos
    const remoteJid = message.key?.remoteJid;
    if (remoteJid?.includes('@g.us')) {
      console.log('[Message Processor] 🚫 Group message ignored:', remoteJid);
      return {
        success: true,
        processed: false,
        reason: 'group_message_blocked'
      };
    }

    const fromNumber = message.key?.remoteJid?.replace('@s.whatsapp.net', '');
    const messageText = message.message?.conversation || 
                       message.message?.extendedTextMessage?.text || 
                       '[Mídia]';
    
    const isFromMe = message.key?.fromMe || false;
    
    console.log('[Message Processor] 👤 From:', fromNumber, '| Company:', instance.companies?.name);
    console.log('[Message Processor] 💬 Message:', messageText);
    console.log('[Message Processor] 📤 From me:', isFromMe);

    // Buscar ou criar lead
    let { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', fromNumber)
      .eq('whatsapp_number_id', instance.id)
      .eq('company_id', instance.company_id)
      .maybeSingle();

    if (leadError || !lead) {
      console.log('[Message Processor] 👤 Creating new lead');
      
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          phone: fromNumber,
          name: fromNumber,
          whatsapp_number_id: instance.id,
          company_id: instance.company_id,
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: isFromMe ? 0 : 1
        })
        .select()
        .single();

      if (createError) {
        console.error('[Message Processor] ❌ Error creating lead:', createError);
        throw createError;
      }
      
      lead = newLead;
      console.log('[Message Processor] ✅ Lead created:', lead.id);
    } else {
      // Atualizar lead existente - CORRIGIDO: Apenas incrementar unread se não for mensagem enviada por mim
      await supabase
        .from('leads')
        .update({
          last_message: messageText,
          last_message_time: new Date().toISOString(),
          unread_count: isFromMe ? lead.unread_count : (lead.unread_count || 0) + 1
        })
        .eq('id', lead.id);
      
      console.log('[Message Processor] ✅ Lead updated:', lead.id);
    }

    // CORREÇÃO CRÍTICA: Verificar se mensagem já existe antes de salvar
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('external_id', message.key?.id)
      .eq('whatsapp_number_id', instance.id)
      .maybeSingle();

    if (existingMessage) {
      console.log('[Message Processor] ⏭️ Message already exists, skipping:', message.key?.id);
      return {
        success: true,
        processed: false,
        reason: 'message_already_exists'
      };
    }

    // CORRIGIDO: Salvar TODAS as mensagens (enviadas e recebidas) do app nativo
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        lead_id: lead.id,
        whatsapp_number_id: instance.id,
        text: messageText,
        from_me: isFromMe,
        timestamp: new Date().toISOString(),
        external_id: message.key?.id,
        status: isFromMe ? 'sent' : 'received'
      });

    if (messageError) {
      console.error('[Message Processor] ❌ Error saving message:', messageError);
      console.error('[Message Processor] ❌ Message details that failed:', {
        lead_id: lead.id,
        whatsapp_number_id: instance.id,
        from_me: isFromMe,
        text: messageText.substring(0, 50),
        external_id: message.key?.id
      });
      throw messageError;
    }

    console.log('[Message Processor] ✅ Message saved:', { 
      fromMe: isFromMe, 
      text: messageText.substring(0, 50) + '...',
      external_id: message.key?.id
    });
    
    return {
      success: true,
      processed: true,
      leadId: lead.id,
      fromMe: isFromMe,
      company: instance.companies?.name
    };

  } catch (error) {
    console.error('[Message Processor] ❌ Error processing message:', error);
    throw error;
  }
}
