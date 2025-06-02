
import { useCompanyData } from "@/hooks/useCompanyData";
import { useActiveWhatsAppInstance } from "@/hooks/whatsapp/useActiveWhatsAppInstance";
import { useWhatsAppWebChat } from "@/hooks/whatsapp/useWhatsAppWebChat";
import { useWhatsAppRealtime } from "@/hooks/whatsapp/useWhatsAppRealtime";
import { useWhatsAppNotifications } from "@/hooks/whatsapp/useWhatsAppNotifications";
import { WhatsAppChatLayout } from "@/components/chat/whatsapp/WhatsAppChatLayout";
import { WhatsAppStatusMonitor } from "@/components/whatsapp/WhatsAppStatusMonitor";
import { LoadingSpinner } from "@/components/ui/spinner";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

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

  // Loading state
  if (companyLoading || instanceLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#111b21]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-[#8696a0]">Carregando WhatsApp...</p>
        </div>
      </div>
    );
  }

  // No active instance
  if (!activeInstance) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#111b21]">
        <div className="text-center max-w-md p-8">
          <WifiOff className="h-16 w-16 text-[#8696a0] mx-auto mb-4" />
          <h2 className="text-2xl font-light text-[#e9edef] mb-4">WhatsApp não conectado</h2>
          <p className="text-[#8696a0] mb-6">
            Você precisa conectar uma instância do WhatsApp Web para usar o chat.
          </p>
          <Button 
            onClick={() => navigate('/settings')}
            className="bg-[#00a884] hover:bg-[#008f72] text-white"
          >
            <Wifi className="h-4 w-4 mr-2" />
            Conectar WhatsApp
          </Button>
        </div>
      </div>
    );
  }

  // Instance connected but not ready
  if (activeInstance.connection_status !== 'open') {
    return (
      <div className="h-screen flex items-center justify-center bg-[#111b21]">
        <div className="text-center max-w-md p-8">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-light text-[#e9edef] mb-4">WhatsApp conectando...</h2>
          <p className="text-[#8696a0] mb-2">
            Status: {activeInstance.connection_status}
          </p>
          <p className="text-[#8696a0] mb-6">
            Aguarde a conexão ser estabelecida.
          </p>
          <Button 
            onClick={() => navigate('/settings')}
            variant="outline"
            className="border-[#313d45] text-[#e9edef] hover:bg-[#2a3942]"
          >
            Verificar Configurações
          </Button>
        </div>
      </div>
    );
  }

  // Chat ready with tabs
  return (
    <div className="h-screen bg-[#111b21]">
      <Tabs defaultValue="chat" className="h-full flex flex-col">
        <div className="bg-[#202c33] border-b border-[#313d45] px-4">
          <TabsList className="bg-transparent border-none h-12">
            <TabsTrigger 
              value="chat" 
              className="text-[#8696a0] data-[state=active]:text-[#e9edef] data-[state=active]:bg-[#2a3942]"
            >
              💬 Chat
            </TabsTrigger>
            <TabsTrigger 
              value="monitor" 
              className="text-[#8696a0] data-[state=active]:text-[#e9edef] data-[state=active]:bg-[#2a3942]"
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
  );
}
