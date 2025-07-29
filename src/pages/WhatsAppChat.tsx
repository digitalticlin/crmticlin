
/**
 * 🎯 PÁGINA PRINCIPAL SIMPLIFICADA
 * 
 * ANTES: Importava Provider complexo
 * DEPOIS: Importa componente direto
 */

import { WhatsAppChatPage } from "@/components/chat/whatsapp/WhatsAppChatPage";

export default function WhatsAppChat() {
  return <WhatsAppChatPage />;
}
