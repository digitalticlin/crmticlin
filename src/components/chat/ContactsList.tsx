
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";

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
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

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
            // CORREÇÃO: Verificar se há mensagens não lidas de forma mais rigorosa
            const hasUnreadMessages = contact.unreadCount && contact.unreadCount > 0;
            
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
                  
                  {/* CORREÇÃO: Só mostrar badge se realmente houver mensagens não lidas */}
                  {hasUnreadMessages && (
                    <div className="bg-ticlin text-black rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs font-medium">
                      {contact.unreadCount}
                    </div>
                  )}
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
