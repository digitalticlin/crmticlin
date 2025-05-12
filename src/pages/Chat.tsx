
import { useState } from "react";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/layout/Sidebar";
import { ContactsList } from "@/components/chat/ContactsList";
import { ChatArea } from "@/components/chat/ChatArea";
import { EmptyState } from "@/components/chat/EmptyState";
import { ContactDetails } from "@/components/chat/ContactDetails";
import { Contact, Message } from "@/types/chat";

export default function Chat() {
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

  // Select a contact and load messages
  const selectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactNotes(contact.notes || "");
    
    // Generate some dummy messages for the selected contact
    const dummyMessages: Message[] = [
      {
        id: "msg1",
        text: "Olá, como posso ajudar você hoje?",
        time: "09:30",
        isIncoming: false,
        status: "read"
      },
      {
        id: "msg2",
        text: "Estou interessado nos seus serviços. Pode me dar mais informações?",
        time: "09:32",
        isIncoming: true
      },
      {
        id: "msg3",
        text: "Claro! Temos vários planos disponíveis. O básico custa R$99/mês e inclui 1000 mensagens.",
        time: "09:34",
        isIncoming: false,
        status: "read"
      },
      {
        id: "msg4",
        text: "Esse valor cabe no meu orçamento. Como funciona a integração?",
        time: "09:37",
        isIncoming: true
      },
      {
        id: "msg5",
        text: "A integração é simples! Depois da contratação, você recebe um link para conectar seu WhatsApp através de um QR Code.",
        time: "09:40",
        isIncoming: false,
        status: "delivered"
      },
      {
        id: "msg6",
        text: contact.lastMessage,
        time: contact.lastMessageTime,
        isIncoming: true
      },
    ];
    
    setMessages(dummyMessages);
    
    // Mark messages as read
    if (contact.unreadCount) {
      setContacts(contacts.map(c => 
        c.id === contact.id ? { ...c, unreadCount: 0 } : c
      ));
    }
  };

  // Send a new message
  const sendMessage = (newMessageText: string) => {
    if (!selectedContact) return;
    
    const newMsg: Message = {
      id: `msg${Date.now()}`,
      text: newMessageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isIncoming: false,
      status: "sent"
    };
    
    setMessages([...messages, newMsg]);
    
    // Update last message in contacts list
    setContacts(contacts.map(contact =>
      contact.id === selectedContact.id
        ? {
            ...contact,
            lastMessage: newMessageText,
            lastMessageTime: "Agora"
          }
        : contact
    ));
  };

  // Update contact notes
  const updateContactNotes = () => {
    if (!selectedContact) return;
    
    setContacts(contacts.map(contact =>
      contact.id === selectedContact.id
        ? { ...contact, notes: contactNotes }
        : contact
    ));
    
    setSelectedContact(prev => prev ? { ...prev, notes: contactNotes } : null);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex h-full overflow-hidden">
        {/* Left: Contacts List */}
        <div className={cn(
          "h-full w-full max-w-sm border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white/10 dark:bg-black/10 backdrop-blur-lg",
          selectedContact ? "hidden md:flex" : "flex"
        )}>
          <ContactsList 
            contacts={contacts} 
            selectedContact={selectedContact} 
            onSelectContact={selectContact} 
          />
        </div>
        
        {/* Right: Chat Area */}
        <div className={cn(
          "h-full flex-1 flex flex-col bg-white/5 dark:bg-black/5 backdrop-blur-lg",
          !selectedContact && "hidden md:flex"
        )}>
          {selectedContact ? (
            <ChatArea 
              selectedContact={selectedContact}
              messages={messages}
              onOpenContactDetails={() => setContactDetailsOpen(true)}
              onBack={() => setSelectedContact(null)}
              onSendMessage={sendMessage}
            />
          ) : (
            <EmptyState />
          )}
        </div>
        
        {/* Contact Details Drawer */}
        {selectedContact && (
          <ContactDetails
            contact={selectedContact}
            isOpen={contactDetailsOpen}
            onOpenChange={setContactDetailsOpen}
            notes={contactNotes}
            onNotesChange={setContactNotes}
            onUpdateNotes={updateContactNotes}
          />
        )}
      </main>
    </div>
  );
}
