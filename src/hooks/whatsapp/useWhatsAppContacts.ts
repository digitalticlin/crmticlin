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
const MAX_CACHE_SIZE = 10; // Máximo 10 caches para evitar vazamentos de memória

// 🚀 CONFIGURAÇÃO BALANCEADA PARA MULTI-TENANT
const CONTACT_LIMITS = {
  INITIAL_CONTACTS_LIMIT: 50,  // 🚀 REDUZIDO: Carregamento inicial leve para multi-tenant
  CONTACTS_PAGE_SIZE: 50,      // 🚀 REDUZIDO: Paginação moderada para performance
  CACHE_DURATION: 120 * 1000   // 🚀 MANTIDO: Cache de 2 minutos
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
  const lastLoadMoreTimeRef = useRef(0); // 🚀 NOVO: Para evitar loads muito frequentes
  const contactsCountRef = useRef(0); // 🚀 NOVO: Para manter count atualizado
  
  // Hook de ordenação otimizada
  const { sortLeadsByRecentMessage } = useLeadSorting();

  // 🚀 EMAIL DO USUÁRIO PARA LOGS (apenas informativo)
  const userEmail = user?.email || null;

  // 🚀 MANTER REF SINCRONIZADA COM ESTADO DOS CONTATOS
  useEffect(() => {
    contactsCountRef.current = contacts.length;
  }, [contacts.length]);

  // 🚀 CACHE KEY ESTÁVEL: Removido connection_status para evitar resets frequentes
  const cacheKey = useMemo(() => {
    if (!activeInstance?.id || !userId) return '';
    return `${activeInstance.id}-${userId}`;
  }, [activeInstance?.id, userId]);

  // Verificar cache válido
  const getCachedContacts = useCallback((key: string): { data: Contact[]; hasMore: boolean; } | null => {
    const cached = contactsCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < CONTACT_LIMITS.CACHE_DURATION) {
      return { data: cached.data, hasMore: cached.hasMore };
    }
    contactsCache.delete(key);
    return null;
  }, []);

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
    
    // 🚀 EVITAR RACE CONDITION: Não mover contatos durante carregamento
    if (isLoadingRef.current) {
      console.log('[WhatsApp Contacts] ⚠️ Pulando moveContactToTop - carregamento em andamento');
      return;
    }
    
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
          const currentCacheKey = `${activeInstance.id}-${userId}`;
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
      limits: CONTACT_LIMITS,
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

        // Determinar parâmetros de paginação usando ref atualizado
        const currentContactsCount = loadMore ? contactsCountRef.current : 0;
        const limit = loadMore ? CONTACT_LIMITS.CONTACTS_PAGE_SIZE : CONTACT_LIMITS.INITIAL_CONTACTS_LIMIT;
        const offset = currentContactsCount;

        console.log('[WhatsApp Contacts] 🔍 DEBUG ESPECÍFICO - Parâmetros da query:', {
          loadMore,
          limit,
          offset,
          rangeStart: offset,
          rangeEnd: offset + limit - 1,
          totalContatosJaCarregados: currentContactsCount,
          instanceId: activeInstance!.id,
          userId: userId!,
          queryRange: `${offset} até ${offset + limit - 1}`
        });

        // QUERY OTIMIZADA: Simplificada para evitar problemas de paginação
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
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // ✅ LÓGICA SIMPLIFICADA PARA hasMore
        let hasMore = false;
        const leadesRetornados = leads?.length || 0;
        
        console.log('[WhatsApp Contacts] 📊 Análise de carregamento:', {
          leadesRetornados,
          limit,
          offset,
          loadMore,
          contatosJaCarregados: currentContactsCount,
          totalDisponivel: totalContacts
        });

        // ✅ LÓGICA PRINCIPAL: Se retornou dados
        if (leadesRetornados > 0) {
          // Se retornou menos que o limite solicitado = fim da lista
          if (leadesRetornados < limit) {
            hasMore = false;
            console.log('[WhatsApp Contacts] ⏹️ FIM - Retornou menos que o limite:', {
              retornou: leadesRetornados,
              limite: limit
            });
          } else {
            // Retornou o limite completo = provavelmente há mais
          hasMore = true;
            console.log('[WhatsApp Contacts] ✅ Retornou limite completo - há mais contatos:', {
              retornou: leadesRetornados,
              limite: limit
          });
          }
        } else {
          // Não retornou nenhum dado = fim
          hasMore = false;
          console.log('[WhatsApp Contacts] ⏹️ FIM - Nenhum dado retornado');
        }

        // 🚀 LOG SUPER DETALHADO PARA DETECTAR PROBLEMA ESPECÍFICO
        const contatosJaCarregadosParaLog = loadMore ? currentContactsCount + leadesRetornados : leadesRetornados;
        console.log('[WhatsApp Contacts] 🔍 ANÁLISE DETALHADA DO HASMORE:', {
          hasMoreCalculado: hasMore,
          cenarios: {
            'leadesRetornados > 0': leadesRetornados > 0,
            'totalContacts existe': !!(totalContacts && totalContacts > 0),
            'contatosJaCarregados >= totalContacts': contatosJaCarregadosParaLog >= totalContacts,
            'leadesRetornados < limit': leadesRetornados < limit,
            'leadesRetornados === limit': leadesRetornados === limit
          },
          valores: {
            leadesRetornados,
            limit,
            contatosJaCarregadosParaLog,
            totalContacts,
            loadMore,
            contatosListaAtual: currentContactsCount
          }
        });

        console.log('[WhatsApp Contacts] 📊 Resultado da query:', {
          leadesRetornados,
          offset,
          limit,
          hasMore,
          totalCarregadosAgora: loadMore ? currentContactsCount + leadesRetornados : leadesRetornados,
          totalDisponivel: totalContacts
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
          // Adicionar novos contatos à lista existente usando callback para garantir estado atualizado
          setContacts(prevContacts => {
            // 🚀 USAR PREVCONTACTS.LENGTH CORRETO PARA DEBUG
            console.log('[WhatsApp Contacts] 🔍 Verificação de duplicatas:', {
              contatosExistentes: prevContacts.length,
              novosMapeados: mappedContacts.length,
              offsetUsadoNaQuery: offset,
              offsetCorretoDeveriaSer: prevContacts.length
            });
            
            // 🚀 VERIFICAÇÃO: Se offset estava errado, significa que a query trouxe dados duplicados
            if (offset !== prevContacts.length) {
              console.warn('[WhatsApp Contacts] ⚠️ OFFSET INCORRETO! Query usou offset desatualizado:', {
                offsetUsado: offset,
                offsetCorreto: prevContacts.length,
                diferenca: Math.abs(offset - prevContacts.length)
              });
            }
            
            // 🚀 FILTRAR DUPLICATAS: Remover contatos que já existem na lista
            const existingContactIds = new Set(prevContacts.map(contact => contact.id));
            const newContactsOnly = mappedContacts.filter(contact => !existingContactIds.has(contact.id));
            
            console.log('[WhatsApp Contacts] 🔍 Resultado da filtragem:', {
              contatosExistentes: prevContacts.length,
              novosMapeados: mappedContacts.length,
              novosUnicos: newContactsOnly.length,
              duplicatasRemovidas: mappedContacts.length - newContactsOnly.length
            });
            
            const updatedContacts = [...prevContacts, ...newContactsOnly];
          setCachedContacts(cacheKey, updatedContacts, hasMore);
            return updatedContacts;
          });
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
  }, [cacheKey, activeInstance?.id, userId, setCachedContacts, getCachedContacts]); // 🚀 REMOVIDO 'contacts' das dependências para evitar loops

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
        (payload) => {
          // ✅ CORREÇÃO CRÍTICA: Não resetar lista - mudanças em tags não justificam reset completo
          console.log('[WhatsApp Contacts] Tag alterada - mantendo paginação:', payload);
          
          // 🚀 ESTRATÉGIA: Tags não afetam a ordem da lista, apenas invalidar cache específico se necessário
          const affectedLeadId = (payload.new as any)?.lead_id || (payload.old as any)?.lead_id;
          if (affectedLeadId) {
            console.log('[WhatsApp Contacts] ✅ Tag alterada para lead:', affectedLeadId, '- paginação preservada');
            
            // Apenas invalidar cache específico se necessário, sem resetar lista
            const currentCacheKey = `${activeInstance.id}-${userId}`;
            if (contactsCache.has(currentCacheKey)) {
              const cacheEntry = contactsCache.get(currentCacheKey);
              if (cacheEntry) {
                // Manter dados mas marcar para refresh próximo se necessário
                cacheEntry.timestamp = Date.now() - (CONTACT_LIMITS.CACHE_DURATION * 0.8); // 80% do cache duration
              }
            }
          }
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
        (payload) => {
          // ✅ CORREÇÃO CRÍTICA: Não resetar lista - atualizar contato específico
          console.log('[WhatsApp Contacts] Lead atualizado - atualizando contato específico:', payload.new?.id);
          
          const leadId = payload.new?.id;
          if (leadId) {
            // 🚀 PRESERVAR PAGINAÇÃO: Apenas atualizar contato específico sem resetar lista
            setContacts(prevContacts => {
              const updatedContacts = prevContacts.map(contact => {
                if (contact.id === leadId || contact.leadId === leadId) {
                  return {
                    ...contact,
                    // Atualizar campos específicos que podem ter mudado
                    name: payload.new?.name || contact.name,
                    stageId: payload.new?.stage_id || contact.stageId,
                    lastMessage: payload.new?.last_message || contact.lastMessage,
                    lastMessageTime: payload.new?.last_message_time || contact.lastMessageTime
                  };
                }
                return contact;
              });
              
              console.log('[WhatsApp Contacts] ✅ Contato atualizado sem resetar paginação');
              return updatedContacts;
            });
          }
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

  // 🚀 CARREGAMENTO INICIAL INTELIGENTE: Apenas se lista estiver vazia
  useEffect(() => {
    if (cacheKey && contacts.length === 0) {
      console.log('[WhatsApp Contacts] 🚀 Lista vazia - fazendo carregamento inicial');
      fetchContacts();
    }
  }, [cacheKey, fetchContacts, contacts.length]);

  // 🚀 LISTENER PARA REFRESH FORÇADO APÓS MUDANÇA DE ETAPA - COM DEBOUNCE INTELIGENTE
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout | null = null;
    
    const handleRefreshContacts = () => {
      console.log('[WhatsApp Contacts] 🔄 Evento de refresh recebido - aplicando debounce inteligente...');
      
      // 🚀 DEBOUNCE: Evitar múltiplos refreshes em sequência
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      debounceTimeout = setTimeout(() => {
        console.log('[WhatsApp Contacts] ⚡ Executando refresh após debounce');
        
        // 🚀 ESTRATÉGIA INTELIGENTE: Apenas invalidar cache em vez de reset completo
        if (cacheKey) {
          console.log('[WhatsApp Contacts] 🗑️ Invalidando cache para refresh suave');
          contactsCache.delete(cacheKey);
          
          // Se lista estiver vazia, fazer fetch completo
          if (contacts.length === 0) {
            console.log('[WhatsApp Contacts] 📥 Lista vazia - fazendo fetch inicial');
            fetchContacts(true);
          } else {
            console.log('[WhatsApp Contacts] ✅ Lista preservada - cache invalidado para próximo refresh');
          }
        }
      }, 2000); // 2 segundos de debounce para agrupar múltiplos eventos
    };

    window.addEventListener('refreshWhatsAppContacts', handleRefreshContacts);

    return () => {
      window.removeEventListener('refreshWhatsAppContacts', handleRefreshContacts);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchContacts, cacheKey, contacts.length]);

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

  // 🚀 FUNÇÃO LOADMORE SIMPLIFICADA - DEPENDÊNCIAS CORRIGIDAS
  const loadMoreContacts = useCallback(async () => {
    console.log('[WhatsApp Contacts] 🔄 LoadMore chamado:', {
      hasMoreContacts,
      isLoadingContacts,
      isLoadingMoreContacts,
      totalContacts: contacts.length
    });

    // ✅ PROTEÇÕES BÁSICAS
    if (!hasMoreContacts) {
      console.log('[WhatsApp Contacts] 🚫 LoadMore bloqueado - hasMore = false');
      return;
    }

    if (isLoadingContacts || isLoadingMoreContacts) {
      console.log('[WhatsApp Contacts] 🚫 LoadMore bloqueado - já carregando');
      return;
    }

    // ✅ THROTTLING SIMPLES
    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadMoreTimeRef.current;
    if (timeSinceLastLoad < 500) { // Reduzido para 500ms
      console.log('[WhatsApp Contacts] 🚫 LoadMore bloqueado - throttling');
      return;
    }

    lastLoadMoreTimeRef.current = now;
    console.log('[WhatsApp Contacts] ✅ LoadMore executando fetchContacts...');
    await fetchContacts(false, true);
  }, [hasMoreContacts, isLoadingContacts, isLoadingMoreContacts, fetchContacts]); // 🚀 REMOVIDO contacts.length que causava loop infinito!

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
    loadMoreContacts,
    totalContactsAvailable
  };
};
