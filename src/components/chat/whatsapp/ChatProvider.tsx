
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Contact, Message } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';

interface ChatContextType {
  contacts: Contact[];
  selectedContact: Contact | null;
  messages: Message[];
  isLoading: boolean;
  setSelectedContact: (contact: Contact | null) => void;
  refreshContacts: () => Promise<void>;
  refreshMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshContacts = async () => {
    // Implementation would fetch contacts from your API/database
    setIsLoading(true);
    try {
      // Your contacts fetching logic here
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMessages = async () => {
    if (!selectedContact) return;
    
    setIsLoading(true);
    try {
      // Your messages fetching logic here
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshContacts();
    }
  }, [user]);

  useEffect(() => {
    if (selectedContact) {
      refreshMessages();
    }
  }, [selectedContact]);

  const value: ChatContextType = {
    contacts,
    selectedContact,
    messages,
    isLoading,
    setSelectedContact,
    refreshContacts,
    refreshMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
