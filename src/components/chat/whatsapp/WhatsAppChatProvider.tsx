
import React, { createContext, useContext, useEffect } from "react";
import { useWhatsAppWebChat } from "@/hooks/whatsapp/useWhatsAppWebChat";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useSearchParams } from "react-router-dom";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface WhatsAppChatContextType extends ReturnType<typeof useWhatsAppWebChat> {
  companyLoading: boolean;
}

const WhatsAppChatContext = createContext<WhatsAppChatContextType | null>(null);

export const useWhatsAppChatContext = () => {
  const context = useContext(WhatsAppChatContext);
  if (!context) {
    throw new Error("useWhatsAppChatContext must be used within WhatsAppChatProvider");
  }
  return context;
};

export const WhatsAppChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { companyId, loading: companyLoading } = useCompanyData();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  
  // Get the active WhatsApp Web instance
  const { instances } = useWhatsAppWebInstances(companyId, companyLoading);
  const activeInstance = instances.find(instance => 
    instance.connection_type === 'web' && 
    instance.connection_status === 'connected'
  ) || null;

  const chatData = useWhatsAppWebChat(activeInstance);

  // Auto-selecionar contato quando leadId for fornecido via URL
  useEffect(() => {
    if (leadId && chatData.contacts.length > 0 && !chatData.selectedContact) {
      const targetContact = chatData.contacts.find(contact => contact.id === leadId);
      if (targetContact) {
        console.log('[WhatsApp Chat] Auto-selecionando contato do funil:', targetContact.name);
        chatData.setSelectedContact(targetContact);
      }
    }
  }, [leadId, chatData.contacts, chatData.selectedContact, chatData.setSelectedContact]);

  const value: WhatsAppChatContextType = {
    ...chatData,
    companyLoading
  };

  return (
    <WhatsAppChatContext.Provider value={value}>
      {children}
    </WhatsAppChatContext.Provider>
  );
};
