import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { MessageCircle, Clock, TrendingUp } from "lucide-react";
import { ContactTags } from "./ContactTags";
import { useTagsSync } from "@/hooks/whatsapp/useTagsSync";
import { useAuth } from "@/contexts/AuthContext";
import { UnreadMessagesService } from "@/services/whatsapp/unreadMessagesService";

interface ContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  searchQuery: string;
  activeFilter: string;
  isLoadingMore?: boolean;
  hasMoreContacts?: boolean;
  onLoadMoreContacts?: () => Promise<void>;
  onRefreshContacts?: () => void;
  totalContactsAvailable?: number;
}

// Função para determinar se deve mostrar nome ou telefone (estilo WhatsApp)
const getDisplayName = (contact: Contact): string => {
  if (contact.name && contact.name !== contact.phone && contact.name.trim() !== '') {
    return contact.name;
  }
  return formatPhoneDisplay(contact.phone);
};

export const ContactsList = ({
  contacts,
  selectedContact,
  onSelectContact,
  searchQuery,
  activeFilter,
  isLoadingMore = false,
  hasMoreContacts = false,
  onLoadMoreContacts,
  onRefreshContacts,
  totalContactsAvailable
}: ContactsListProps) => {
  const { user } = useAuth();
  const [highlightedContacts, setHighlightedContacts] = useState<Set<string>>(new Set());
  
  // 🚀 REFS PARA SCROLL INFINITO
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0); // 🚀 NOVO: Para throttling

  // Usar o hook de sincronização de tags
  useTagsSync(user?.id || null, () => {
    if (onRefreshContacts) {
      onRefreshContacts();
    }
  });

  // 🚀 FUNÇÃO OTIMIZADA PARA CARREGAR MAIS CONTATOS COM DEBOUNCE
  const handleLoadMore = useCallback(async () => {
    const now = Date.now();
    
    // ✅ PROTEÇÃO: Verificações múltiplas para evitar loops
    if (!onLoadMoreContacts || !hasMoreContacts || isLoadingRef.current || isLoadingMore) {
      console.log('[ContactsList] 🚫 LoadMore bloqueado:', {
        hasFunction: !!onLoadMoreContacts,
        hasMoreContacts,
        isLoadingRef: isLoadingRef.current,
        isLoadingMore
      });
      return;
    }

    // ✅ DEBOUNCE: Evitar múltiplas chamadas muito rápidas
    const timeSinceLastLoad = now - lastLoadTimeRef.current;
    if (timeSinceLastLoad < 1000) { // 1 segundo entre carregamentos
      console.log('[ContactsList] ⏳ Debounce ativo - aguardando...', {
        timeSinceLastLoad
      });
      return;
    }

    console.log('[ContactsList] 🔄 Carregando mais contatos via scroll infinito...');
    
    try {
      isLoadingRef.current = true;
      lastLoadTimeRef.current = now;
      await onLoadMoreContacts();
      console.log('[ContactsList] ✅ Mais contatos carregados com sucesso');
    } catch (error) {
      console.error('[ContactsList] ❌ Erro ao carregar mais contatos:', error);
    } finally {
      // Pequeno delay antes de permitir novos carregamentos
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 500);
    }
  }, [onLoadMoreContacts, hasMoreContacts, isLoadingMore]);

  // 🚀 INTERSECTION OBSERVER PARA SCROLL INFINITO
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || !hasMoreContacts || !onLoadMoreContacts) {
      console.log('[ContactsList] 🚫 Observer não configurado:', {
        hasTrigger: !!trigger,
        hasMoreContacts,
        hasLoadFunction: !!onLoadMoreContacts
      });
      return;
    }

    console.log('[ContactsList] 👁️ Configurando Intersection Observer...');

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        console.log('[ContactsList] 👁️ Observer ativado:', {
          isIntersecting: entry.isIntersecting,
          hasMoreContacts,
          isLoading: isLoadingRef.current,
          intersectionRatio: entry.intersectionRatio
        });
        
        // ✅ CONDIÇÃO MAIS RIGOROSA: Só disparar se ratio for significativo
        if (entry.isIntersecting && 
            entry.intersectionRatio > 0.5 && // Mais da metade deve estar visível
            hasMoreContacts && 
            !isLoadingRef.current && 
            !isLoadingMore) {
          console.log('[ContactsList] 🚀 Trigger visível - carregando mais contatos...');
          handleLoadMore();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '50px', // Reduzido de 100px para 50px
        threshold: 0.5 // Aumentado de 0.1 para 0.5
      }
    );

    observer.observe(trigger);
    console.log('[ContactsList] ✅ Observer configurado com sucesso');

    return () => {
      console.log('[ContactsList] 🧹 Removendo Observer');
      observer.disconnect();
    };
  }, [hasMoreContacts, handleLoadMore, onLoadMoreContacts]);

  // 🚀 DETECTAR SCROLL MANUAL COMO FALLBACK
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Verificar se está próximo do final (90% do scroll)
    const isNearEnd = (scrollTop + clientHeight) / scrollHeight > 0.9;
    
    if (isNearEnd && hasMoreContacts && !isLoadingRef.current && !isLoadingMore && onLoadMoreContacts) {
      console.log('[ContactsList] 📜 Scroll manual detectado - carregando mais...');
      handleLoadMore();
    }
  }, [hasMoreContacts, isLoadingMore, onLoadMoreContacts, handleLoadMore]);

  // 🚀 FUNÇÃO OTIMIZADA: Marcar como lida sem resetar lista
  const handleSelectContact = async (contact: Contact) => {
    // Marcar mensagens como lidas se o contato tem mensagens não lidas
    if (contact.unreadCount && contact.unreadCount > 0 && contact.leadId) {
      await UnreadMessagesService.markAsRead(contact.leadId);
      console.log(`[ContactsList] ✅ Mensagens marcadas como lidas para: ${contact.name}`);
      // ✅ CORREÇÃO CRÍTICA: Não chamar refresh que reseta paginação!
      // A atualização já acontece via subscription no hook useWhatsAppContacts
    }
    
    onSelectContact(contact);
  };

  // Renderização dos contatos
  const renderedContacts = useMemo(() => {
    return contacts.map((contact, index) => {
      // ✅ CORREÇÃO: Condição mais rigorosa para evitar mostrar "0"
      const hasUnreadMessages = contact.unreadCount && contact.unreadCount > 0;
      const displayName = getDisplayName(contact);
      const isSelected = selectedContact?.id === contact.id;
      
      return (
        <div
          key={contact.id}
          className={cn(
            "p-4 hover:bg-white/20 cursor-pointer transition-all duration-300 border-b border-white/10 group",
            isSelected && "bg-white/30 border-r-2 border-blue-500"
          )}
        >
          <div className="flex items-start gap-3" onClick={() => handleSelectContact(contact)}>
            {/* Avatar com padrão preto e T amarelo */}
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center ring-2 ring-white/10">
                <span className="text-yellow-400 font-extrabold text-lg" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  T
                </span>
              </div>
              
              {/* ✅ CORREÇÃO: Badge de mensagens não lidas - APENAS quando há mensagens não lidas */}
              {hasUnreadMessages && contact.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full h-6 min-w-[24px] flex items-center justify-center text-xs font-bold animate-pulse">
                  {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                </div>
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
                  {/* Horário da última mensagem */}
                  {contact.lastMessageTime && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(contact.lastMessageTime).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              </div>
              
              <p className={cn(
                "text-sm truncate mb-1",
                hasUnreadMessages ? "text-gray-700 font-medium" : "text-gray-600"
              )}>
                {contact.lastMessage || "Nenhuma mensagem ainda"}
              </p>

              {/* Tags do contato */}
              <ContactTags tags={contact.tags || []} />
            </div>
          </div>
        </div>
      );
    });
  }, [contacts, selectedContact, handleSelectContact]);

  if (contacts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-blue-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-800">Nenhuma conversa ainda</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {searchQuery 
                ? 'Nenhum contato encontrado para sua pesquisa' 
                : 'Quando você receber mensagens ou iniciar conversas, elas aparecerão aqui'
              }
            </p>
          </div>
          {!searchQuery && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              💡 Dica: Conecte seu WhatsApp na seção Admin para começar a receber mensagens
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 overflow-y-auto"
      ref={scrollContainerRef}
      onScroll={handleScroll}
    >
      <div className="divide-y divide-gray-200/20">
        {renderedContacts}
        
        {/* 🚀 TRIGGER PARA INTERSECTION OBSERVER - ELEMENTO PEQUENO */}
        {hasMoreContacts && (
          <div
            ref={loadMoreTriggerRef}
            className="h-8 flex items-center justify-center"
          >
            {isLoadingMore ? (
              <div className="flex flex-col items-center space-y-1 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-xs">Carregando...</span>
                </div>
              </div>
            ) : (
              <div className="h-2 w-full bg-transparent"></div>
            )}
          </div>
        )}
        
        {/* 🚀 INDICADOR DE FIM DOS CONTATOS MELHORADO */}
        {!hasMoreContacts && contacts.length > 0 && (
          <div className="flex flex-col items-center py-6 space-y-2">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <div className="h-px bg-gray-300 w-8"></div>
              <span>✅ Todos os {totalContactsAvailable || contacts.length} contatos carregados</span>
              <div className="h-px bg-gray-300 w-8"></div>
            </div>
            <div className="text-xs text-gray-400">
              💡 Use a busca para encontrar contatos específicos
            </div>
          </div>
        )}

        {/* 🚀 INDICADOR QUANDO NÃO HÁ CONTATOS */}
        {!hasMoreContacts && contacts.length === 0 && (
          <div className="flex justify-center py-4">
            <span className="text-xs text-gray-400">
              Nenhum contato encontrado nesta instância
            </span>
          </div>
        )}

        {/* 🚀 INDICADOR DE PROGRESSO MELHORADO */}
        {hasMoreContacts && (
          <div className="flex flex-col items-center py-3 space-y-2 bg-gray-50/50 mx-2 rounded-lg">
            <div className="text-xs text-gray-500">
              {contacts.length} de {totalContactsAvailable || '?'} contatos carregados
              {totalContactsAvailable && (
                <span className="ml-2 font-medium">
                  ({Math.round((contacts.length / totalContactsAvailable) * 100)}%)
                </span>
              )}
            </div>
            {isLoadingMore && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                <span>Carregando mais contatos...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

ContactsList.displayName = 'ContactsList';

export default ContactsList;
