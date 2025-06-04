
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
  );
};
