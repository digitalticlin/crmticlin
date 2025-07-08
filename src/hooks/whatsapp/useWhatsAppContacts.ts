// FASE 5: Hook corrigido para dados reais do banco + paginação virtual
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useLeadSorting } from './chat/useLeadSorting';
import { useAuth } from '@/contexts/AuthContext'; // 🚀 IMPORTAR CONTEXTO DE AUTH
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

// Cache otimizado para contatos com limpeza automática
const contactsCache = new Map<string, { data: Contact[]; timestamp: number; hasMore: boolean; }>();
const CACHE_DURATION = 60 * 1000; // 🚀 AUMENTADO: 60 segundos para melhor cache com mais dados
const MAX_CACHE_SIZE = 10; // 🚀 ADICIONADO: Máximo 10 caches para evitar vazamentos de memória

// 🚀 OTIMIZAÇÃO ESPECÍFICA PARA USUÁRIOS COM MUITOS CONTATOS
const PRIORITY_USERS = [
  'contatoluizantoniooliveira@gmail.com',
  // Adicionar outros usuários conforme necessário
];

// Função para determinar limites baseados no usuário
const getContactLimits = (userEmail: string | null) => {
  const isPriorityUser = userEmail && PRIORITY_USERS.includes(userEmail.toLowerCase());
  
  if (isPriorityUser) {
    console.log(`[WhatsApp Contacts] 🚀 Usuário prioritário detectado: ${userEmail} - Aplicando limites otimizados`);
    return {
      INITIAL_CONTACTS_LIMIT: 500, // 🚀 MUITO MAIOR para usuários específicos
      CONTACTS_PAGE_SIZE: 200,     // 🚀 CARREGAMENTO MAIS AGRESSIVO
      CACHE_DURATION: 120 * 1000   // 🚀 CACHE MAIS LONGO (2 minutos)
    };
  }
  
  return {
    INITIAL_CONTACTS_LIMIT: 200,  // 🚀 PADRÃO para outros usuários
    CONTACTS_PAGE_SIZE: 100,      // 🚀 PADRÃO para outros usuários
    CACHE_DURATION: 60 * 1000     // 🚀 PADRÃO para outros usuários
  };
};

// SISTEMA DE PAGINAÇÃO VIRTUAL PARA CONTATOS
export const useWhatsAppContacts = (
  activeInstance: WhatsAppWebInstance | null,
  userId: string | null
) => {
  // 🚀 OBTER DADOS DO USUÁRIO VIA CONTEXTO DE AUTH
  const { user } = useAuth();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMoreContacts, setIsLoadingMoreContacts] = useState(false);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  const [highlightedContact, setHighlightedContact] = useState<string | null>(null);
  const [totalContactsAvailable, setTotalContactsAvailable] = useState<number>(0); // 🚀 NOVO: Total disponível
  
  // Refs para controle de sincronização
  const isLoadingRef = useRef(false);
  const syncDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchParamsRef = useRef<string>('');
  const realtimeChannelRef = useRef<any>(null);
  
  // Hook de ordenação otimizada
  const { sortLeadsByRecentMessage } = useLeadSorting();

  // 🚀 DETERMINAR LIMITES BASEADOS NO EMAIL DO USUÁRIO LOGADO
  const userEmail = user?.email || null;
  const limits = useMemo(() => getContactLimits(userEmail), [userEmail]);

  // Memoizar parâmetros para cache
  const cacheKey = useMemo(() => {
    if (!activeInstance?.id || !userId) return '';
    return `${activeInstance.id}-${userId}-${activeInstance.connection_status}`;
  }, [activeInstance?.id, userId, activeInstance?.connection_status]);

  // Verificar cache válido
  const getCachedContacts = useCallback((key: string): { data: Contact[]; hasMore: boolean; } | null => {
    const cached = contactsCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < limits.CACHE_DURATION) {
      return { data: cached.data, hasMore: cached.hasMore };
    }
    contactsCache.delete(key);
    return null;
  }, [limits.CACHE_DURATION]);

  // Salvar no cache
  const setCachedContacts = useCallback((key: string, data: Contact[], hasMore: boolean) => {
    // 🚀 LIMPEZA AUTOMÁTICA ANTES DE ADICIONAR NOVO CACHE
    cleanupCache();
    contactsCache.set(key, { data, timestamp: Date.now(), hasMore });
    console.log(`[WhatsApp Contacts] 💾 Cache salvo para: ${key} (${data.length} contatos)`);
  }, []);

  // Função para mover contato para o topo com animação fluida
  const moveContactToTop = useCallback((contactId: string, newMessage?: string) => {
    console.log('[WhatsApp Contacts] 🔄 moveContactToTop chamado para:', contactId, 'mensagem:', newMessage);
    
    setContacts(prevContacts => {
      const contactIndex = prevContacts.findIndex(c => c.id === contactId);
      if (contactIndex === -1) {
        console.log('[WhatsApp Contacts] ⚠️ Contato não encontrado na lista:', contactId);
        return prevContacts;
      }
      
      if (contactIndex === 0) {
        // Contato já está no topo, apenas atualizar dados
        const updatedContact = {
          ...prevContacts[contactIndex],
          lastMessage: newMessage || prevContacts[contactIndex].lastMessage,
          lastMessageTime: new Date().toISOString(),
          unreadCount: (prevContacts[contactIndex].unreadCount || 0) + 1
        };
        
        const newContacts = [...prevContacts];
        newContacts[0] = updatedContact;
        console.log('[WhatsApp Contacts] ✅ Contato atualizado no topo');
        return newContacts;
      }
      
      const updatedContact = {
        ...prevContacts[contactIndex],
        lastMessage: newMessage || prevContacts[contactIndex].lastMessage,
        lastMessageTime: new Date().toISOString(),
        unreadCount: (prevContacts[contactIndex].unreadCount || 0) + 1
      };
      
      const newContacts = [...prevContacts];
      newContacts.splice(contactIndex, 1);
      newContacts.unshift(updatedContact);
      
      console.log('[WhatsApp Contacts] ✅ Contato movido para o topo');
      return newContacts;
    });
  }, []);

  // Função para zerar contador de não lidas
  const markAsRead = useCallback(async (contactId: string) => {
    console.log('[WhatsApp Contacts] 🔄 Marcando mensagens como lidas para:', contactId);
    
    // Primeiro, atualizar o estado local imediatamente para UX responsiva
    setContacts(prevContacts => {
      const updatedContacts = prevContacts.map(contact => 
        contact.id === contactId 
          ? { ...contact, unreadCount: 0 }
          : contact
      );
      console.log('[WhatsApp Contacts] ✅ Estado local atualizado');
      return updatedContacts;
    });

    // Depois, atualizar no banco se houver instância real
    if (activeInstance) {
      try {
        console.log('[WhatsApp Contacts] 💾 Atualizando no banco de dados...');
        const { error } = await supabase
          .from('leads')
          .update({ 
            unread_count: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', contactId)
          .eq('created_by_user_id', userId!);

        if (error) {
          console.error('[WhatsApp Contacts] ❌ Erro ao marcar como lido:', error);
          // Reverter estado local se falhou no banco
          setContacts(prevContacts => 
            prevContacts.map(contact => 
              contact.id === contactId 
                ? { ...contact, unreadCount: contact.unreadCount } // Manter valor original
                : contact
            )
          );
        } else {
          console.log('[WhatsApp Contacts] ✅ Banco atualizado com sucesso');
          
          // Invalidar cache para garantir sincronização
          const currentCacheKey = `${activeInstance.id}-${userId}-${activeInstance.connection_status}`;
          contactsCache.delete(currentCacheKey);
          console.log('[WhatsApp Contacts] 🗑️ Cache invalidado');
        }
      } catch (error) {
        console.error('[WhatsApp Contacts] ❌ Erro inesperado ao marcar como lido:', error);
      }
    }
  }, [activeInstance, userId]);

  // FETCH COM PAGINAÇÃO VIRTUAL: CARREGAMENTO ILIMITADO
  const fetchContacts = useCallback(async (forceRefresh = false, loadMore = false): Promise<void> => {
    if (!cacheKey) {
      setContacts([]);
      setIsLoadingContacts(false);
      return;
    }

    // Proteções contra loops
    if (isLoadingRef.current && !forceRefresh) return;

    // Verificar cache primeiro (apenas para carregamento inicial)
    if (!forceRefresh && !loadMore) {
      const cached = getCachedContacts(cacheKey);
      if (cached) {
        console.log('[WhatsApp Contacts] 💾 Usando cache:', {
          contatos: cached.data.length,
          hasMore: cached.hasMore
        });
        setContacts(cached.data);
        setHasMoreContacts(cached.hasMore);
        setIsLoadingContacts(false);
        return;
      }
    }

    // 🚀 LOG INICIAL PARA DEBUG COM OTIMIZAÇÃO ESPECÍFICA
    console.log('[WhatsApp Contacts] 🚀 Iniciando fetch:', {
      userEmail,
      isPriorityUser: userEmail && PRIORITY_USERS.includes(userEmail.toLowerCase()),
      limits,
      forceRefresh,
      loadMore,
      activeInstanceId: activeInstance?.id,
      userId,
      contatosJaCarregados: contacts.length,
      cacheKey
    });

    // Debouncing para múltiplas chamadas (apenas para carregamento inicial)
    if (!loadMore && syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }

    const executeQuery = async () => {
      try {
        isLoadingRef.current = true;
        
        if (loadMore) {
          setIsLoadingMoreContacts(true);
        } else {
          setIsLoadingContacts(true);
        }

        // 🚀 CONTAR TOTAL DE CONTATOS DISPONÍVEIS PARA DEBUG
        const { count: totalContacts, error: countError } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('whatsapp_number_id', activeInstance!.id)
          .eq('created_by_user_id', userId!);

        console.log('[WhatsApp Contacts] 📊 Total de contatos disponíveis na instância:', {
          totalNaTabela: totalContacts,
          erroContagem: countError,
          instanceId: activeInstance!.id,
          userId: userId!
        });

        // 🚀 SALVAR TOTAL NO ESTADO
        if (totalContacts !== null && !countError) {
          setTotalContactsAvailable(totalContacts);
        }

        // Determinar parâmetros de paginação
        const limit = loadMore ? limits.CONTACTS_PAGE_SIZE : limits.INITIAL_CONTACTS_LIMIT;
        const offset = loadMore ? contacts.length : 0;

        // QUERY OTIMIZADA: Com paginação - sem nullsLast
        const { data: leads, error } = await supabase
          .from('leads')
          .select(`
            *,
            lead_tags(
              tag_id,
              tags(name, color)
            )
          `)
          .eq('whatsapp_number_id', activeInstance!.id)
          .eq('created_by_user_id', userId!)
          .order('last_message_time', { ascending: false, nullsFirst: false })
          .order('unread_count', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // 🚀 VERIFICAÇÃO MELHORADA PARA GARANTIR CARREGAMENTO COMPLETO
        let hasMore = false;
        
        // Calcular total já carregado
        const totalCarregados = loadMore ? contacts.length + (leads?.length || 0) : (leads?.length || 0);
        
        console.log('[WhatsApp Contacts] 📊 Análise de carregamento:', {
          leadesRetornados: leads?.length || 0,
          totalCarregados,
          totalDisponivel: totalContacts,
          limit,
          offset
        });

        // Verificar se ainda há mais contatos para carregar
        if (totalContacts && totalCarregados < totalContacts) {
          hasMore = true;
          console.log('[WhatsApp Contacts] ✅ Ainda há contatos para carregar:', {
            restantes: totalContacts - totalCarregados
          });
        } else if (leads && leads.length === limit && !totalContacts) {
          // Fallback: se não temos o total, verificar se retornou o limite completo
          hasMore = true;
          console.log('[WhatsApp Contacts] 🔄 Verificação por limite - pode haver mais contatos');
        } else {
          console.log('[WhatsApp Contacts] ⏹️ Todos os contatos foram carregados');
        }

        console.log('[WhatsApp Contacts] 📊 Resultado da query:', {
          leadesRetornados: leads?.length || 0,
          offset,
          limit,
          hasMore,
          totalCarregados: loadMore ? contacts.length + (leads?.length || 0) : leads?.length || 0,
          totalDisponivel: totalContacts,
          progressoPorcentagem: totalContacts ? Math.round(((loadMore ? contacts.length + (leads?.length || 0) : leads?.length || 0) / totalContacts) * 100) : 0
        });

        // MAPEAMENTO OTIMIZADO
        const mappedContacts: Contact[] = (leads || []).map(lead => {
          const leadWithProfilePic = lead as any;
          const leadTags = lead.lead_tags?.map((lt: any) => ({
            id: lt.tags?.id,
            name: lt.tags?.name,
            color: lt.tags?.color
          })).filter(Boolean) || [];
          
          const mappedContact = {
            id: lead.id,
            name: lead.name || `+${lead.phone}`,
            phone: lead.phone,
            email: lead.email || '',
            address: lead.address || '',
            company: lead.company || '',
            notes: lead.notes || '',
            tags: leadTags,
            lastMessage: lead.last_message || '',
            lastMessageTime: lead.last_message_time 
              ? new Date(lead.last_message_time).toISOString()
              : '',
            unreadCount: lead.unread_count && lead.unread_count > 0 ? lead.unread_count : undefined,
            avatar: '',
            profilePicUrl: leadWithProfilePic.profile_pic_url || '',
            isOnline: Math.random() > 0.7, // Fake status
            leadId: lead.id, // Adicionar leadId
            stageId: lead.kanban_stage_id // 🚀 CORREÇÃO: Adicionar stageId do banco
          };

          // 🔍 LOG DETALHADO PARA DEBUG
          if (lead.kanban_stage_id) {
            console.log('[WhatsApp Contacts] ✅ Lead com etapa mapeado:', {
              leadId: lead.id,
              name: lead.name,
              stageId: lead.kanban_stage_id,
              mappedStageId: mappedContact.stageId
            });
          } else {
            console.log('[WhatsApp Contacts] ⚠️ Lead SEM etapa:', {
              leadId: lead.id,
              name: lead.name,
              kanban_stage_id: lead.kanban_stage_id
            });
          }

          return mappedContact;
        });

        if (loadMore) {
          // Adicionar novos contatos à lista existente
          const updatedContacts = [...contacts, ...mappedContacts];
          setContacts(updatedContacts);
          setCachedContacts(cacheKey, updatedContacts, hasMore);
        } else {
          // Substituir todos os contatos
          setContacts(mappedContacts);
          setCachedContacts(cacheKey, mappedContacts, hasMore);
        }

        setHasMoreContacts(hasMore);

      } catch (error) {
        console.error('[WhatsApp Contacts] Erro ao buscar contatos:', error);
      } finally {
        isLoadingRef.current = false;
        setIsLoadingContacts(false);
        setIsLoadingMoreContacts(false);
      }
    };

    if (!loadMore) {
      syncDebounceRef.current = setTimeout(executeQuery, 100);
    } else {
      executeQuery();
    }
  }, [contacts, cacheKey, activeInstance?.id, userId, setCachedContacts, getCachedContacts, limits]);

  // Configurar subscription para mudanças nas tags e mensagens
  useEffect(() => {
    if (!activeInstance?.id || !userId) return;

    console.log('[WhatsApp Contacts] 🔄 Inicializando subscription para instância:', activeInstance.id);

    const channel = supabase
      .channel(`lead-changes-${activeInstance.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_tags',
          filter: `created_by_user_id=eq.${userId}`
        },
        () => {
          // Forçar atualização dos contatos quando houver mudança nas tags
          fetchContacts(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
          // Removendo filtro temporariamente para teste
        },
        (payload) => {
          console.log('[WhatsApp Contacts] 📨 PAYLOAD COMPLETO recebido:', JSON.stringify(payload, null, 2));
          
          // Verificar se a mensagem é da instância ativa
          if (payload.new?.whatsapp_number_id !== activeInstance.id) {
            console.log('[WhatsApp Contacts] ⚠️ Mensagem de outra instância, ignorando');
            return;
          }
          
          // Mover contato para topo quando nova mensagem chegar
          const leadId = payload.new?.lead_id;
          const messageText = payload.new?.text || payload.new?.body || '';
          
          if (leadId) {
            console.log('[WhatsApp Contacts] 📨 Nova mensagem recebida:', {
              leadId,
              messageText,
              timestamp: new Date().toISOString()
            });
            
            // Mover contato para topo com a nova mensagem
            moveContactToTop(leadId, messageText);
          } else {
            console.log('[WhatsApp Contacts] ⚠️ Mensagem sem lead_id:', payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `whatsapp_number_id=eq.${activeInstance.id}`
        },
        () => {
          // Atualizar lista quando leads forem modificados
          console.log('[WhatsApp Contacts] Lead atualizado, refrescando lista');
          fetchContacts(true);
        }
      )
      .subscribe((status) => {
        console.log('[WhatsApp Contacts] 📡 Subscription status:', status);
      });

    realtimeChannelRef.current = channel;

    return () => {
      console.log('[WhatsApp Contacts] 🔌 Removendo subscription');
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [activeInstance?.id, userId, fetchContacts, moveContactToTop]);

  // Carregar contatos iniciais
  useEffect(() => {
    if (cacheKey) {
      fetchContacts();
    }
  }, [cacheKey, fetchContacts]);

  // 🚀 LISTENER PARA REFRESH FORÇADO APÓS MUDANÇA DE ETAPA
  useEffect(() => {
    const handleRefreshContacts = () => {
      console.log('[WhatsApp Contacts] 🔄 Evento de refresh recebido - atualizando contatos...');
      fetchContacts(true); // forceRefresh = true
    };

    window.addEventListener('refreshWhatsAppContacts', handleRefreshContacts);

    return () => {
      window.removeEventListener('refreshWhatsAppContacts', handleRefreshContacts);
    };
  }, [fetchContacts]);

  // 🚀 FUNÇÃO PARA LIMPEZA AUTOMÁTICA DO CACHE
  const cleanupCache = () => {
    if (contactsCache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(contactsCache.entries());
      // Ordenar por timestamp e remover os mais antigos
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remover metade dos caches mais antigos
      const toRemove = entries.slice(0, Math.floor(entries.length / 2));
      toRemove.forEach(([key]) => contactsCache.delete(key));
      
      console.log(`[WhatsApp Contacts] 🧹 Cache limpo: removidos ${toRemove.length} caches antigos`);
    }
  };

  return {
    contacts,
    isLoadingContacts,
    isLoadingMoreContacts,
    hasMoreContacts,
    highlightedContact,
    setHighlightedContact,
    moveContactToTop,
    markAsRead,
    fetchContacts,
    loadMoreContacts: () => fetchContacts(false, true),
    totalContactsAvailable
  };
};
