import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useActiveWhatsAppInstance } from "@/hooks/whatsapp/useActiveWhatsAppInstance";
import { useWhatsAppWebChat } from "@/hooks/whatsapp/useWhatsAppWebChat";
import { useWhatsAppRealtime } from "@/hooks/whatsapp/useWhatsAppRealtime";
import { useWhatsAppNotifications } from "@/hooks/whatsapp/useWhatsAppNotifications";

interface WhatsAppChatContextType {
  userEmail: string;
  companyId: string | null;
  companyLoading: boolean;
  activeInstance: any;
  instanceLoading: boolean;
  contacts: any[];
  selectedContact: any;
  setSelectedContact: (contact: any) => void;
  messages: any[];
  sendMessage: (message: string) => void;
  isLoadingContacts: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
}

const WhatsAppChatContext = React.createContext<WhatsAppChatContextType | null>(null);

export const useWhatsAppChatContext = () => {
  const context = React.useContext(WhatsAppChatContext);
  if (!context) {
    throw new Error('useWhatsAppChatContext must be used within WhatsAppChatProvider');
  }
  return context;
};

interface WhatsAppChatProviderProps {
  children: React.ReactNode;
}

export const WhatsAppChatProvider = ({ children }: WhatsAppChatProviderProps) => {
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

  const contextValue = {
    userEmail,
    companyId,
    companyLoading,
    activeInstance,
    instanceLoading,
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages,
    isSending
  };

  return (
    <WhatsAppChatContext.Provider value={contextValue}>
      {children}
    </WhatsAppChatContext.Provider>
  );
};
