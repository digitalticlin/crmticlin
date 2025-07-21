
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";

interface ContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
}

export const ContactsList = ({
  contacts,
  selectedContact,
  onSelectContact,
}: ContactsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter contacts by search query
  const filteredContacts = contacts.filter(contact => {
    const displayName = contact.name || formatPhoneDisplay(contact.phone);
    return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           contact.phone.includes(searchQuery);
  });

  return (
    <div className="h-full w-full max-w-sm border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white/10 dark:bg-black/10 backdrop-blur-lg">
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
          {filteredContacts.map((contact) => {
            const hasUnreadMessages = contact.unreadCount && contact.unreadCount > 0;
            const displayName = contact.name || formatPhoneDisplay(contact.phone);
            
            return (
              <div
                key={contact.id}
                className={cn(
                  "p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer",
                  selectedContact?.id === contact.id && "bg-gray-100 dark:bg-gray-800"
                )}
                onClick={() => onSelectContact(contact)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                        {displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                      <AvatarImage src={contact.avatar} alt={displayName} />
                    </Avatar>
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className={cn(
                        "font-medium truncate text-sm",
                        hasUnreadMessages ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                      )}>
                        {displayName}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                        {contact.lastMessageTime}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-1">
                      <p className={cn(
                        "text-xs truncate",
                        hasUnreadMessages ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-500 dark:text-gray-400"
                      )}>
                        {contact.lastMessage || 'Nenhuma mensagem'}
                      </p>
                      
                      {hasUnreadMessages && (
                        <div className="bg-ticlin text-black rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs font-medium ml-2">
                          {contact.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredContacts.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum contato encontrado</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
