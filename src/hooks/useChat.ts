
import { useState, useEffect } from "react";
import { useWhatsAppChat } from "./useWhatsAppChat";
import { Contact, Message } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

export function useChat() {
  // State for contacts list and search
  const [dummyContacts] = useState<Contact[]>([
    {
      id: "1",
      name: "João Silva",
      avatar: "",
      lastMessage: "Vamos confirmar aquela reunião de amanhã?",
      lastMessageTime: "10:45",
      unreadCount: 3,
      isOnline: true,
      phone: "+55 11 98765-4321",
      email: "joao.silva@email.com",
      tags: ["Cliente VIP", "Proposta Enviada"],
      notes: "Cliente interessado no plano premium. Agendar demonstração.",
    },
    {
      id: "2",
      name: "Maria Oliveira",
      avatar: "",
      lastMessage: "Obrigada pelas informações!",
      lastMessageTime: "Ontem",
      phone: "+55 11 91234-5678",
    },
    {
      id: "3",
      name: "Pedro Almeida",
      avatar: "",
      lastMessage: "O produto chegou, está tudo certo. Grato!",
      lastMessageTime: "Seg",
      phone: "+55 11 97777-8888",
    },
    {
      id: "4",
      name: "Ana Santos",
      avatar: "",
      lastMessage: "Por favor, me envie o catálogo atualizado",
      lastMessageTime: "25/04",
      unreadCount: 1,
      isOnline: true,
      phone: "+55 11 96666-5555",
    },
    {
      id: "5",
      name: "Carlos Mendes",
      avatar: "",
      lastMessage: "Vamos agendar para a próxima semana?",
      lastMessageTime: "20/04",
      phone: "+55 11 95555-4444",
    },
  ]);
  
  // State for user email
  const [userEmail, setUserEmail] = useState<string>("");
  
  // State for contact details drawer
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false);
  
  // State for contact notes
  const [contactNotes, setContactNotes] = useState("");
  
  // WhatsApp chat integration
  const {
    contacts: whatsappContacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages
  } = useWhatsAppChat(userEmail);
  
  // Combine WhatsApp contacts with dummy contacts if needed
  const contacts = whatsappContacts.length > 0 ? whatsappContacts : dummyContacts;
  
  // Load user email on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
      }
    };
    
    getUser();
  }, []);

  // Load contact notes when a contact is selected
  useEffect(() => {
    const loadContactNotes = async () => {
      if (selectedContact) {
        try {
          const { data: lead } = await supabase
            .from('leads')
            .select('notes')
            .eq('id', selectedContact.id)
            .single();
            
          if (lead) {
            setContactNotes(lead.notes || "");
          }
        } catch (error) {
          console.error("Error loading contact notes:", error);
        }
      }
    };
    
    loadContactNotes();
  }, [selectedContact]);
  
  // Handler for updating contact notes
  const handleUpdateContactNotes = async () => {
    if (!selectedContact) return;
    
    try {
      await supabase
        .from('leads')
        .update({ notes: contactNotes })
        .eq('id', selectedContact.id);
        
      // Update the selected contact object
      setSelectedContact({
        ...selectedContact,
        notes: contactNotes
      });
    } catch (error) {
      console.error("Error updating contact notes:", error);
    }
  };
  
  // Handler for sending a message
  const handleSendMessage = (text: string) => {
    if (!selectedContact) return;
    sendMessage(text);
  };

  return {
    contacts,
    setContacts: () => {}, // No need to set contacts manually anymore
    selectedContact,
    setSelectedContact,
    messages,
    contactDetailsOpen,
    setContactDetailsOpen,
    contactNotes,
    setContactNotes,
    updateContactNotes: handleUpdateContactNotes,
    sendMessage: handleSendMessage,
    isLoadingContacts,
    isLoadingMessages
  };
}
