
import { useState } from "react";
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { WhatsAppContactsList } from "./WhatsAppContactsList";
import { WhatsAppChatArea } from "./WhatsAppChatArea";
import { WhatsAppEmptyState } from "./WhatsAppEmptyState";
import { LeadDetailsSidebar } from "./LeadDetailsSidebar";
import { Contact, Message } from "@/types/chat";
import { useWhatsAppContacts } from "@/hooks/whatsapp/useWhatsAppContacts";

interface WhatsAppChatLayoutProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  messages: Message[];
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  isLoadingContacts: boolean;
  isLoadingMoreContacts: boolean;
  hasMoreContacts: boolean;
  onLoadMoreContacts: () => Promise<void>;
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  onLoadMoreMessages: () => Promise<void>;
  isSending: boolean;
  onRefreshMessages?: () => void;
  onRefreshContacts?: () => void;
  totalContactsAvailable?: number;
}

export const WhatsAppChatLayout = ({
  contacts,
  selectedContact,
  onSelectContact,
  messages,
  onSendMessage,
  isLoadingContacts,
  isLoadingMoreContacts,
  hasMoreContacts,
  onLoadMoreContacts,
  isLoadingMessages,
  isLoadingMore,
  hasMoreMessages,
  onLoadMoreMessages,
  isSending,
  onRefreshMessages,
  onRefreshContacts,
  totalContactsAvailable = 0
}: WhatsAppChatLayoutProps) => {
  const [isDetailsSidebarOpen, setIsDetailsSidebarOpen] = useState(false);

  // ✅ CORREÇÃO: Atualizar contato completo e propagação para lista
  const handleUpdateContact = (updatedContact: Contact) => {
    console.log('[WhatsAppChatLayout] 🔄 Atualizando contato selecionado:', {
      contactId: updatedContact.id,
      changes: {
        name: updatedContact.name,
        email: updatedContact.email,
        company: updatedContact.company,
        purchaseValue: updatedContact.purchaseValue,
        assignedUser: updatedContact.assignedUser
      }
    });

    // ✅ ATUALIZAR: Contato selecionado
    onSelectContact(updatedContact);

    // ✅ PROPAGAR: Atualização para a lista de contatos via evento customizado
    if (updatedContact.leadId || updatedContact.id) {
      window.dispatchEvent(new CustomEvent('leadUpdated', {
        detail: {
          leadId: updatedContact.leadId || updatedContact.id,
          updatedContact
        }
      }));
      
      console.log('[WhatsAppChatLayout] 📡 Evento de atualização de lead disparado');
    }
  };

  const handleEditLead = () => {
    setIsDetailsSidebarOpen(true);
  };

  return (
    <div className="h-full flex overflow-hidden relative z-10">
      {/* Container principal com max-width de 1200px */}
      <div className="w-full max-w-[1200px] mx-auto flex overflow-hidden relative">
        {/* Mobile layout - comportamento atual */}
        <div className="lg:hidden w-full">
          {!selectedContact ? (
            <div className="w-full flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg relative z-10">
              <WhatsAppContactsList
                contacts={contacts}
                selectedContact={selectedContact}
                onSelectContact={onSelectContact}
                isLoading={isLoadingContacts}
                isLoadingMore={isLoadingMoreContacts}
                hasMoreContacts={hasMoreContacts}
                onLoadMoreContacts={onLoadMoreContacts}
                onRefreshContacts={onRefreshContacts}
                totalContactsAvailable={totalContactsAvailable}
              />
            </div>
          ) : (
            <div className="w-full flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg overflow-hidden relative z-10">
              <WhatsAppChatArea
                selectedContact={selectedContact}
                messages={messages}
                onSendMessage={onSendMessage}
                onBack={() => onSelectContact(null)}
                isLoadingMessages={isLoadingMessages}
                isLoadingMore={isLoadingMore}
                hasMoreMessages={hasMoreMessages}
                onLoadMoreMessages={onLoadMoreMessages}
                isSending={isSending}
                onEditLead={handleEditLead}
                onRefreshMessages={onRefreshMessages}
              />
            </div>
          )}
        </div>

        {/* Desktop layout - com redimensionamento e ajuste para sidebar */}
        <div className={cn(
          "hidden lg:flex w-full relative transition-all duration-300",
          isDetailsSidebarOpen && "mr-80"
        )}>
          <ResizablePanelGroup 
            direction="horizontal" 
            className="w-full relative z-20"
          >
            {/* Painel da Lista de Conversas */}
            <ResizablePanel 
              defaultSize={30} 
              minSize={20} 
              maxSize={50}
              className="relative"
            >
              <div className="h-full flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg relative z-10">
                <WhatsAppContactsList
                  contacts={contacts}
                  selectedContact={selectedContact}
                  onSelectContact={onSelectContact}
                  isLoading={isLoadingContacts}
                  isLoadingMore={isLoadingMoreContacts}
                  hasMoreContacts={hasMoreContacts}
                  onLoadMoreContacts={onLoadMoreContacts}
                  onRefreshContacts={onRefreshContacts}
                  totalContactsAvailable={totalContactsAvailable}
                />
              </div>
            </ResizablePanel>

            {/* Handle para redimensionar - SEM ícone */}
            <ResizableHandle 
              withHandle={false}
              className="w-1 bg-transparent hover:bg-white/10 transition-colors duration-200 rounded-full border-0 relative group"
            />

            {/* Painel da Área de Chat */}
            <ResizablePanel 
              defaultSize={70} 
              minSize={50}
              className="relative"
            >
              <div className="h-full flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg overflow-hidden relative z-10">
                {selectedContact ? (
                  <WhatsAppChatArea
                    selectedContact={selectedContact}
                    messages={messages}
                    onSendMessage={onSendMessage}
                    onBack={() => onSelectContact(null)}
                    isLoadingMessages={isLoadingMessages}
                    isLoadingMore={isLoadingMore}
                    hasMoreMessages={hasMoreMessages}
                    onLoadMoreMessages={onLoadMoreMessages}
                    isSending={isSending}
                    onEditLead={handleEditLead}
                    onRefreshMessages={onRefreshMessages}
                    leadId={selectedContact.id}
                  />
                ) : (
                  <WhatsAppEmptyState />
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Sidebar de Detalhes do Lead - posicionada corretamente */}
        <LeadDetailsSidebar
          selectedContact={selectedContact}
          isOpen={isDetailsSidebarOpen}
          onClose={() => setIsDetailsSidebarOpen(false)}
          onUpdateContact={handleUpdateContact}
        />
      </div>
    </div>
  );
};
