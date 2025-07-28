
/**
 * 🎯 HOOK PARA CONTATOS WHATSAPP - OTIMIZADO FASE 1
 * 
 * OTIMIZAÇÕES FASE 1:
 * ✅ Callbacks granulares para useChatsRealtime
 * ✅ Função moveContactToTop funcional
 * ✅ Menos refreshes desnecessários
 * ✅ Melhor performance com memoização
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useAuth } from '@/contexts/AuthContext';
import { useChatsRealtime } from './realtime/useChatsRealtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UseWhatsAppContactsProps {
  activeInstanceId: string | null;
}

export const useWhatsAppContacts = ({
  activeInstanceId
}: UseWhatsAppContactsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshCounter, setRefreshCounter] = useState(0);

  // 🚀 FASE 1: Função para mover contato para o topo
  const moveContactToTop = useCallback((contactId: string, messageInfo: { text: string; timestamp: string; unreadCount?: number }) => {
    console.log('[WhatsApp Contacts] 📍 Movendo contato para o topo FASE 1:', {
      contactId,
      messageInfo
    });

    queryClient.setQueryData(['whatsapp-contacts', activeInstanceId], (oldData: Contact[] | undefined) => {
      if (!oldData) return oldData;

      const contactIndex = oldData.findIndex(c => c.id === contactId);
      if (contactIndex === -1) return oldData;

      const updatedContacts = [...oldData];
      const contactToMove = { ...updatedContacts[contactIndex] };
      
      // Atualizar dados do contato
      contactToMove.lastMessage = messageInfo.text;
      contactToMove.lastMessageTime = messageInfo.timestamp;
      if (messageInfo.unreadCount !== undefined) {
        contactToMove.unreadCount = (contactToMove.unreadCount || 0) + messageInfo.unreadCount;
      }

      // Remover da posição atual e adicionar no topo
      updatedContacts.splice(contactIndex, 1);
      updatedContacts.unshift(contactToMove);

      console.log('[WhatsApp Contacts] ✅ Contato movido para o topo FASE 1:', contactToMove);
      return updatedContacts;
    });
  }, [queryClient, activeInstanceId]);

  // 🚀 FASE 1: Função para atualizar contador de não lidas
  const updateUnreadCount = useCallback((contactId: string, increment: boolean = true) => {
    console.log('[WhatsApp Contacts] 🔢 Atualizando contador não lidas FASE 1:', {
      contactId,
      increment
    });

    queryClient.setQueryData(['whatsapp-contacts', activeInstanceId], (oldData: Contact[] | undefined) => {
      if (!oldData) return oldData;

      return oldData.map(contact => {
        if (contact.id === contactId) {
          const currentCount = contact.unreadCount || 0;
          const newCount = increment ? currentCount + 1 : Math.max(0, currentCount - 1);
          
          console.log('[WhatsApp Contacts] 🔢 Contador atualizado FASE 1:', {
            contactId,
            oldCount: currentCount,
            newCount
          });

          return {
            ...contact,
            unreadCount: newCount
          };
        }
        return contact;
      });
    });
  }, [queryClient, activeInstanceId]);

  // 🚀 FASE 1: Função para adicionar novo contato
  const addNewContact = useCallback((contactData: Partial<Contact>) => {
    console.log('[WhatsApp Contacts] ➕ Adicionando novo contato FASE 1:', contactData);

    const newContact: Contact = {
      id: contactData.id || '',
      leadId: contactData.leadId || contactData.id || '',
      name: contactData.name || 'Novo Contato',
      phone: contactData.phone || '',
      email: contactData.email,
      lastMessage: contactData.lastMessage || 'Nova conversa',
      lastMessageTime: contactData.lastMessageTime || new Date().toISOString(),
      unreadCount: contactData.unreadCount || 1,
      stageId: contactData.stageId,
      createdAt: contactData.createdAt || new Date().toISOString(),
      avatar: contactData.avatar,
      tags: contactData.tags || [],
      notes: contactData.notes,
      profilePicUrl: contactData.profilePicUrl,
      isActive: true
    };

    queryClient.setQueryData(['whatsapp-contacts', activeInstanceId], (oldData: Contact[] | undefined) => {
      if (!oldData) return [newContact];

      // Verificar se contato já existe
      const exists = oldData.some(c => c.id === newContact.id);
      if (exists) {
        console.log('[WhatsApp Contacts] ⚠️ Contato já existe, ignorando FASE 1');
        return oldData;
      }

      // Adicionar no topo
      return [newContact, ...oldData];
    });

    console.log('[WhatsApp Contacts] ✅ Novo contato adicionado FASE 1:', newContact);
  }, [queryClient, activeInstanceId]);

  // 🚀 FASE 1: Query otimizada para buscar contatos
  const {
    data: contacts = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['whatsapp-contacts', activeInstanceId, refreshCounter],
    queryFn: async () => {
      if (!activeInstanceId || !user) {
        return [];
      }

      console.log('[WhatsApp Contacts] 📥 Buscando contatos FASE 1:', {
        instanceId: activeInstanceId,
        userId: user.id
      });

      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          last_message,
          last_message_time,
          unread_count,
          kanban_stage_id,
          created_at,
          avatar,
          notes,
          profile_pic_url,
          whatsapp_number_id,
          tags
        `)
        .eq('whatsapp_number_id', activeInstanceId)
        .eq('created_by_user_id', user.id)
        .order('last_message_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[WhatsApp Contacts] ❌ Erro ao buscar contatos FASE 1:', error);
        throw error;
      }

      const convertedContacts: Contact[] = (data || []).map(lead => ({
        id: lead.id,
        leadId: lead.id,
        name: lead.name || lead.phone || 'Contato',
        phone: lead.phone || '',
        email: lead.email || undefined,
        lastMessage: lead.last_message || 'Sem mensagens',
        lastMessageTime: lead.last_message_time || lead.created_at,
        unreadCount: lead.unread_count || 0,
        stageId: lead.kanban_stage_id,
        createdAt: lead.created_at,
        avatar: lead.avatar,
        tags: lead.tags || [],
        notes: lead.notes,
        profilePicUrl: lead.profile_pic_url,
        isActive: true
      }));

      console.log('[WhatsApp Contacts] ✅ Contatos carregados FASE 1:', {
        count: convertedContacts.length,
        instanceId: activeInstanceId
      });

      return convertedContacts;
    },
    enabled: !!activeInstanceId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 2
  });

  // 🚀 FASE 1: Configurar realtime com callbacks granulares
  useChatsRealtime({
    userId: user?.id || null,
    activeInstanceId: activeInstanceId || null,
    onMoveContactToTop: moveContactToTop,
    onUpdateUnreadCount: updateUnreadCount,
    onAddNewContact: addNewContact,
    // Callbacks de fallback (menos eficientes)
    onContactsRefresh: () => {
      console.log('[WhatsApp Contacts] 🔄 Refresh de fallback FASE 1');
      setRefreshCounter(prev => prev + 1);
    }
  });

  // 🚀 FASE 1: Função para refresh manual otimizada
  const refreshContacts = useCallback(() => {
    console.log('[WhatsApp Contacts] 🔄 Refresh manual FASE 1');
    setRefreshCounter(prev => prev + 1);
  }, []);

  // 🚀 FASE 1: Função para marcar mensagem como lida
  const markAsRead = useCallback(async (contactId: string) => {
    if (!activeInstanceId) return;

    try {
      await supabase
        .from('leads')
        .update({ unread_count: 0 })
        .eq('id', contactId)
        .eq('whatsapp_number_id', activeInstanceId);

      // Atualizar localmente
      updateUnreadCount(contactId, false);
      
      console.log('[WhatsApp Contacts] ✅ Marcado como lido FASE 1:', contactId);
    } catch (error) {
      console.error('[WhatsApp Contacts] ❌ Erro ao marcar como lido FASE 1:', error);
    }
  }, [activeInstanceId, updateUnreadCount]);

  // 🚀 FASE 1: Estatísticas memoizadas
  const stats = useMemo(() => {
    const totalContacts = contacts.length;
    const unreadContacts = contacts.filter(c => c.unreadCount && c.unreadCount > 0).length;
    const totalUnreadMessages = contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    return {
      totalContacts,
      unreadContacts,
      totalUnreadMessages,
      activeInstance: activeInstanceId || null
    };
  }, [contacts, activeInstanceId]);

  return {
    contacts,
    isLoading,
    error,
    refreshContacts,
    markAsRead,
    stats,
    // 🚀 FASE 1: Funções granulares expostas
    moveContactToTop,
    updateUnreadCount,
    addNewContact,
    // 🚀 CORREÇÃO: Adicionar propriedades ausentes
    isLoadingMore: false,
    hasMoreContacts: false,
    loadMoreContacts: async () => {},
    totalContactsAvailable: contacts.length
  };
};
