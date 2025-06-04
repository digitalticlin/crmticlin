
import { LoadingSpinner } from "@/components/ui/spinner";
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";
import { WhatsAppChatTabs } from "./WhatsAppChatTabs";
import { WhatsAppChatProvider, useWhatsAppChatContext } from "./WhatsAppChatProvider";

const WhatsAppChatContent = () => {
  const { companyLoading } = useWhatsAppChatContext();

  if (companyLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <ResponsiveSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <ResponsiveSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <WhatsAppChatTabs />
      </div>
    </div>
  );
};

export const WhatsAppChatPage = () => {
  return (
    <WhatsAppChatProvider>
      <WhatsAppChatContent />
    </WhatsAppChatProvider>
  );
};
