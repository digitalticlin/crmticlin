
import { useState, useCallback, createContext, useContext } from 'react';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';

interface WhatsAppChatContextValue {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
  setSelectedContact: (contact: Contact | null) => void;
  setActiveInstance: (instance: WhatsAppWebInstance | null) => void;
}

const WhatsAppChatContext = createContext<WhatsAppChatContextValue | null>(null);

export const useWhatsAppChatContext = () => {
  const context = useContext(WhatsAppChatContext);
  if (!context) {
    throw new Error('useWhatsAppChatContext must be used within WhatsAppChatProvider');
  }
  return context;
};

// Hook simples para usar sem contexto
export const useWhatsAppChatState = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeInstance, setActiveInstance] = useState<WhatsAppWebInstance | null>(null);

  return {
    selectedContact,
    activeInstance,
    setSelectedContact: useCallback((contact: Contact | null) => {
      setSelectedContact(contact);
    }, []),
    setActiveInstance: useCallback((instance: WhatsAppWebInstance | null) => {
      setActiveInstance(instance);
    }, [])
  };
};
