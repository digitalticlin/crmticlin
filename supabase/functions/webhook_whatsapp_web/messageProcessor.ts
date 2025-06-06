import { WebhookData } from './types.ts';

export async function processIncomingMessage(supabase: any, instance: any, messageData: any) {
  console.log('[Message Processor] 📨 Processando mensagem:', messageData);
  
  try {
    const messages = messageData.messages;

    if (!messages || messages.length === 0) {
      console.warn('[Message Processor] ⚠️ Nenhuma mensagem para processar');
      return {
        success: true,
        processed: false,
        message: 'Nenhuma mensagem para processar'
      };
    }

    const firstMessage = messages[0];
    const remoteJid = firstMessage.key.remoteJid;
    const fromMe = firstMessage.key.fromMe;
    const messageId = firstMessage.key.id;
    const conversation = firstMessage.message?.conversation || firstMessage.message?.extendedTextMessage?.text || 'Sem texto';

    console.log('[Message Processor] ℹ️ Detalhes da mensagem:', {
      remoteJid,
      fromMe,
      messageId,
      conversation: conversation.substring(0, 50) + '...'
    });
    
    return {
      success: true,
      processed: true
    };
  } catch (error) {
    console.error('[Message Processor] ❌ Erro:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
