
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { MessageCircle, Clock } from "lucide-react";

interface ContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  searchQuery: string;
  activeFilter: string;
}

// Função para determinar se deve mostrar nome ou telefone (estilo WhatsApp)
const getDisplayName = (contact: Contact): string => {
  // Se o nome é diferente do telefone, significa que foi editado pelo usuário
  if (contact.name && contact.name !== contact.phone && contact.name.trim() !== '') {
    return contact.name;
  }
  // Caso contrário, mostra o telefone formatado
  return formatPhoneDisplay(contact.phone);
};

export const ContactsList = ({
  contacts,
  selectedContact,
  onSelectContact,
  searchQuery,
  activeFilter
}: ContactsListProps) => {
  
  if (contacts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma conversa</h3>
            <p className="text-gray-600 text-sm">
              {searchQuery ? 'Nenhum contato encontrado para sua pesquisa' : 'Suas conversas aparecerão aqui'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
        {contacts.map((contact) => {
          const hasUnreadMessages = contact.unreadCount && contact.unreadCount > 0;
          const displayName = getDisplayName(contact);
          const isSelected = selectedContact?.id === contact.id;
          
          return (
            <div
              key={contact.id}
              className={cn(
                "p-4 hover:bg-white/20 dark:hover:bg-gray-800/20 cursor-pointer transition-all duration-200 backdrop-blur-sm",
                isSelected && "bg-white/30 dark:bg-gray-800/30 border-r-2 border-blue-500"
              )}
              onClick={() => onSelectContact(contact)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-white/20">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-gray-800 font-semibold">
                      {displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                    <AvatarImage src={contact.avatar} alt={displayName} />
                  </Avatar>
                  
                  {/* Indicador de status online (placeholder para futuro) */}
                  {contact.isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={cn(
                      "font-medium truncate text-base",
                      hasUnreadMessages ? "text-gray-900 font-semibold" : "text-gray-800"
                    )}>
                      {displayName}
                    </h3>
                    
                    <div className="flex items-center gap-2 ml-2">
                      {contact.lastMessageTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className={cn(
                            "text-xs whitespace-nowrap",
                            hasUnreadMessages ? "text-blue-600 font-medium" : "text-gray-500"
                          )}>
                            {contact.lastMessageTime}
                          </span>
                        </div>
                      )}
                      
                      {hasUnreadMessages && (
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full h-6 min-w-[24px] flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
                          {contact.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-sm truncate flex-1",
                      hasUnreadMessages ? "text-gray-700 font-medium" : "text-gray-600"
                    )}>
                      {contact.lastMessage || "Nenhuma mensagem ainda"}
                    </p>
                  </div>
                  
                  {/* Área das etiquetas - removido telefone */}
                  <div className="flex items-center gap-2 mt-2">
                    {contact.tags && contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.slice(0, 2).map((tag, index) => (
                          <span 
                            key={index}
                            className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {contact.tags.length > 2 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            +{contact.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {contact.company && (
                      <span className="text-xs text-gray-500 bg-white/20 px-2 py-0.5 rounded-full truncate max-w-[100px]">
                        {contact.company}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
