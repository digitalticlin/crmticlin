// deno-lint-ignore-file no-explicit-any
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractTextMessage } from "../utils/helpers.ts";

interface MessagePayload {
  lead_id: string;
  whatsapp_number_id: string;
  from_me: boolean;
  text: string;
  status: string;
  external_id: string;
  timestamp: string;
}

export async function saveMessage(
  supabase: SupabaseClient,
  leadId: string,
  whatsappInstanceId: string,
  messageData: any
): Promise<{ success: boolean; error?: string }> {
  const messageText = extractTextMessage(messageData);
  if (!messageText) {
    return { success: true, error: "Mensagem sem texto para salvar." };
  }

  const fromMe = messageData.key?.fromMe || false;

  const payload: MessagePayload = {
    lead_id: leadId,
    whatsapp_number_id: whatsappInstanceId,
    from_me: fromMe,
    text: messageText,
    status: fromMe ? 'sent' : 'received',
    external_id: messageData.key.id,
    timestamp: new Date( (messageData.messageTimestamp || Math.floor(Date.now()/1000)) * 1000).toISOString(),
  };

  const { error: messageError } = await supabase.from('messages').insert(payload);

  if (messageError) {
    console.error("Erro ao salvar mensagem:", messageError);
    return { success: false, error: "Erro ao salvar mensagem" };
  }
  
  console.log(`Mensagem ${fromMe ? 'OUTGOING' : 'INCOMING'} salva com sucesso para o lead:`, leadId);
  return { success: true };
}
