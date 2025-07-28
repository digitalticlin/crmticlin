
import React, { useState, useEffect } from 'react';
import { WhatsAppChatProvider, useWhatsAppChat } from '@/components/chat/whatsapp/WhatsAppChatProvider';
import { WhatsAppInstanceSelector } from '@/components/chat/whatsapp/WhatsAppInstanceSelector';
import { WhatsAppContactsList } from '@/components/chat/whatsapp/WhatsAppContactsList';
import { WhatsAppChatArea } from '@/components/chat/whatsapp/WhatsAppChatArea';
import { LeadDetailsSidebar } from '@/components/leads/LeadDetailsSidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu, X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const WhatsAppChatContent = () => {
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const isMobile = useIsMobile();
  
  const {
    instances,
    activeInstance,
    setActiveInstance,
    isLoadingInstances,
    contacts,
    selectedContact,
    setSelectedContact,
    isLoadingContacts,
    hasMoreContacts,
    loadMoreContacts,
    refreshContacts,
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSendingMessage,
    messagesLoaded,
    sendMessage,
    loadMoreMessages,
    refreshMessages,
    loadMessagesOnDemand,
    showContacts,
    toggleContacts
  } = useWhatsAppChat();

  // Auto-select first instance
  useEffect(() => {
    if (instances.length > 0 && !activeInstance) {
      console.log('[WhatsApp Chat] 🔄 Selecionando primeira instância automaticamente');
      setActiveInstance(instances[0]);
    }
  }, [instances, activeInstance, setActiveInstance]);

  const handleEditLead = () => {
    if (selectedContact) {
      setShowLeadDetails(true);
    }
  };

  const handleBackToChat = () => {
    setShowLeadDetails(false);
  };

  const handleBackToContacts = () => {
    setSelectedContact(null);
    if (isMobile) {
      toggleContacts();
    }
  };

  // Wrapper to handle the sendMessage signature correctly
  const handleSendMessage = async (message: string, mediaType?: string, mediaUrl?: string): Promise<boolean> => {
    if (!selectedContact || !activeInstance) {
      return false;
    }

    // Convert old signature to new signature
    const media = mediaType && mediaUrl ? { 
      file: new File([], 'media'), 
      type: mediaType 
    } : undefined;
    
    return await sendMessage(message, media);
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Sidebar de contatos */}
      <div className={cn(
        "flex flex-col border-r border-gray-200 bg-white/80 backdrop-blur-sm transition-all duration-300 ease-in-out",
        isMobile ? (
          showContacts ? "w-full" : "w-0 overflow-hidden"
        ) : "w-80"
      )}>
        {/* Header com seletor de instância */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">WhatsApp Chat</h1>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleContacts}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="mt-3">
            <WhatsAppInstanceSelector
              instances={instances}
              activeInstance={activeInstance}
              onInstanceChange={setActiveInstance}
              isLoading={isLoadingInstances}
            />
          </div>
        </div>

        {/* Lista de contatos */}
        <WhatsAppContactsList
          contacts={contacts}
          selectedContact={selectedContact}
          onSelectContact={setSelectedContact}
          isLoading={isLoadingContacts}
          isLoadingMore={false}
          hasMoreContacts={hasMoreContacts}
          onLoadMoreContacts={loadMoreContacts}
          onRefreshContacts={refreshContacts}
          totalContactsAvailable={contacts.length}
        />
      </div>

      {/* Área principal */}
      <div className="flex-1 flex">
        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col",
          isMobile && showContacts && "hidden"
        )}>
          {selectedContact ? (
            <WhatsAppChatArea
              selectedContact={selectedContact}
              messages={messages}
              onSendMessage={handleSendMessage}
              onBack={handleBackToContacts}
              isLoadingMessages={isLoadingMessages}
              isLoadingMore={isLoadingMore}
              hasMoreMessages={hasMoreMessages}
              onLoadMoreMessages={loadMoreMessages}
              isSending={isSendingMessage}
              onEditLead={handleEditLead}
              onRefreshMessages={refreshMessages}
              leadId={selectedContact.leadId}
              messagesLoaded={messagesLoaded}
              onLoadMessagesOnDemand={loadMessagesOnDemand}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                  <Settings className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Selecione uma conversa
                </h2>
                <p className="text-gray-600">
                  Escolha uma conversa na barra lateral para começar a trocar mensagens
                </p>
                
                {isMobile && (
                  <Button
                    onClick={toggleContacts}
                    variant="outline"
                    className="mt-4"
                  >
                    <Menu className="w-4 h-4 mr-2" />
                    Ver Conversas
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar de detalhes do lead */}
        {showLeadDetails && selectedContact && (
          <div className="w-80 border-l border-gray-200">
            <LeadDetailsSidebar
              leadId={selectedContact.leadId || selectedContact.id}
              onBack={handleBackToChat}
              onClose={handleBackToChat}
            />
          </div>
        )}
      </div>
      
      {/* Botão floating para mobile */}
      {isMobile && selectedContact && !showContacts && (
        <Button
          onClick={toggleContacts}
          className="fixed bottom-20 left-4 h-12 w-12 rounded-full shadow-lg z-50 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

const WhatsAppChat = () => {
  const isMobile = useIsMobile();
  
  return (
    <WhatsAppChatProvider isMobile={isMobile}>
      <WhatsAppChatContent />
    </WhatsAppChatProvider>
  );
};

export default WhatsAppChat;
