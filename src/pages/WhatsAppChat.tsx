
import { useCompanyData } from "@/hooks/useCompanyData";
import { useActiveWhatsAppInstance } from "@/hooks/whatsapp/useActiveWhatsAppInstance";
import { useWhatsAppWebChat } from "@/hooks/whatsapp/useWhatsAppWebChat";
import { WhatsAppChatLayout } from "@/components/chat/whatsapp/WhatsAppChatLayout";
import { LoadingSpinner } from "@/components/ui/spinner";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function WhatsAppChat() {
  const navigate = useNavigate();
  const { companyId, loading: companyLoading } = useCompanyData();
  const { activeInstance, loading: instanceLoading } = useActiveWhatsAppInstance(companyId);
  
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
  if (activeInstance.connection_status !== 'connected') {
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

  // Chat ready
  return (
    <div className="h-screen">
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
    </div>
  );
}
