
import { useCompanyData } from "@/hooks/useCompanyData";
import { useActiveWhatsAppInstance } from "@/hooks/whatsapp/useActiveWhatsAppInstance";
import { useWhatsAppWebChat } from "@/hooks/whatsapp/useWhatsAppWebChat";
import { useWhatsAppRealtime } from "@/hooks/whatsapp/useWhatsAppRealtime";
import { useWhatsAppNotifications } from "@/hooks/whatsapp/useWhatsAppNotifications";
import { WhatsAppChatLayout } from "@/components/chat/whatsapp/WhatsAppChatLayout";
import { WhatsAppStatusMonitor } from "@/components/whatsapp/WhatsAppStatusMonitor";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";

export default function WhatsAppChat() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");
  const { companyId, loading: companyLoading } = useCompanyData();
  const { activeInstance, loading: instanceLoading } = useActiveWhatsAppInstance(companyId);
  
  // Hooks para funcionalidade completa
  const {
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages,
    isSending
  } = useWhatsAppWebChat(activeInstance);

  // Real-time e notificações
  useWhatsAppRealtime(userEmail);
  useWhatsAppNotifications(companyId);

  // Get user email
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  // Loading state mínimo apenas para dados críticos
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

  // Layout principal sempre visível com tabs funcionais
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <ResponsiveSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="chat" className="h-full flex flex-col">
          <div className="bg-white/30 backdrop-blur-xl border-b border-white/30 px-4">
            <TabsList className="bg-transparent border-none h-12">
              <TabsTrigger 
                value="chat" 
                className="text-gray-600 data-[state=active]:text-gray-900 data-[state=active]:bg-white/50"
              >
                💬 Chat
              </TabsTrigger>
              <TabsTrigger 
                value="monitor" 
                className="text-gray-600 data-[state=active]:text-gray-900 data-[state=active]:bg-white/50"
              >
                📊 Monitor
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="chat" className="h-full m-0">
              <WhatsAppChatLayout
                contacts={contacts}
                selectedContact={selectedContact}
                onSelectContact={setSelectedContact}
                messages={messages}
                onSendMessage={sendMessage}
                isLoadingContacts={isLoadingContacts}
                isLoadingMessages={isLoadingMessages}
                isSending={isSending}
              />
            </TabsContent>
            
            <TabsContent value="monitor" className="h-full m-0 p-4 overflow-auto">
              <WhatsAppStatusMonitor userEmail={userEmail} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
