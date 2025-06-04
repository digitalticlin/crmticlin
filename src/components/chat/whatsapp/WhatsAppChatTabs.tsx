
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppChatLayout } from "./WhatsAppChatLayout";
import { WhatsAppStatusMonitor } from "@/components/whatsapp/WhatsAppStatusMonitor";
import { useWhatsAppChatContext } from "./WhatsAppChatProvider";

export const WhatsAppChatTabs = () => {
  const {
    userEmail,
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages,
    isSending
  } = useWhatsAppChatContext();

  return (
    <div className="h-full flex flex-col relative z-10">
      {/* Header com tabs - usando card transparente padrão */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4 relative z-10">
        <TabsList className="bg-white/20 backdrop-blur-sm border border-white/30 h-12">
          <TabsTrigger 
            value="chat" 
            className="text-gray-700 data-[state=active]:text-gray-900 data-[state=active]:bg-white/80 data-[state=active]:backdrop-blur-sm"
          >
            💬 Chat
          </TabsTrigger>
          <TabsTrigger 
            value="monitor" 
            className="text-gray-700 data-[state=active]:text-gray-900 data-[state=active]:bg-white/80 data-[state=active]:backdrop-blur-sm"
          >
            📊 Monitor
          </TabsTrigger>
        </TabsList>
      </div>
      
      <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TabsContent value="chat" className="flex-1 m-0 overflow-hidden relative z-10">
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
        
        <TabsContent value="monitor" className="flex-1 m-0 p-4 overflow-auto relative z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
            <WhatsAppStatusMonitor userEmail={userEmail} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
