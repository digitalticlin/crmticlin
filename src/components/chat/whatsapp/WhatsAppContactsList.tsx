
import { useState } from "react";
import { Search, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { LoadingSpinner } from "@/components/ui/spinner";

interface WhatsAppContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  isLoading: boolean;
}

export const WhatsAppContactsList = ({
  contacts,
  selectedContact,
  onSelectContact,
  isLoading
}: WhatsAppContactsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  const formatLastMessageTime = (timeString: string) => {
    if (!timeString) return '';
    
    const now = new Date();
    const messageTime = new Date(timeString);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return messageTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-[#202c33] border-b border-[#313d45]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-medium text-[#e9edef]">Conversas</h1>
          <MoreVertical className="h-5 w-5 text-[#8696a0] cursor-pointer hover:text-[#e9edef]" />
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
          <Input
            placeholder="Pesquisar contatos..."
            className="pl-10 bg-[#2a3942] border-none text-[#e9edef] placeholder-[#8696a0] focus:bg-[#2a3942] h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="divide-y divide-[#313d45]">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={cn(
                    "p-3 hover:bg-[#2a3942] cursor-pointer transition-colors relative",
                    selectedContact?.id === contact.id && "bg-[#2a3942]"
                  )}
                  onClick={() => onSelectContact(contact)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-[#6b7c85] text-white text-sm">
                          {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                        <AvatarImage src={contact.avatar} alt={contact.name} />
                      </Avatar>
                      {contact.isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#00d9ff] border-2 border-[#0b141a]" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-[#e9edef] truncate">{contact.name}</h3>
                        <div className="flex items-center gap-2 ml-2">
                          {contact.lastMessageTime && (
                            <span className="text-xs text-[#8696a0] whitespace-nowrap">
                              {formatLastMessageTime(contact.lastMessageTime)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-[#8696a0] truncate flex-1">
                          {contact.lastMessage || "Clique para conversar"}
                        </p>
                        
                        {contact.unreadCount > 0 && (
                          <Badge 
                            variant="default" 
                            className="bg-[#00a884] text-black text-xs px-2 py-1 rounded-full ml-2"
                          >
                            {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Indicadores adicionais */}
                      <div className="flex items-center gap-2 mt-1">
                        {contact.purchaseValue && contact.purchaseValue > 0 && (
                          <Badge variant="outline" className="text-xs border-[#00a884] text-[#00a884]">
                            R$ {contact.purchaseValue.toLocaleString('pt-BR')}
                          </Badge>
                        )}
                        {contact.company && (
                          <Badge variant="outline" className="text-xs border-[#8696a0] text-[#8696a0]">
                            {contact.company}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredContacts.length === 0 && !isLoading && (
                <div className="p-8 text-center">
                  <p className="text-[#8696a0]">
                    {searchQuery ? 'Nenhum contato encontrado' : 'Nenhuma conversa ainda'}
                  </p>
                  {!searchQuery && (
                    <p className="text-[#8696a0] text-sm mt-2">
                      As conversas aparecerão aqui quando você receber mensagens
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};
