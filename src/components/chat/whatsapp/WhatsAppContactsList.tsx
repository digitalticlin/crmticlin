
import React, { useRef, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Contact } from '@/types/chat';
import { formatPhoneDisplay } from '@/utils/phoneFormatter';
import { useContactsSearch } from './hooks/useContactsSearch';
import { useContactsInfiniteScroll } from './hooks/useContactsInfiniteScroll';

interface WhatsAppContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreContacts?: boolean;
  onLoadMoreContacts?: () => Promise<void>;
  onRefreshContacts?: () => void;
  totalContactsAvailable?: number;
}

export const WhatsAppContactsList: React.FC<WhatsAppContactsListProps> = ({
  contacts,
  selectedContact,
  onSelectContact,
  isLoading = false,
  isLoadingMore = false,
  hasMoreContacts = false,
  onLoadMoreContacts,
  onRefreshContacts,
  totalContactsAvailable = 0
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Hook para busca de contatos
  const { searchQuery, setSearchQuery, filteredContacts } = useContactsSearch(contacts);
  
  // Hook para scroll infinito
  useContactsInfiniteScroll({
    scrollContainerRef,
    isLoadingMore,
    hasMoreContacts,
    onLoadMoreContacts
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header Fixo */}
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">
            Conversas
          </h2>
          
          {onRefreshContacts && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshContacts}
              className="text-white/70 hover:text-white hover:bg-white/10"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          )}
        </div>

        {/* Campo de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Buscar contatos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:bg-white/10"
          />
        </div>

        {/* Contador de Contatos */}
        {totalContactsAvailable > 0 && (
          <div className="mt-2 text-xs text-white/60 text-center">
            {filteredContacts.length} de {totalContactsAvailable} contatos
          </div>
        )}
      </div>

      {/* Lista de Contatos com Scroll Interno */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto glass-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {isLoading ? (
          // Loading Estado
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50 mx-auto mb-2"></div>
            <p className="text-white/60 text-sm">Carregando contatos...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          // Empty Estado
          <div className="p-6 text-center">
            <p className="text-white/60">
              {searchQuery ? 'Nenhum contato encontrado' : 'Nenhuma conversa disponível'}
            </p>
          </div>
        ) : (
          // Lista de Contatos
          <div className="divide-y divide-white/5">
            {filteredContacts.map((contact) => {
              const displayName = contact.name || formatPhoneDisplay(contact.phone);
              const isSelected = selectedContact?.id === contact.id;
              const hasUnread = contact.unreadCount && contact.unreadCount > 0;

              return (
                <div
                  key={contact.id}
                  onClick={() => onSelectContact(contact)}
                  className={cn(
                    "p-4 cursor-pointer transition-all duration-200 contact-item-hover",
                    "hover:bg-white/5",
                    isSelected && "bg-white/10 border-l-2 border-white/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback className="bg-white/10 text-white">
                          {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Indicator Online */}
                      {contact.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white/20 rounded-full" />
                      )}
                    </div>

                    {/* Informações do Contato */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-white truncate pr-2">
                          {displayName}
                        </h3>
                        <span className="text-xs text-white/50 whitespace-nowrap">
                          {contact.lastMessageTime}
                        </span>
                      </div>
                      
                      <p className="text-sm text-white/70 truncate">
                        {contact.lastMessage || 'Sem mensagens'}
                      </p>
                    </div>

                    {/* Badge de Mensagens Não Lidas */}
                    {hasUnread && (
                      <Badge className="unread-badge text-black font-medium min-w-[20px] h-5">
                        {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Indicador de Carregamento Mais */}
            {isLoadingMore && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/50 mx-auto mb-2"></div>
                <p className="text-white/60 text-xs">Carregando mais...</p>
              </div>
            )}

            {/* Indicador Final da Lista */}
            {!hasMoreContacts && filteredContacts.length > 0 && (
              <div className="p-4 text-center">
                <p className="text-white/40 text-xs">Todos os contatos carregados</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
