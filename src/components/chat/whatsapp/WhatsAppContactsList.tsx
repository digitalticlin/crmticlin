
import { useState } from "react";
import { SubtleScrollArea } from "@/components/ui/subtle-scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { LoadingSpinner } from "@/components/ui/spinner";
import { WhatsAppChatFilters } from "./WhatsAppChatFilters";

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
  const [activeFilter, setActiveFilter] = useState("all");

  // Filter and sort contacts
  const filteredContacts = contacts
    .filter(contact => {
      // Search filter
      const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           contact.phone.includes(searchQuery);
      
      // Status filter
      const matchesFilter = (() => {
        switch (activeFilter) {
          case "unread":
            return contact.unreadCount && contact.unreadCount > 0;
          case "archived":
            return false; // Implementar arquivados futuramente
          case "groups":
            return false; // Implementar grupos futuramente
          default:
            return true;
        }
      })();

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Ordenar por última mensagem (mais recente primeiro)
      if (!a.lastMessageTime && !b.lastMessageTime) return 0;
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      
      // Conversões não lidas primeiro
      if (a.unreadCount && !b.unreadCount) return -1;
      if (!a.unreadCount && b.unreadCount) return 1;
      
      return b.lastMessageTime.localeCompare(a.lastMessageTime);
    });

  const formatLastMessageTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString;
  };

  // Função para obter cor da tag (integrada com funil)
  const getTagColor = (tagName: string) => {
    const colors = [
      'bg-green-100 text-green-800 border-green-200',
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200'
    ];
    const index = tagName.length % colors.length;
    return colors[index];
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header com Filtros */}
      <WhatsAppChatFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Lista de Contatos com Scroll Independente */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <SubtleScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={cn(
                    "p-4 rounded-2xl hover:bg-white/20 cursor-pointer transition-all duration-200 relative group",
                    selectedContact?.id === contact.id && "bg-white/25 shadow-lg ring-2 ring-white/30"
                  )}
                  onClick={() => onSelectContact(contact)}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14 ring-2 ring-white/20">
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-lg font-semibold">
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
                        
                        {contact.unreadCount && contact.unreadCount > 0 && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded-full ml-2 shadow-sm">
                            {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Tags do Lead */}
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {contact.tags.slice(0, 2).map((tag, index) => (
                            <Badge 
                              key={index}
                              variant="outline" 
                              className={cn(
                                "text-xs border",
                                getTagColor(tag)
                              )}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs border-gray-300 text-gray-600 bg-gray-50">
                              +{contact.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Company Info */}
                      {contact.company && (
                        <div className="flex items-center gap-2 mt-1">
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
                    <div className="h-8 w-8 text-gray-500">💬</div>
                  </div>
                  <p className="text-gray-600 text-lg font-medium">
                    {searchQuery || activeFilter !== "all" 
                      ? 'Nenhuma conversa encontrada' 
                      : 'Nenhuma conversa ainda'}
                  </p>
                  {!searchQuery && activeFilter === "all" && (
                    <p className="text-gray-500 text-sm mt-2">
                      As conversas aparecerão aqui quando você receber mensagens
                    </p>
                  )}
                </div>
              )}
            </div>
          </SubtleScrollArea>
        )}
      </div>
    </div>
  );
};
