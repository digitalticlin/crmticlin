
import React, { createContext, useContext, useEffect } from "react";
import { useWhatsAppWebChat } from "@/hooks/whatsapp/useWhatsAppWebChat";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useSearchParams } from "react-router-dom";

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
  const { user } = useAuthContext();
  const { companyId, isLoading: companyLoading } = useCompanyData();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  
  const chatData = useWhatsAppWebChat(user?.email || '');

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
