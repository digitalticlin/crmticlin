import React, { useState, useMemo, useCallback } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ContactsList from "./contacts/ContactsList";
import { Contact } from "@/types/chat";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WhatsAppContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMoreContacts?: boolean;
  onLoadMoreContacts?: () => Promise<void>;
  onRefreshContacts?: () => void;
  totalContactsAvailable?: number;
  onEditLead?: () => void;
  onSearch?: (query: string) => Promise<void>;
}

interface FilterState {
  type: 'all' | 'unread';
}

export const WhatsAppContactsList = React.memo(({
  contacts,
  selectedContact,
  onSelectContact,
  isLoading,
  isLoadingMore = false,
  hasMoreContacts = false,
  onLoadMoreContacts,
  onRefreshContacts,
  totalContactsAvailable = 0,
  onEditLead,
  onSearch
}: WhatsAppContactsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [isSearching, setIsSearching] = useState(false);

  // Funções para fechar e excluir conversas
  const handleDeleteConversation = useCallback(async (contactId: string) => {
    console.log('[WhatsAppContactsList] handleDeleteConversation chamado:', contactId);
    try {
      // 🗑️ EXCLUIR CONVERSA: Apagar todas as mensagens do lead
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('lead_id', contactId);

      if (messagesError) throw messagesError;

      // 📝 Atualizar lead: zerar contadores e marcar como arquivado
      const { error: leadError } = await supabase
        .from('leads')
        .update({ 
          unread_count: 0,
          last_message: null,
          last_message_time: null,
          conversation_status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId);

      if (leadError) throw leadError;

      // 🔄 Refresh da lista e fechar chat se estava selecionado
      if (onRefreshContacts) {
        console.log('[WhatsAppContactsList] Chamando onRefreshContacts após exclusão');
        onRefreshContacts();
      }

      toast.success('Conversa excluída com sucesso');
    } catch (error) {
      console.error('❌ Erro ao excluir conversa:', error);
      toast.error('Erro ao excluir conversa');
      throw error;
    }
  }, [onRefreshContacts]);

  const handleCloseConversation = useCallback(async (contactId: string) => {
    console.log('[WhatsAppContactsList] handleCloseConversation chamado:', contactId);
    try {
      // ❌ FECHAR CONVERSA: Manter mensagens, marcar como fechada
      const { error } = await supabase
        .from('leads')
        .update({ 
          conversation_status: 'closed',
          unread_count: 0,  // Zerar não lidas ao fechar
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId);

      if (error) throw error;

      // 🔄 Refresh da lista e fechar chat se estava selecionado
      if (onRefreshContacts) {
        console.log('[WhatsAppContactsList] Chamando onRefreshContacts após fechamento');
        onRefreshContacts();
      }

      toast.success('Conversa fechada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao fechar conversa:', error);
      toast.error('Erro ao fechar conversa');
      throw error;
    }
  }, [onRefreshContacts]);

  // 🚀 CORREÇÃO: Não filtrar localmente - dados já vêm filtrados do servidor
  const filteredContacts = useMemo(() => {
    // Se há busca ativa, os contatos já vêm filtrados do servidor via onSearch
    // Se não há busca, mostra todos os contatos carregados
    console.log('[WhatsAppContactsList] 📊 Contatos recebidos:', {
      total: contacts.length,
      hasSearch: !!searchQuery.trim(),
      searchQuery,
      contactsLength: contacts.length
    });
    return contacts;
  }, [contacts, searchQuery]);

  // Filtrar por tipo
  const finalContacts = useMemo(() => {
    console.log('[WhatsAppContactsList] Filtering contacts:', {
      totalContacts: filteredContacts.length,
      activeFilter,
      searchQuery
    });
    
    // When searching, don't apply local filters - server already filtered
    if (searchQuery.trim()) {
      console.log('[WhatsAppContactsList] Search active, returning all filtered contacts');
      return filteredContacts;
    }
    
    switch (activeFilter) {
      case "unread":
        return filteredContacts.filter(contact => contact.unreadCount && contact.unreadCount > 0);
      default:
        return filteredContacts;
    }
  }, [filteredContacts, activeFilter, searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="h-full flex flex-col relative z-10">
      {/* Header fixo sem scroll */}
      <div className="flex-shrink-0 p-4 border-b border-white/20 backdrop-blur-sm bg-gradient-to-r from-white/10 to-white/5">
        <div className="space-y-3">
          {/* Título */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 drop-shadow-sm">
              Conversas ({finalContacts.length})
            </h2>
            
            {onRefreshContacts && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefreshContacts}
                disabled={isLoading}
                className="text-gray-600 hover:text-gray-800"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            )}
          </div>

          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={async (e) => {
                const q = e.target.value;
                console.log('[WhatsAppContactsList] Search query changed:', q);
                setSearchQuery(q);
                setIsSearching(true);
                if (onSearch) {
                  console.log('[WhatsAppContactsList] Calling onSearch with query:', q);
                  await onSearch(q);
                }
                setIsSearching(false);
              }}
              className="pl-10 pr-10 bg-white/20 border-white/30 text-gray-800 placeholder:text-gray-600 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  clearSearch();
                  if (onSearch) {
                    await onSearch('');
                  }
                }}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-gray-600 hover:text-gray-800"
              >
                ×
              </Button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex space-x-2">
            {[
              { key: "all", label: "Todas", count: totalContactsAvailable || contacts.length },
              { key: "unread", label: "Não lidas", count: contacts.filter(c => c.unreadCount && c.unreadCount > 0).length }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                  activeFilter === filter.key
                    ? "bg-white/30 text-gray-800 border border-white/40 shadow-sm"
                    : "bg-white/10 text-gray-700 hover:bg-white/20 hover:text-gray-800 border border-transparent"
                )}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Container da lista com scroll interno - ALTURA FIXA E SCROLL FORÇADO */}
      <div 
        className="flex-1 min-h-0 glass-scrollbar"
        style={{ 
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 200px)' 
        }}
      >
        <ContactsList
          contacts={finalContacts}
          selectedContact={selectedContact}
          onSelectContact={onSelectContact}
          searchQuery={searchQuery}
          activeFilter={activeFilter}
          isLoadingMore={isLoadingMore}
          hasMoreContacts={hasMoreContacts}
          onLoadMoreContacts={onLoadMoreContacts}
          onRefreshContacts={onRefreshContacts}
          totalContactsAvailable={totalContactsAvailable}
          onEditLead={onEditLead}
          onDeleteConversation={handleDeleteConversation}
          onCloseConversation={handleCloseConversation}
        />
      </div>

      {/* Loading indicator fixo */}
      {(isLoading || isSearching) && contacts.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-gray-800">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>{isSearching ? 'Buscando...' : 'Carregando conversas...'}</span>
          </div>
        </div>
      )}
    </div>
  );
});

WhatsAppContactsList.displayName = 'WhatsAppContactsList';
