import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Contact, Message } from '@/types/chat';
import { Search, Forward, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: Message | null;
  currentContactId?: string;
  activeInstanceId?: string | null;
  onForward: (targetContact: Contact) => Promise<void>;
}

const CONTACTS_PER_PAGE = 20;

export function ForwardMessageDialog({
  open,
  onOpenChange,
  message,
  currentContactId,
  activeInstanceId,
  onForward
}: ForwardMessageDialogProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Função para buscar contatos do banco de dados
  const fetchContacts = useCallback(async (pageNum: number, query: string, isNewSearch: boolean = false) => {
    if (!user?.id || !activeInstanceId) return;

    if (isNewSearch) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      console.log('[ForwardMessageDialog] 🔍 Buscando contatos:', {
        page: pageNum,
        query,
        isNewSearch
      });

      // Buscar role do usuário para filtro multitenant
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, created_by_user_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile não encontrado');
      }

      const from = pageNum * CONTACTS_PER_PAGE;
      const to = from + CONTACTS_PER_PAGE - 1;

      // ✅ CORREÇÃO: Query na tabela LEADS (correta)
      let dbQuery = supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          company,
          profile_pic_url,
          last_message,
          last_message_time,
          unread_count,
          whatsapp_number_id
        `, { count: 'exact' })
        .in('conversation_status', ['active', 'closed'])
        .neq('id', currentContactId || ''); // Excluir contato atual

      // Aplicar filtro multitenant
      if (profile.role === 'admin') {
        dbQuery = dbQuery.eq('created_by_user_id', user.id);
      } else if (profile.role === 'operational') {
        // Operacional: buscar instâncias acessíveis
        const { data: userWhatsAppNumbers } = await supabase
          .from('user_whatsapp_numbers')
          .select('whatsapp_number_id')
          .eq('profile_id', user.id);

        if (userWhatsAppNumbers && userWhatsAppNumbers.length > 0) {
          const whatsappIds = userWhatsAppNumbers.map(uwn => uwn.whatsapp_number_id);
          dbQuery = dbQuery.in('whatsapp_number_id', whatsappIds);
        } else {
          dbQuery = dbQuery.eq('id', 'impossible-id'); // Sem instâncias
        }
      } else {
        dbQuery = dbQuery.eq('created_by_user_id', user.id);
      }

      // Filtrar por instância específica
      if (activeInstanceId) {
        dbQuery = dbQuery.eq('whatsapp_number_id', activeInstanceId);
      }

      // 🔥 BUSCA GLOBAL: Aplicar filtro de busca se houver query
      if (query.trim()) {
        const searchTerm = `%${query.trim()}%`;
        dbQuery = dbQuery.or(`name.ilike.${searchTerm},phone.ilike.${searchTerm}`);
      }

      const { data, error, count } = await dbQuery
        .order('last_message_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      // Mapear dados para Contact (usando campos corretos da tabela leads)
      const fetchedContacts: Contact[] = (data || []).map(lead => ({
        id: lead.id,
        name: lead.name || undefined,
        phone: lead.phone || '',
        profilePicUrl: lead.profile_pic_url || undefined,
        profile_pic_url: lead.profile_pic_url || undefined,
        lastMessage: lead.last_message || undefined,
        lastMessageTime: lead.last_message_time || undefined,
        unreadCount: lead.unread_count || 0,
        company: lead.company || undefined,
        email: lead.email || undefined,
        whatsapp_number_id: lead.whatsapp_number_id || undefined
      }));

      console.log('[ForwardMessageDialog] ✅ Contatos carregados:', {
        count: fetchedContacts.length,
        total: count,
        hasMore: (count || 0) > to + 1
      });

      if (isNewSearch) {
        setContacts(fetchedContacts);
      } else {
        setContacts(prev => [...prev, ...fetchedContacts]);
      }

      setHasMore((count || 0) > to + 1);
    } catch (error) {
      console.error('[ForwardMessageDialog] ❌ Erro ao buscar contatos:', error);
      setContacts([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [user?.id, activeInstanceId, currentContactId]);

  // Buscar contatos ao abrir o dialog ou quando a busca mudar
  useEffect(() => {
    if (open) {
      setPage(0);
      fetchContacts(0, searchQuery, true);
      setSelectedContact(null); // Limpar seleção ao abrir
    } else {
      // Limpar ao fechar
      setContacts([]);
      setSearchQuery('');
      setPage(0);
      setHasMore(true);
      setSelectedContact(null);
    }
  }, [open, searchQuery, fetchContacts]);

  // Scroll infinito
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;

    if (bottom && hasMore && !isLoadingMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchContacts(nextPage, searchQuery, false);
    }
  }, [hasMore, isLoadingMore, isLoading, page, fetchContacts, searchQuery]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleConfirmForward = async () => {
    if (!selectedContact) return;

    setIsForwarding(true);
    try {
      await onForward(selectedContact);
      // Dialog será fechado pelo componente pai após sucesso
    } catch (error) {
      console.error('[ForwardMessageDialog] Erro ao encaminhar:', error);
    } finally {
      setIsForwarding(false);
    }
  };

  if (!message) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-lg border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="w-5 h-5 text-ticlin-500" />
            Encaminhar mensagem
          </DialogTitle>
          <DialogDescription>
            Selecione um contato para encaminhar esta mensagem
          </DialogDescription>
        </DialogHeader>

        {/* Preview da mensagem */}
        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Mensagem a ser encaminhada:</p>
          <div className="text-sm text-gray-800 line-clamp-3">
            {message.mediaType !== 'text' && (
              <span className="text-ticlin-600 font-medium">
                [{message.mediaType.toUpperCase()}]{' '}
              </span>
            )}
            {message.text || '(sem texto)'}
          </div>
        </div>

        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou número..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de contatos com scroll infinito */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-[300px] overflow-y-auto pr-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">Carregando contatos...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <User className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">Nenhum contato encontrado</p>
            </div>
          ) : (
            <div className="space-y-1">
              {contacts.map((contact) => (
                <Button
                  key={contact.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start p-3 h-auto",
                    "hover:bg-ticlin-50 transition-colors",
                    selectedContact?.id === contact.id && "bg-ticlin-100 border-2 border-ticlin-500"
                  )}
                  onClick={() => handleSelectContact(contact)}
                  disabled={isForwarding}
                >
                  <div className="flex items-center gap-3 w-full">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-ticlin-100 flex items-center justify-center flex-shrink-0">
                      {contact.profile_pic_url || contact.profilePicUrl ? (
                        <img
                          src={contact.profile_pic_url || contact.profilePicUrl}
                          alt={contact.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-ticlin-600" />
                      )}
                    </div>

                    {/* Informações do contato */}
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">
                        {contact.name || contact.phone}
                      </p>
                      <p className="text-sm text-gray-500">
                        {contact.company ? `${contact.company} • ${contact.phone}` : contact.phone}
                      </p>
                    </div>

                    {/* Ícone de encaminhar */}
                    <Forward className="w-4 h-4 text-gray-400" />
                  </div>
                </Button>
              ))}

              {/* Indicador de carregamento no final da lista */}
              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-ticlin-500" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé com informações e botão */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t">
          {/* Contador de contatos */}
          <div className="text-sm text-gray-500">
            {contacts.length} contato{contacts.length !== 1 ? 's' : ''} carregado{contacts.length !== 1 ? 's' : ''}
            {hasMore && ' • Role para carregar mais'}
          </div>

          {/* Botão de Encaminhar */}
          <Button
            onClick={handleConfirmForward}
            disabled={!selectedContact || isForwarding}
            className="bg-ticlin-500 hover:bg-ticlin-600 text-white"
          >
            {isForwarding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Encaminhando...
              </>
            ) : (
              <>
                <Forward className="w-4 h-4 mr-2" />
                Encaminhar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
