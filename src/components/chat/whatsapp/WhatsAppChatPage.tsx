
import { PageLayout } from "@/components/layout/PageLayout";
import { WhatsAppChatProvider } from "@/contexts/WhatsAppChatContext";
import { WhatsAppChatContainer } from "./WhatsAppChatContainer";

export function WhatsAppChatPage() {
  return (
    <PageLayout>
      <WhatsAppChatProvider>
        <WhatsAppChatContainer />
      </WhatsAppChatProvider>
    </PageLayout>
  );
}
