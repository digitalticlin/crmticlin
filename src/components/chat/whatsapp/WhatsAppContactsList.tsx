
import { useState } from "react";
import { Search, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-[#202c33] border-b border-[#313d45]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-medium text-[#e9edef]">WhatsApp</h1>
          <MoreVertical className="h-5 w-5 text-[#8696a0] cursor-pointer hover:text-[#e9edef]" />
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
          <Input
            placeholder="Pesquisar ou começar uma nova conversa"
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
                    "p-3 hover:bg-[#2a3942] cursor-pointer transition-colors",
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
                        <span className="text-xs text-[#8696a0] whitespace-nowrap ml-2">
                          {contact.lastMessageTime}
                        </span>
                      </div>
                      <p className="text-sm text-[#8696a0] truncate">
                        {contact.lastMessage || "Clique para conversar"}
                      </p>
                    </div>
                    
                    {contact.unreadCount > 0 && (
                      <div className="bg-[#00a884] text-black rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs font-medium">
                        {contact.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredContacts.length === 0 && !isLoading && (
                <div className="p-8 text-center">
                  <p className="text-[#8696a0]">Nenhuma conversa encontrada</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};
