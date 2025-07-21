
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useWhatsAppDatabase } from '@/hooks/whatsapp/useWhatsAppDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
    
    console.log('[WhatsApp Contacts] 🔍 Fetching contacts:', {
      offset,
      forceRefresh,
      currentInstance,
      isAdmin,
      userId: user?.id
    });

    if (!currentInstance && !isAdmin) {
      console.log('[WhatsApp Contacts] ⚠️ No active instance for regular user');
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

      // Query corrigida com junção específica
      let query = supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          last_message,
          last_message_time,
          unread_count,
          created_at,
          updated_at,
          whatsapp_number_id,
          whatsapp_instances!leads_whatsapp_number_id_fkey (
            id,
            instance_name,
            phone,
            connection_status
          )
        `)
        .order('last_message_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      // Filtros baseados em permissões
      if (isAdmin) {
        query = query.eq('created_by_user_id', user?.id);
      } else if (currentInstance) {
        query = query
          .eq('created_by_user_id', user?.id)
          .eq('whatsapp_number_id', currentInstance);
      }

      const { data: leadsData, error, count } = await query
        .range(offset, offset + CONTACTS_LIMIT - 1)
        .returns<any[]>();

      if (error) {
        console.error('[WhatsApp Contacts] ❌ Query error:', error);
        throw error;
      }

      console.log('[WhatsApp Contacts] 📊 Query result:', {
        leadsCount: leadsData?.length || 0,
        totalCount: count,
        sampleLead: leadsData?.[0]
      });

      // Converter leads para contatos
      const fetchedContacts: Contact[] = (leadsData || []).map(lead => ({
        id: lead.id,
        name: lead.name || 'Contato sem nome',
        phone: lead.phone || '',
        email: lead.email,
        lastMessage: lead.last_message,
        lastMessageTime: lead.last_message_time,
        unreadCount: lead.unread_count || 0,
        leadId: lead.id,
        createdAt: lead.created_at,
        instanceInfo: lead.whatsapp_instances ? {
          name: lead.whatsapp_instances.instance_name,
          status: lead.whatsapp_instances.connection_status,
          phone: lead.whatsapp_instances.phone
        } : undefined
      }));

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

  return {
    contacts,
    isLoading,
    isLoadingMore,
    hasMoreContacts,
    totalContactsAvailable,
    loadMoreContacts,
    refreshContacts
  };
};
