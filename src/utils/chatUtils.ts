
import { Contact, Message } from "@/types/chat";

// Select a contact and generate dummy messages
export function selectContact(
  contact: Contact, 
  setSelectedContact: (contact: Contact) => void,
  setContactNotes: (notes: string) => void,
  setMessages: (messages: Message[]) => void,
  setContacts: (contacts: Contact[]) => void,
  contacts: Contact[]
) {
  setSelectedContact(contact);
  setContactNotes(contact.notes || "");
  
  // Generate some dummy messages for the selected contact
  const dummyMessages: Message[] = [
    {
      id: "msg1",
      text: "Olá, como posso ajudar você hoje?",
      time: "09:30",
      isIncoming: false,
      sender: "user",
      status: "read",
      fromMe: true
    },
    {
      id: "msg2",
      text: "Estou interessado nos seus serviços. Pode me dar mais informações?",
      time: "09:32",
      isIncoming: true,
      sender: "contact",
      fromMe: false,
      status: "read"
    },
    {
      id: "msg3",
      text: "Claro! Temos vários planos disponíveis. O básico custa R$99/mês e inclui 1000 mensagens.",
      time: "09:34",
      isIncoming: false,
      sender: "user",
      status: "read",
      fromMe: true
    },
    {
      id: "msg4",
      text: "Esse valor cabe no meu orçamento. Como funciona a integração?",
      time: "09:37",
      isIncoming: true,
      sender: "contact",
      fromMe: false,
      status: "read"
    },
    {
      id: "msg5",
      text: "A integração é simples! Depois da contratação, você recebe um link para conectar seu WhatsApp através de um QR Code.",
      time: "09:40",
      isIncoming: false,
      sender: "user",
      status: "delivered",
      fromMe: true
    },
    {
      id: "msg6",
      text: contact.lastMessage || "",
      time: contact.lastMessageTime || "",
      isIncoming: true,
      sender: "contact",
      fromMe: false,
      status: "read"
    },
  ];
  
  setMessages(dummyMessages);
  
  // Mark messages as read
  if (contact.unreadCount) {
    setContacts(contacts.map(c => 
      c.id === contact.id ? { ...c, unreadCount: 0 } : c
    ));
  }
}

// Send a new message
export function sendMessage(
  newMessageText: string,
  selectedContact: Contact | null,
  messages: Message[],
  setMessages: (messages: Message[]) => void,
  setContacts: (contacts: Contact[]) => void,
  contacts: Contact[]
) {
  if (!selectedContact) return;
  
  const newMsg: Message = {
    id: `msg${Date.now()}`,
    text: newMessageText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isIncoming: false,
    sender: "user",
    status: "sent",
    fromMe: true
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
}

// Update contact notes
export function updateContactNotes(
  selectedContact: Contact | null,
  contactNotes: string,
  setContacts: (contacts: Contact[]) => void,
  contacts: Contact[],
  setSelectedContact: (contact: Contact | null) => void
) {
  if (!selectedContact) return;
  
  setContacts(contacts.map(contact =>
    contact.id === selectedContact.id
      ? { ...contact, notes: contactNotes }
      : contact
  ));
  
  // Fix the TypeScript error by updating the contact directly instead of using a callback
  const updatedContact = { ...selectedContact, notes: contactNotes };
  setSelectedContact(updatedContact);
}
