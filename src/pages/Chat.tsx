
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useWhatsAppChat } from "@/hooks/useWhatsAppChat";
import { useAuth } from "@/contexts/AuthContext";
import { WhatsAppRecoveryPanel } from "@/components/chat/WhatsAppRecoveryPanel";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const Chat = () => {
  const { user } = useAuth();
  const userEmail = user?.email || '';
  
  const {
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages,
    isSending,
    contactNotes,
    setContactNotes,
    updateContactNotes
  } = useWhatsAppChat(userEmail);

  const [showRecovery, setShowRecovery] = useState(false);

  // Mostrar painel de recuperação se não há contatos e não está carregando
  const shouldShowRecovery = !isLoadingContacts && contacts.length === 0;

  if (shouldShowRecovery && !showRecovery) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Alerta sobre problema */}
          <Card className="border-yellow-500 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="font-medium text-yellow-800">Sistema WhatsApp Precisa de Recuperação</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Nenhuma instância WhatsApp foi detectada. Execute a recuperação para restaurar a funcionalidade.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Painel de Recuperação */}
          <WhatsAppRecoveryPanel />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-80px)]">
        <ChatSidebar
          contacts={contacts}
          selectedContact={selectedContact}
          onSelectContact={setSelectedContact}
          isLoading={isLoadingContacts}
        />
        
        <div className="flex-1">
          {selectedContact ? (
            <ChatWindow
              contact={selectedContact}
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoadingMessages}
              isSending={isSending}
              contactNotes={contactNotes}
              onNotesChange={setContactNotes}
              onSaveNotes={updateContactNotes}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um contato
                </h3>
                <p className="text-gray-500">
                  Escolha uma conversa na barra lateral para começar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Chat;
