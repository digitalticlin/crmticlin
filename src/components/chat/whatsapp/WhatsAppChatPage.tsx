
import { PageLayout } from "@/components/layout/PageLayout";
import { WhatsAppChatContainer } from "./WhatsAppChatContainer";

export function WhatsAppChatPage() {
  console.log('[WhatsAppChatPage] 📄 Página renderizada');
  return (
    <PageLayout>
      <WhatsAppChatContainer />
    </PageLayout>
  );
}
