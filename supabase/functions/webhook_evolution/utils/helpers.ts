
// deno-lint-ignore-file no-explicit-any
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function extractTextMessage(messageData: any): string | null {
  if (!messageData.message) return null;

  if (messageData.message.conversation) {
    return messageData.message.conversation;
  } else if (messageData.message.extendedTextMessage && messageData.message.extendedTextMessage.text) {
    return messageData.message.extendedTextMessage.text;
  } else if (messageData.message.imageMessage && messageData.message.imageMessage.caption) {
    return messageData.message.imageMessage.caption;
  } else if (messageData.message.videoMessage && messageData.message.videoMessage.caption) {
    return messageData.message.videoMessage.caption;
  } else if (messageData.message.documentMessage && messageData.message.documentMessage.caption) {
    return messageData.message.documentMessage.caption;
  } else if (messageData.message.audioMessage) {
    return "[Mensagem de áudio]";
  } else if (messageData.message.contactMessage) {
    return "[Mensagem de contato]";
  } else if (messageData.message.locationMessage) {
    return "[Mensagem de localização]";
  }

  // Fallback para tipos de mensagem não explicitamente tratados, mas que podem ter texto
  const messageContent = messageData.message[Object.keys(messageData.message)[0]];
  if (typeof messageContent === 'object' && messageContent !== null && messageContent.text) {
    return messageContent.text;
  }
  if (typeof messageContent === 'object' && messageContent !== null && messageContent.caption) {
    return messageContent.caption;
  }

  return "[Tipo de mensagem não suportado para extração de texto]";
}
