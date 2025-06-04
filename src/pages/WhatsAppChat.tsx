
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

  // Loading state with full layout
  if (companyLoading || instanceLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <ResponsiveSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Carregando WhatsApp...</p>
          </div>
        </div>
      </div>
    );
  }

  // No active instance with full layout
  if (!activeInstance) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <ResponsiveSidebar />
        <div className="flex-1 flex flex-col">
          <div className="bg-white/30 backdrop-blur-xl border-b border-white/30 px-4">
            <Tabs defaultValue="chat" className="h-full flex flex-col">
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
            </Tabs>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <WhatsAppChatLayout
              contacts={[]}
              selectedContact={null}
              onSelectContact={() => {}}
              messages={[]}
              onSendMessage={() => {}}
              isLoadingContacts={false}
              isLoadingMessages={false}
              isSending={false}
            />
            
            {/* Overlay de estado sem instância */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50/95 to-gray-100/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-sm">
              <div className="text-center max-w-md p-8 bg-white/80 dark:bg-gray-800/80 rounded-3xl border border-white/30 shadow-2xl backdrop-blur-xl">
                <WifiOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-light text-gray-800 dark:text-gray-200 mb-4">WhatsApp não conectado</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Você precisa conectar uma instância do WhatsApp Web para usar o chat.
                </p>
                <Button 
                  onClick={() => navigate('/settings')}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  Conectar WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Instance connected but not ready with full layout
  if (activeInstance.connection_status !== 'open') {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <ResponsiveSidebar />
        <div className="flex-1 flex flex-col">
          <div className="bg-white/30 backdrop-blur-xl border-b border-white/30 px-4">
            <Tabs defaultValue="chat" className="h-full flex flex-col">
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
            </Tabs>
          </div>
          
          <div className="flex-1 overflow-hidden">
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
            
            {/* Overlay de estado conectando */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50/95 to-gray-100/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-sm">
              <div className="text-center max-w-md p-8 bg-white/80 dark:bg-gray-800/80 rounded-3xl border border-white/30 shadow-2xl backdrop-blur-xl">
                <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-light text-gray-800 dark:text-gray-200 mb-4">WhatsApp conectando...</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Status: {activeInstance.connection_status}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Aguarde a conexão ser estabelecida.
                </p>
                <Button 
                  onClick={() => navigate('/settings')}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Verificar Configurações
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat ready with full layout and tabs
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
