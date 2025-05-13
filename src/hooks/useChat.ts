
import { useState } from "react";
import { Contact, Message } from "@/types/chat";

export function useChat() {
  // State for contacts list and search
  const [contacts, setContacts] = useState<Contact[]>([
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
  
  // State for selected contact and messages
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // State for messages in the current conversation
  const [messages, setMessages] = useState<Message[]>([]);
  
  // State for contact details drawer
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false);
  
  // State for contact notes
  const [contactNotes, setContactNotes] = useState("");

  return {
    contacts,
    setContacts,
    selectedContact,
    setSelectedContact,
    messages,
    setMessages,
    contactDetailsOpen,
    setContactDetailsOpen,
    contactNotes,
    setContactNotes
  };
}
