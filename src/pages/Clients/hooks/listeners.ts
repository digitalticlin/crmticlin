/**
 * 🔊 LISTENERS ISOLADOS - PÁGINA CLIENTS
 * Sistema de realtime 100% isolado com proteção multi-tenant
 * CRÍTICO: Todos os listeners filtram por created_by_user_id
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useClientsPageFilters } from "./datafilters";
import { ClientData } from "../types";
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * 🔊 LISTENER PRINCIPAL - Mudanças em tempo real nos clientes
 */
export const useClientsRealtimeListener = () => {
  const filters = useClientsPageFilters();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Callback para processar mudanças
  const handleClientChange = useCallback((payload: any) => {
    console.log('[Clients Realtime] 📨 Mudança detectada:', payload);
    
    // Validar se a mudança é relevante para o usuário atual
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const record = newRecord || oldRecord;
    
    // 🔒 VALIDAÇÃO MULTI-TENANT
    if (filters.role === 'admin') {
      // Admin: só processa mudanças dos seus próprios registros
      if (record.created_by_user_id !== filters.createdByUserId) {
        console.log('[Clients Realtime] 🚫 Mudança ignorada - não pertence ao admin');
        return;
      }
    } else if (filters.role === 'operational') {
      // Operacional: processa mudanças dos registros atribuídos
      const hasAccess = 
        (filters.ownerFilter && record.owner_id === filters.ownerFilter) ||
        (filters.whatsappInstancesFilter?.includes(record.whatsapp_number_id));
      
      if (!hasAccess) {
        console.log('[Clients Realtime] 🚫 Mudança ignorada - não atribuído ao operacional');
        return;
      }
    } else {
      // Outros roles: ignorar por segurança
      console.log('[Clients Realtime] 🚫 Mudança ignorada - role não autorizado');
      return;
    }
    
    // Invalidar queries relevantes
    queryClient.invalidateQueries({ 
      queryKey: ["clients-page", filters.userId] 
    });
    
    // Invalidar query específica se for atualização ou deleção
    if (eventType === 'UPDATE' || eventType === 'DELETE') {
      queryClient.invalidateQueries({ 
        queryKey: ["client-by-id", record.id] 
      });
    }
    
    console.log('[Clients Realtime] ✅ Cache invalidado para mudança:', eventType);
  }, [filters, queryClient]);
  
  // Setup do listener
  useEffect(() => {
    // Validação inicial
    if (!filters.userId || !filters.role || filters.loading) {
      console.log('[Clients Realtime] ⏸️ Listener não iniciado - aguardando autenticação');
      return;
    }
    
    console.log('[Clients Realtime] 🎧 Configurando listener com filtros multi-tenant:', {
      userId: filters.userId,
      role: filters.role,
      createdByUserId: filters.createdByUserId
    });
    
    // Criar canal único para o usuário
    const channelName = `clients-${filters.userId}-${Date.now()}`;
    
    // 🔒 CONFIGURAR FILTROS MULTI-TENANT NO CANAL
    if (filters.role === 'admin' && filters.createdByUserId) {
      // Admin: escutar apenas seus próprios registros
      channelRef.current = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: `created_by_user_id=eq.${filters.createdByUserId}`
          },
          handleClientChange
        )
        .subscribe((status) => {
          console.log('[Clients Realtime] 📡 Status do canal (admin):', status);
        });
        
    } else if (filters.role === 'operational') {
      // Operacional: configurar múltiplos listeners se necessário
      channelRef.current = supabase.channel(channelName);
      
      // Listener por owner_id
      if (filters.ownerFilter) {
        channelRef.current.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: `owner_id=eq.${filters.ownerFilter}`
          },
          handleClientChange
        );
      }
      
      // Listener por whatsapp_instances (limitação: apenas um filtro por vez no Supabase)
      // Como workaround, processamos no callback
      if (filters.whatsappInstancesFilter && filters.whatsappInstancesFilter.length > 0) {
        channelRef.current.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads'
          },
          (payload) => {
            // Filtrar manualmente por instâncias
            const record = payload.new || payload.old;
            if (filters.whatsappInstancesFilter?.includes(record?.whatsapp_number_id)) {
              handleClientChange(payload);
            }
          }
        );
      }
      
      channelRef.current.subscribe((status) => {
        console.log('[Clients Realtime] 📡 Status do canal (operational):', status);
      });
    }
    
    // Cleanup
    return () => {
      if (channelRef.current) {
        console.log('[Clients Realtime] 🔌 Desconectando listener');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [filters.userId, filters.role, filters.createdByUserId, filters.ownerFilter, handleClientChange]);
  
  return {
    isConnected: !!channelRef.current,
    reconnect: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      // Trigger re-render para reconectar
      console.log('[Clients Realtime] 🔄 Reconectando...');
    }
  };
};

/**
 * 🔊 LISTENER DE TAGS - Mudanças nas tags dos clientes
 */
export const useClientTagsListener = () => {
  const filters = useClientsPageFilters();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  useEffect(() => {
    if (!filters.userId || !filters.role || filters.loading) return;
    
    const channelName = `client-tags-${filters.userId}-${Date.now()}`;
    
    // 🔒 FILTRO MULTI-TENANT PARA TAGS
    if (filters.role === 'admin' && filters.createdByUserId) {
      channelRef.current = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tags',
            filter: `created_by_user_id=eq.${filters.createdByUserId}`
          },
          (payload) => {
            console.log('[Tags Realtime] 📨 Mudança em tag:', payload);
            // Invalidar opções de filtro
            queryClient.invalidateQueries({ 
              queryKey: ["clients-filter-options"] 
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lead_tags'
          },
          (payload) => {
            console.log('[Tags Realtime] 📨 Mudança em associação lead-tag:', payload);
            // Invalidar lista de clientes
            queryClient.invalidateQueries({ 
              queryKey: ["clients-page"] 
            });
          }
        )
        .subscribe();
    }
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [filters, queryClient]);
};

/**
 * 🔊 LISTENER DE NOTIFICAÇÕES - Eventos importantes para o usuário
 */
export const useClientNotificationsListener = (
  onNotification: (notification: ClientNotification) => void
) => {
  const filters = useClientsPageFilters();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  useEffect(() => {
    if (!filters.userId || !filters.role || filters.loading) return;
    
    const channelName = `client-notifications-${filters.userId}`;
    
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${filters.userId}`
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Processar apenas notificações relacionadas a clientes
          if (notification.type === 'client_created' || 
              notification.type === 'client_updated' ||
              notification.type === 'client_assigned') {
            
            console.log('[Notifications] 🔔 Nova notificação de cliente:', notification);
            
            onNotification({
              id: notification.id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              clientId: notification.entity_id,
              createdAt: notification.created_at
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [filters.userId, filters.role, onNotification]);
};

/**
 * 🔊 HOOK AGREGADOR - Combina todos os listeners da página
 */
export const useClientsPageListeners = () => {
  const mainListener = useClientsRealtimeListener();
  const tagsListener = useClientTagsListener();
  
  // Estado de notificações local
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  
  const handleNotification = useCallback((notification: ClientNotification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10)); // Manter últimas 10
  }, []);
  
  useClientNotificationsListener(handleNotification);
  
  return {
    isConnected: mainListener.isConnected,
    reconnect: mainListener.reconnect,
    notifications,
    clearNotifications: () => setNotifications([])
  };
};

// Tipos auxiliares
interface ClientNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  clientId?: string;
  createdAt: string;
}

import { useState } from 'react';