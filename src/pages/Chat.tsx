
import { useState } from "react";
import { 
  Search, 
  MoreVertical, 
  Smile, 
  Paperclip, 
  Send, 
  ArrowLeft,
  Phone,
  Video,
  User,
  Image,
  File,
  Mic,
  MessageSquare
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// Types
interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isOnline?: boolean;
  phone: string;
  email?: string;
  address?: string;
  tags?: string[];
  notes?: string;
}

interface Message {
  id: string;
  text: string;
  time: string;
  isIncoming: boolean;
  status?: "sent" | "delivered" | "read";
  media?: {
    type: "image" | "document" | "audio";
    url: string;
    name?: string;
  }[];
}

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
  
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for selected contact and messages
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // State for messages in the current conversation
  const [messages, setMessages] = useState<Message[]>([]);
  
  // State for new message input
  const [newMessage, setNewMessage] = useState("");
  
  // State for contact details drawer
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false);
  
  // State for contact notes
  const [contactNotes, setContactNotes] = useState("");

  // Filter contacts by search query
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

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
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;
    
    const newMsg: Message = {
      id: `msg${Date.now()}`,
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isIncoming: false,
      status: "sent"
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage("");
    
    // Update last message in contacts list
    setContacts(contacts.map(contact =>
      contact.id === selectedContact.id
        ? {
            ...contact,
            lastMessage: newMessage,
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
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-3">Conversas</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar contatos..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={cn(
                    "p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer",
                    selectedContact?.id === contact.id && "bg-gray-100 dark:bg-gray-800"
                  )}
                  onClick={() => selectContact(contact)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 relative">
                      <AvatarFallback>
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                      <AvatarImage src={contact.avatar} alt={contact.name} />
                      {contact.isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
                      )}
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">{contact.name}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {contact.lastMessageTime}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.lastMessage}
                      </p>
                    </div>
                    
                    {contact.unreadCount ? (
                      <div className="bg-ticlin text-black rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs font-medium">
                        {contact.unreadCount}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              
              {filteredContacts.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Nenhum contato encontrado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Right: Chat Area */}
        <div className={cn(
          "h-full flex-1 flex flex-col bg-white/5 dark:bg-black/5 backdrop-blur-lg",
          !selectedContact && "hidden md:flex"
        )}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-1 md:hidden"
                  onClick={() => setSelectedContact(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => setContactDetailsOpen(true)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedContact.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                    <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                  </Avatar>
                  
                  <div>
                    <h3 className="font-medium">{selectedContact.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedContact.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4 bg-[url('/lovable-uploads/ae7ddc52-d3ed-478f-af96-603a69278f3b.png')] bg-opacity-5 bg-contain">
                <div className="space-y-3 min-h-full flex flex-col justify-end">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-[80%] rounded-lg p-3",
                        message.isIncoming 
                          ? "bg-white dark:bg-gray-800 self-start rounded-tl-none" 
                          : "bg-ticlin/90 text-black self-end rounded-tr-none"
                      )}
                    >
                      <p>{message.text}</p>
                      <div className={cn(
                        "text-right text-xs mt-1",
                        message.isIncoming ? "text-muted-foreground" : "text-black/70"
                      )}>
                        {message.time}
                        {!message.isIncoming && message.status && (
                          <span className="ml-1">
                            {message.status === "sent" && "✓"}
                            {message.status === "delivered" && "✓✓"}
                            {message.status === "read" && "✓✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {/* Message Input */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-end gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Smile className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="p-2 grid grid-cols-8 gap-2">
                      {["😊", "😂", "👍", "❤️", "😍", "🙏", "👏", "🎉", "🤔", "😭", "🥳", "👋", "🔥", "💯", "⭐", "🚀"].map((emoji) => (
                        <button
                          key={emoji}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                          onClick={() => setNewMessage(prev => prev + emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48" align="start">
                    <div className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start">
                        <Image className="h-4 w-4 mr-2" />
                        Imagem
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        <File className="h-4 w-4 mr-2" />
                        Documento
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        <Mic className="h-4 w-4 mr-2" />
                        Áudio
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Input
                  className="flex-1"
                  placeholder="Digite uma mensagem"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-ticlin"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">WhatsApp Chat</h2>
              <p className="text-muted-foreground max-w-md">
                Selecione um contato da lista para iniciar uma conversa ou atender um lead.
              </p>
            </div>
          )}
        </div>
        
        {/* Contact Details Drawer */}
        {selectedContact && (
          <Drawer open={contactDetailsOpen} onOpenChange={setContactDetailsOpen}>
            <DrawerContent>
              <div className="max-w-md mx-auto">
                <DrawerHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-xl">
                        {selectedContact.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                      <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                    </Avatar>
                  </div>
                  <DrawerTitle className="text-2xl">{selectedContact.name}</DrawerTitle>
                  <DrawerDescription>{selectedContact.phone}</DrawerDescription>
                </DrawerHeader>
                
                <Tabs defaultValue="info" className="p-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1">Observações</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Telefone</h4>
                      <p className="text-muted-foreground">{selectedContact.phone}</p>
                    </div>
                    
                    {selectedContact.email && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">E-mail</h4>
                        <p className="text-muted-foreground">{selectedContact.email}</p>
                      </div>
                    )}
                    
                    {selectedContact.address && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Endereço</h4>
                        <p className="text-muted-foreground">{selectedContact.address}</p>
                      </div>
                    )}
                    
                    {selectedContact.tags && selectedContact.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Etiquetas</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedContact.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="notes" className="mt-4">
                    <Textarea 
                      placeholder="Adicione observações sobre este contato..."
                      className="min-h-[200px]"
                      value={contactNotes}
                      onChange={(e) => setContactNotes(e.target.value)}
                    />
                    <Button 
                      className="w-full mt-4 bg-ticlin hover:bg-ticlin/90 text-black"
                      onClick={updateContactNotes}
                    >
                      Salvar Observações
                    </Button>
                  </TabsContent>
                </Tabs>
                
                <DrawerFooter>
                  <Button variant="outline" onClick={() => setContactDetailsOpen(false)}>
                    Fechar
                  </Button>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </main>
    </div>
  );
}
