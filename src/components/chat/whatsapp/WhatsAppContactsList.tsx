
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
    return timeString;
  };

  return (
    <div className="h-full flex flex-col bg-white/5 backdrop-blur-sm border-r border-white/20">
      {/* Header Moderno */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Conversas</h1>
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
            <MoreVertical className="h-5 w-5 text-gray-700" />
          </div>
        </div>
        
        {/* Search Bar Moderno */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            placeholder="Pesquisar conversas..."
            className="pl-12 bg-white/20 backdrop-blur-sm border-white/30 text-gray-900 placeholder-gray-600 focus:bg-white/30 focus:border-white/40 h-12 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List Moderno */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={cn(
                    "p-4 rounded-2xl mb-2 hover:bg-white/20 cursor-pointer transition-all duration-200 relative group",
                    selectedContact?.id === contact.id && "bg-white/25 shadow-lg ring-2 ring-white/30"
                  )}
                  onClick={() => onSelectContact(contact)}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14 ring-2 ring-white/20">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                          {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                        <AvatarImage src={contact.avatar} alt={contact.name} />
                      </Avatar>
                      {contact.isOnline && (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 truncate text-lg">{contact.name}</h3>
                        <div className="flex items-center gap-2 ml-2">
                          {contact.lastMessageTime && (
                            <span className="text-sm text-gray-600 whitespace-nowrap font-medium">
                              {formatLastMessageTime(contact.lastMessageTime)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-700 truncate flex-1 leading-relaxed">
                          {contact.lastMessage || "Clique para conversar"}
                        </p>
                        
                        {contact.unreadCount > 0 && (
                          <Badge 
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded-full ml-2 shadow-sm"
                          >
                            {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Company Info */}
                      {contact.company && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-gray-400 text-gray-600 bg-white/30">
                            {contact.company}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredContacts.length === 0 && !isLoading && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                    <Search className="h-8 w-8 text-gray-500" />
                  </div>
                  <p className="text-gray-600 text-lg font-medium">
                    {searchQuery ? 'Nenhum contato encontrado' : 'Nenhuma conversa ainda'}
                  </p>
                  {!searchQuery && (
                    <p className="text-gray-500 text-sm mt-2">
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
