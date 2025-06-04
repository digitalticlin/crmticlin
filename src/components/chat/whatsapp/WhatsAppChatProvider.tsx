
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useActiveWhatsAppInstance } from "@/hooks/whatsapp/useActiveWhatsAppInstance";
import { useWhatsAppWebChat } from "@/hooks/whatsapp/useWhatsAppWebChat";
import { useWhatsAppRealtime } from "@/hooks/whatsapp/useWhatsAppRealtime";
import { useWhatsAppNotifications } from "@/hooks/whatsapp/useWhatsAppNotifications";
import { Contact, Message } from "@/types/chat";

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

// Dados fake para demonstração
const FAKE_CONTACTS: Contact[] = [
  {
    id: "1",
    name: "Maria Silva",
    phone: "+55 11 99999-9999",
    email: "maria@email.com",
    company: "Tech Solutions",
    lastMessage: "Obrigada pelo atendimento! Quando posso esperar o retorno?",
    lastMessageTime: "14:32",
    unreadCount: 2,
    isOnline: true,
    avatar: ""
  },
  {
    id: "2", 
    name: "João Santos",
    phone: "+55 11 88888-8888",
    email: "joao@empresa.com",
    company: "Startup Inc",
    lastMessage: "Perfeito! Vou aguardar o contrato por email.",
    lastMessageTime: "13:45",
    unreadCount: 0,
    isOnline: false,
    avatar: ""
  },
  {
    id: "3",
    name: "Ana Costa",
    phone: "+55 11 77777-7777", 
    email: "ana@negocio.com",
    company: "Digital Agency",
    lastMessage: "Olá! Gostaria de saber mais sobre os planos disponíveis.",
    lastMessageTime: "12:15",
    unreadCount: 1,
    isOnline: true,
    avatar: ""
  }
];

const FAKE_MESSAGES: { [key: string]: Message[] } = {
  "1": [
    {
      id: "m1",
      text: "Olá! Gostaria de saber mais informações sobre seus serviços.",
      sender: "contact",
      time: "14:20",
      status: "read",
      isIncoming: true,
      fromMe: false
    },
    {
      id: "m2", 
      text: "Olá Maria! Claro, ficarei feliz em ajudar. Qual tipo de serviço você está procurando?",
      sender: "user",
      time: "14:22",
      status: "read", 
      isIncoming: false,
      fromMe: true
    },
    {
      id: "m3",
      text: "Estou interessada em soluções de automação para minha empresa. Vocês trabalham com integração de sistemas?",
      sender: "contact",
      time: "14:25",
      status: "read",
      isIncoming: true,
      fromMe: false
    },
    {
      id: "m4",
      text: "Sim! Trabalhamos com várias soluções de automação e integração. Posso agendar uma reunião para entendermos melhor suas necessidades?",
      sender: "user", 
      time: "14:28",
      status: "read",
      isIncoming: false,
      fromMe: true
    },
    {
      id: "m5",
      text: "Obrigada pelo atendimento! Quando posso esperar o retorno?",
      sender: "contact",
      time: "14:32",
      status: "delivered",
      isIncoming: true,
      fromMe: false
    }
  ],
  "2": [
    {
      id: "m6",
      text: "Boa tarde! Vi vocês nas redes sociais e gostei muito do trabalho.",
      sender: "contact",
      time: "13:30",
      status: "read",
      isIncoming: true,
      fromMe: false
    },
    {
      id: "m7",
      text: "Boa tarde João! Muito obrigado pelo feedback. Em que posso ajudá-lo?",
      sender: "user",
      time: "13:32",
      status: "read",
      isIncoming: false,
      fromMe: true
    },
    {
      id: "m8",
      text: "Preciso de um sistema para gerenciar minha startup. Algo que integre vendas, atendimento e relatórios.",
      sender: "contact",
      time: "13:35",
      status: "read",
      isIncoming: true,
      fromMe: false
    },
    {
      id: "m9",
      text: "Perfeito! Temos uma solução completa que atende exatamente essas necessidades. Vou enviar uma proposta por email.",
      sender: "user",
      time: "13:40",
      status: "read",
      isIncoming: false,
      fromMe: true
    },
    {
      id: "m10",
      text: "Perfeito! Vou aguardar o contrato por email.",
      sender: "contact",
      time: "13:45",
      status: "read",
      isIncoming: true,
      fromMe: false
    }
  ],
  "3": [
    {
      id: "m11",
      text: "Olá! Gostaria de saber mais sobre os planos disponíveis.",
      sender: "contact",
      time: "12:15",
      status: "sent",
      isIncoming: true,
      fromMe: false
    }
  ]
};

export const WhatsAppChatProvider = ({ children }: WhatsAppChatProviderProps) => {
  const [userEmail, setUserEmail] = useState<string>("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const { companyId, loading: companyLoading } = useCompanyData();
  const { activeInstance, loading: instanceLoading } = useActiveWhatsAppInstance(companyId);

  // Real-time e notificações (mantidos para funcionalidade futura)
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

  // Função para enviar mensagem fake
  const sendMessage = async (text: string) => {
    if (!selectedContact || !text.trim()) return false;
    
    setIsSending(true);
    
    // Simular envio de mensagem
    setTimeout(() => {
      setIsSending(false);
      
      // Adicionar mensagem fake à lista
      const newMessage: Message = {
        id: `m${Date.now()}`,
        text: text.trim(),
        sender: "user",
        time: new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: "sent",
        isIncoming: false,
        fromMe: true
      };
      
      if (!FAKE_MESSAGES[selectedContact.id]) {
        FAKE_MESSAGES[selectedContact.id] = [];
      }
      FAKE_MESSAGES[selectedContact.id].push(newMessage);
    }, 1000);
    
    return true;
  };

  const contextValue = {
    userEmail,
    companyId,
    companyLoading,
    activeInstance,
    instanceLoading,
    contacts: FAKE_CONTACTS,
    selectedContact,
    setSelectedContact,
    messages: selectedContact ? FAKE_MESSAGES[selectedContact.id] || [] : [],
    sendMessage,
    isLoadingContacts: false,
    isLoadingMessages: false,
    isSending
  };

  return (
    <WhatsAppChatContext.Provider value={contextValue}>
      {children}
    </WhatsAppChatContext.Provider>
  );
};
