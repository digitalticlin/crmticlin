
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useWhatsAppDatabase } from '@/hooks/whatsapp/useWhatsAppDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { whatsappLogger } from '@/utils/logger';
import { windowEventManager } from '@/utils/eventManager';

const CONTACTS_LIMIT = 50;
const CACHE_DURATION = 60 * 1000; // 1 minuto

// Cache global para contatos
const contactsCache = new Map<string, { data: Contact[]; timestamp: number }>();

export const useWhatsAppContacts = (activeInstanceId?: string) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  const [totalContactsAvailable, setTotalContactsAvailable] = useState(0);
  
  const { permissions } = useUserPermissions();
  const { getActiveInstance } = useWhatsAppDatabase();
  const { user } = useAuth();
  const isAdmin = permissions.canViewAllData;
  
  // Refs para controle de estado
  const lastActiveInstanceRef = useRef<string | undefined>(activeInstanceId);
  const isLoadingRef = useRef(false);
  const currentOffsetRef = useRef(0);

  // Função para buscar contatos com query corrigida
  const fetchContacts = useCallback(async (offset = 0, forceRefresh = false) => {
    if (isLoadingRef.current) return;
    
    const currentInstance = activeInstanceId || getActiveInstance()?.id;
    
    whatsappLogger.log('🔍 Fetching contacts:', {
      offset,
      forceRefresh,
      currentInstance,
      isAdmin,
      userId: user?.id
    });

    if (!currentInstance && !isAdmin) {
      whatsappLogger.warn('⚠️ No active instance for regular user');
      setContacts([]);
      return;
    }

    // Verificar cache
    const cacheKey = isAdmin ? `admin-${user?.id}` : `${currentInstance}-${user?.id}`;
    if (!forceRefresh && offset === 0) {
      const cached = contactsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[WhatsApp Contacts] 💾 Using cached data');
        setContacts(cached.data);
        return;
      }
    }

      try {
        isLoadingRef.current = true;
        
      if (offset === 0) {
        setIsLoading(true);
        } else {
        setIsLoadingMore(true);
      }

      // ✅ CORREÇÃO: Query completa com todos os campos necessários
        let query = supabase
          .from('leads')
          .select(`
          id,
          name,
          phone,
          email,
          address,
          company,
          document_id,
          notes,
          purchase_value,
          owner_id,
          last_message,
          last_message_time,
          unread_count,
          created_at,
          updated_at,
          whatsapp_number_id,
          kanban_stage_id,
          created_by_user_id
        `)
          .order('last_message_time', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });

      // 🚀 CORREÇÃO: Filtros mais simples e diretos
      if (isAdmin) {
        query = query.eq('created_by_user_id', user?.id);
        console.log('[WhatsApp Contacts] 🔒 Admin mode: filtrando por user_id:', user?.id);
      } else if (currentInstance) {
        query = query
          .eq('created_by_user_id', user?.id)
          .eq('whatsapp_number_id', currentInstance);
        console.log('[WhatsApp Contacts] 👤 User mode: filtrando por user_id + instance:', {
          userId: user?.id,
          instanceId: currentInstance
        });
      } else {
        console.log('[WhatsApp Contacts] ❌ Sem filtros válidos');
        setContacts([]);
        return;
      }

      console.log('[WhatsApp Contacts] 📡 Executando query com range:', {
        offset,
        limit: CONTACTS_LIMIT,
        total: offset + CONTACTS_LIMIT - 1
      });

      const { data: leadsData, error, count } = await query
        .range(offset, offset + CONTACTS_LIMIT - 1);

      if (error) {
        console.error('[WhatsApp Contacts] ❌ Query error:', error);
        throw error;
      }

      console.log('[WhatsApp Contacts] 📊 Query result:', {
        leadsCount: leadsData?.length || 0,
        totalCount: count,
        offset,
        hasData: !!leadsData,
        sampleLead: leadsData?.[0] ? {
          id: leadsData[0].id,
          name: leadsData[0].name,
          phone: leadsData[0].phone,
          whatsapp_number_id: leadsData[0].whatsapp_number_id
        } : null
      });

      // ✅ NOVO: Buscar tags para todos os leads em uma única query
      let tagsMap: Record<string, any[]> = {};
      if (leadsData && leadsData.length > 0) {
        const leadIds = leadsData.map(lead => lead.id);
        
        console.log('[WhatsApp Contacts] 🏷️ Buscando tags para leads:', leadIds.length);
        
        const { data: tagsData, error: tagsError } = await supabase
          .from('lead_tags')
          .select(`
            lead_id,
            tags!inner (
              id,
              name,
              color,
              created_by_user_id
            )
          `)
          .in('lead_id', leadIds)
          .eq('tags.created_by_user_id', user?.id);

        if (tagsError) {
          console.error('[WhatsApp Contacts] ❌ Erro ao buscar tags:', tagsError);
          // Não fazer throw, apenas logar
        } else {
          // Organizar tags por lead_id
          (tagsData || []).forEach(tagRelation => {
            if (!tagsMap[tagRelation.lead_id]) {
              tagsMap[tagRelation.lead_id] = [];
            }
            if (tagRelation.tags) {
              tagsMap[tagRelation.lead_id].push(tagRelation.tags);
            }
          });
          
          console.log('[WhatsApp Contacts] 🏷️ Tags carregadas:', {
            totalTagRelations: tagsData?.length || 0,
            leadsWithTags: Object.keys(tagsMap).length
          });
        }
      }

      // ✅ CORREÇÃO: Conversão completa com todos os campos INCLUINDO TAGS
      const fetchedContacts: Contact[] = (leadsData || []).map(lead => ({
        id: lead.id,
        name: lead.name || null,
        phone: lead.phone || '',
        email: lead.email,
        address: lead.address,
        company: lead.company,
        documentId: lead.document_id,
        notes: lead.notes,
        purchaseValue: lead.purchase_value,
        assignedUser: lead.owner_id, // ✅ CORREÇÃO: Mapear owner_id para assignedUser
        lastMessage: lead.last_message,
        lastMessageTime: lead.last_message_time,
        unreadCount: lead.unread_count && lead.unread_count > 0 ? lead.unread_count : undefined,
        leadId: lead.id,
        stageId: lead.kanban_stage_id || null,
        createdAt: lead.created_at,
        tags: tagsMap[lead.id] || [], // ✅ NOVO: Tags carregadas do banco
        instanceInfo: undefined
      }));

      console.log('[WhatsApp Contacts] ✅ Contacts converted:', {
        originalCount: leadsData?.length || 0,
        convertedCount: fetchedContacts.length,
        firstContact: fetchedContacts[0] ? {
          id: fetchedContacts[0].id,
          name: fetchedContacts[0].name,
          phone: fetchedContacts[0].phone
        } : null
      });

      if (offset === 0) {
        setContacts(fetchedContacts);
        // Atualizar cache
        contactsCache.set(cacheKey, {
          data: fetchedContacts,
          timestamp: Date.now()
        });
      } else {
        setContacts(prev => [...prev, ...fetchedContacts]);
      }

      setHasMoreContacts(fetchedContacts.length === CONTACTS_LIMIT);
      setTotalContactsAvailable(count || 0);
      currentOffsetRef.current = offset + fetchedContacts.length;

    } catch (error: any) {
      console.error('[WhatsApp Contacts] ❌ Error fetching contacts:', error);
      toast.error('Erro ao carregar contatos');
      
      if (offset === 0) {
        setContacts([]);
      }
      } finally {
        isLoadingRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeInstanceId, getActiveInstance, isAdmin, user?.id]);

  // Função para carregar mais contatos
  const loadMoreContacts = useCallback(async () => {
    if (hasMoreContacts && !isLoadingRef.current) {
      await fetchContacts(currentOffsetRef.current);
    }
  }, [hasMoreContacts, fetchContacts]);

  // Função para refresh
  const refreshContacts = useCallback(async () => {
    currentOffsetRef.current = 0;
    await fetchContacts(0, true);
  }, [fetchContacts]);

  // 🔝 FUNÇÃO PARA MOVER CONTATO PARA O TOPO (OTIMIZADA)
  const moveContactToTop = useCallback((contactId: string, newMessage?: any) => {
    console.log('[WhatsApp Contacts] 🔝 Movendo contato para topo:', { contactId, hasNewMessage: !!newMessage });
    
    setContacts(prevContacts => {
      if (!prevContacts || prevContacts.length === 0) return prevContacts;
      
      const contactIndex = prevContacts.findIndex(contact => contact.id === contactId);
      if (contactIndex === -1) {
        console.log('[WhatsApp Contacts] ⚠️ Contato não encontrado para mover:', contactId);
        return prevContacts;
      }
      
      const updatedContacts = [...prevContacts];
      const [contactToMove] = updatedContacts.splice(contactIndex, 1);
      
      // ✅ NOVO: Atualizar última mensagem se fornecida
      if (newMessage) {
        contactToMove.lastMessage = newMessage.text || newMessage.body || '';
        contactToMove.lastMessageTime = newMessage.created_at || newMessage.timestamp || new Date().toISOString();
        
        // ✅ Incrementar unread_count apenas se for mensagem recebida (não enviada)
        if (!newMessage.from_me && !newMessage.fromMe) {
          contactToMove.unreadCount = (contactToMove.unreadCount || 0) + 1;
        }
        
        console.log('[WhatsApp Contacts] 📝 Contato atualizado com nova mensagem:', {
          contactId,
          lastMessage: contactToMove.lastMessage.substring(0, 30),
          unreadCount: contactToMove.unreadCount,
          fromMe: newMessage.from_me || newMessage.fromMe
        });
      }
      
      // Mover para o topo
      updatedContacts.unshift(contactToMove);
      
      console.log('[WhatsApp Contacts] ✅ Contato movido para o topo com sucesso');
      return updatedContacts;
    });
  }, []);

  // 🚀 NOVA: Função para atualizar contador de mensagens não lidas
  const updateUnreadCount = useCallback((contactId: string, increment: boolean = true) => {
    setContacts(prevContacts => 
      prevContacts.map(contact => {
        if (contact.id === contactId || contact.leadId === contactId) {
          const currentCount = contact.unreadCount || 0;
          const newCount = increment ? currentCount + 1 : 0;
          
          console.log('[WhatsApp Contacts] 🔢 Atualizando contador:', {
            contactName: contact.name,
            oldCount: currentCount,
            newCount,
            increment
          });
          
          return {
            ...contact,
            unreadCount: newCount > 0 ? newCount : undefined
          };
        }
        return contact;
      })
    );
  }, []);

  // 🚀 NOVA: Função para adicionar novo contato ao topo
  const addNewContact = useCallback((newContactData: Partial<Contact>) => {
    if (!newContactData.id && !newContactData.leadId) {
      console.error('[WhatsApp Contacts] ❌ Novo contato sem ID válido');
      return;
    }

    const newContact: Contact = {
      id: newContactData.id || newContactData.leadId || '',
      name: newContactData.name || 'Novo Contato',
      phone: newContactData.phone || '',
      email: newContactData.email,
      lastMessage: newContactData.lastMessage,
      lastMessageTime: newContactData.lastMessageTime || new Date().toISOString(),
      unreadCount: newContactData.unreadCount || 1,
      leadId: newContactData.leadId || newContactData.id,
      stageId: newContactData.stageId || null,
      createdAt: newContactData.createdAt || new Date().toISOString(),
      tags: newContactData.tags || [],
      instanceInfo: newContactData.instanceInfo
    };

    setContacts(prevContacts => {
      // Verificar se contato já existe
      const existingIndex = prevContacts.findIndex(c => 
        c.id === newContact.id || c.leadId === newContact.leadId
      );
      
      if (existingIndex !== -1) {
        console.log('[WhatsApp Contacts] ⚠️ Contato já existe, movendo para topo');
        moveContactToTop(newContact.id, {
          text: newContact.lastMessage || '',
          timestamp: newContact.lastMessageTime,
          unreadCount: newContact.unreadCount
        });
        return prevContacts; // Retornar estado atual pois moveContactToTop já atualizou
      }
      
      console.log('[WhatsApp Contacts] ➕ Adicionando novo contato ao topo:', newContact.name);
      return [newContact, ...prevContacts];
    });
  }, [moveContactToTop]);

  // Efeito para carregar contatos quando instância ativa muda
  useEffect(() => {
    if (lastActiveInstanceRef.current !== activeInstanceId) {
      lastActiveInstanceRef.current = activeInstanceId;
      currentOffsetRef.current = 0;
      fetchContacts(0, true);
    }
  }, [activeInstanceId, fetchContacts]);

  // Carregamento inicial
  useEffect(() => {
    if (user?.id) {
      fetchContacts(0);
    }
  }, [user?.id, fetchContacts]);

  // ✅ LISTENER PARA REFRESH DE TAGS E ATUALIZAÇÕES DE LEADS
  useEffect(() => {
    const eventSubscriptionIds: string[] = [];
    
    const handleRefreshTags = () => {
      whatsappLogger.log('🏷️ Tags alteradas, fazendo refresh suave...');
      refreshContacts();
    };

    // ✅ NOVO LISTENER: Atualizar tags específicas de um lead
    const handleTagsUpdate = async (event: CustomEvent) => {
      const { leadId } = event.detail;
      
      if (!leadId || !user?.id) return;
      
      console.log('[WhatsApp Contacts] 🏷️ EVENTO RECEBIDO - Atualizando tags do lead:', {
        eventLeadId: leadId,
        userId: user.id
      });
      
      try {
        // Buscar tags atualizadas para este lead específico
        const { data: tagsData, error } = await supabase
          .from('lead_tags')
          .select(`
            lead_id,
            tags!inner (
              id,
              name,
              color,
              created_by_user_id
            )
          `)
          .eq('lead_id', leadId)
          .eq('tags.created_by_user_id', user.id);

        if (error) {
          console.error('[WhatsApp Contacts] ❌ Erro ao buscar tags atualizadas:', error);
          return;
        }

        const updatedTags = (tagsData || []).map(tagRelation => tagRelation.tags).filter(Boolean);
        
        console.log('[WhatsApp Contacts] 🎯 Tags encontradas no Supabase:', {
          leadId,
          tagsCount: updatedTags.length,
          tags: updatedTags.map(tag => ({ id: tag.id, name: tag.name }))
        });
        
        // Atualizar contato com novas tags
        setContacts(prevContacts => {
          console.log('[WhatsApp Contacts] 🔍 Procurando contato para atualizar:', {
            leadId,
            contactsToCheck: prevContacts.map(c => ({ 
              id: c.id, 
              leadId: c.leadId, 
              name: c.name,
              currentTagsCount: c.tags?.length || 0
            }))
          });
          
          const updatedContacts = prevContacts.map(contact => {
            // ✅ CORREÇÃO: Verificação mais robusta do leadId
            const contactLeadId = contact.leadId || contact.id;
            const isMatch = contactLeadId === leadId;
            
            console.log('[WhatsApp Contacts] 🔍 Verificando match para contato:', {
              contactId: contact.id,
              contactLeadId: contact.leadId,
              contactName: contact.name,
              eventLeadId: leadId,
              isMatch,
              contactTags: contact.tags?.length || 0
            });
            
            if (isMatch) {
              console.log('[WhatsApp Contacts] ✅ CONTATO ENCONTRADO - Atualizando tags:', {
                contactId: contact.id,
                contactLeadId: contact.leadId,
                contactName: contact.name,
                oldTagsCount: contact.tags?.length || 0,
                newTagsCount: updatedTags.length,
                oldTags: contact.tags?.map(tag => ({ id: tag.id, name: tag.name })) || [],
                newTags: updatedTags.map(tag => ({ id: tag.id, name: tag.name }))
              });
              
              // ✅ FORÇAR: Nova referência do objeto para garantir re-render
              const updatedContact = { 
                ...contact, 
                tags: [...updatedTags] // Nova array para forçar re-render
              };
              
              console.log('[WhatsApp Contacts] 🚀 CONTATO ATUALIZADO:', {
                id: updatedContact.id,
                name: updatedContact.name,
                tagsCount: updatedContact.tags?.length || 0,
                tagNames: updatedContact.tags?.map(t => t.name) || []
              });
              
              return updatedContact;
            }
            return contact;
          });
          
          console.log('[WhatsApp Contacts] 📊 RESULTADO FINAL DA ATUALIZAÇÃO:', {
            totalContacts: updatedContacts.length,
            contactsWithTags: updatedContacts.filter(c => c.tags && c.tags.length > 0).length
          });
          
          return updatedContacts;
        });
      } catch (error) {
        console.error('[WhatsApp Contacts] ❌ Erro ao atualizar tags:', error);
      }
    };

    // ✅ NOVO LISTENER: Atualizar nome do contato no cache local
    const handleContactNameUpdate = (event: CustomEvent) => {
      const { leadId, contactId, newName, oldName } = event.detail;
      
      console.log('[WhatsApp Contacts] 📝 Nome do contato atualizado:', {
        leadId,
        contactId,
        newName,
        oldName
      });
      
      // Atualizar o contato no estado local imediatamente
      setContacts(prevContacts => 
        prevContacts.map(contact => {
          if (contact.leadId === leadId || contact.id === contactId) {
            console.log('[WhatsApp Contacts] ⚡ Atualizando nome local:', {
              contactId: contact.id,
              oldName: contact.name,
              newName
            });
            return { ...contact, name: newName };
          }
          return contact;
        })
      );
      
      // Atualizar cache também
      const currentInstance = activeInstanceId || getActiveInstance()?.id;
      const cacheKey = isAdmin ? `admin-${user?.id}` : `${currentInstance}-${user?.id}`;
      const cached = contactsCache.get(cacheKey);
      if (cached) {
        const updatedData = cached.data.map(contact => {
          if (contact.leadId === leadId || contact.id === contactId) {
            return { ...contact, name: newName };
          }
          return contact;
        });
        contactsCache.set(cacheKey, {
          data: updatedData,
          timestamp: cached.timestamp
        });
        console.log('[WhatsApp Contacts] 💾 Cache atualizado com novo nome');
      }
    };

    // ✅ NOVO LISTENER: Atualizar contato completo
    const handleLeadUpdate = (event: CustomEvent) => {
      const { leadId, updatedContact } = event.detail;
      
      console.log('[WhatsApp Contacts] 🔄 Lead atualizado via evento:', {
        leadId,
        updatedContact: {
          name: updatedContact.name,
          email: updatedContact.email,
          company: updatedContact.company,
          assignedUser: updatedContact.assignedUser,
          purchaseValue: updatedContact.purchaseValue,
          tags: updatedContact.tags?.length || 0
        }
      });
      
      // Atualizar o contato no estado local imediatamente
      setContacts(prevContacts => 
        prevContacts.map(contact => {
          if (contact.leadId === leadId || contact.id === leadId) {
            const changes = Object.keys(updatedContact).filter(key => 
              contact[key as keyof Contact] !== updatedContact[key as keyof Contact]
            );
            console.log('[WhatsApp Contacts] ⚡ Atualizando contato local completo:', {
              contactId: contact.id,
              changes,
              newTags: updatedContact.tags?.length || 0,
              oldTags: contact.tags?.length || 0
            });
            return { ...contact, ...updatedContact };
          }
          return contact;
        })
      );
      
      // Atualizar cache também
      const currentInstance = activeInstanceId || getActiveInstance()?.id;
      const cacheKey = isAdmin ? `admin-${user?.id}` : `${currentInstance}-${user?.id}`;
      const cached = contactsCache.get(cacheKey);
      if (cached) {
        const updatedData = cached.data.map(contact => {
          if (contact.leadId === leadId || contact.id === leadId) {
            return { ...contact, ...updatedContact };
          }
          return contact;
        });
        contactsCache.set(cacheKey, {
          data: updatedData,
          timestamp: cached.timestamp
        });
        console.log('[WhatsApp Contacts] 💾 Cache atualizado com contato completo');
      }
    };

    // ✅ NOVO LISTENER: Mover contato para topo quando receber mensagem  
    const handleMoveContactToTop = (event: CustomEvent) => {
      const { contactId, newMessage } = event.detail;
      
      console.log('[WhatsApp Contacts] 🔝 Movendo contato para topo:', {
        contactId,
        messageText: newMessage?.text?.substring(0, 30),
        timestamp: newMessage?.timestamp
      });
      
      moveContactToTop(contactId, newMessage);
    };

    // ✅ USAR EVENT MANAGER PARA PREVENIR MEMORY LEAKS
    eventSubscriptionIds.push(
      windowEventManager.addEventListener('refreshLeadTags', handleRefreshTags),
      windowEventManager.addEventListener('leadTagsUpdated', handleTagsUpdate),
      windowEventManager.addEventListener('contactNameUpdated', handleContactNameUpdate),
      windowEventManager.addEventListener('leadUpdated', handleLeadUpdate),
      windowEventManager.addEventListener('moveContactToTop', handleMoveContactToTop)
    );

    return () => {
      // ✅ CLEANUP AUTOMÁTICO ANTI-MEMORY LEAK
      eventSubscriptionIds.forEach(id => windowEventManager.removeEventListener(id));
      whatsappLogger.debug('🧹 Event listeners removidos do useWhatsAppContacts');
    };
  }, [refreshContacts, activeInstanceId, getActiveInstance, isAdmin, user?.id]);

  return {
    contacts,
    isLoading,
    isLoadingMore,
    hasMoreContacts,
    totalContactsAvailable,
    loadMoreContacts,
    refreshContacts,
    moveContactToTop,
    updateUnreadCount,
    addNewContact
  };
};
