/**
 * 🔊 LISTENERS ISOLADOS - PÁGINA SALESFUNNEL
 * Sistema de realtime 100% isolado com proteção multi-tenant
 * CRÍTICO: Corrige vazamentos de realtime do sistema atual
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useSalesFunnelPageFilters,
  validateLeadAccess,
  validateStageAccess 
} from "./datafilters";
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * 🔊 LISTENER PRINCIPAL - Mudanças em leads do funil
 */
export const useSalesFunnelLeadsListener = () => {
  const filters = useSalesFunnelPageFilters();
  const queryClient = useQueryClient();
  const channelsRef = useRef<RealtimeChannel[]>([]);
  
  const handleLeadChange = useCallback((payload: any) => {
    console.log('[SalesFunnel Realtime] 📨 Mudança em lead:', payload);
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const record = newRecord || oldRecord;
    
    // 🔒 VALIDAÇÃO MULTI-TENANT OBRIGATÓRIA
    if (!validateLeadAccess(record, filters)) {
      console.log('[SalesFunnel Realtime] 🚫 Mudança ignorada - sem acesso ao lead');
      return;
    }
    
    // Invalidar cache de leads
    queryClient.invalidateQueries({ 
      queryKey: ["salesfunnel-leads", filters.userId] 
    });
    
    // Se for movimentação de estágio, invalidar dados relacionados
    if (eventType === 'UPDATE' && 
        oldRecord?.kanban_stage_id !== newRecord?.kanban_stage_id) {
      console.log('[SalesFunnel Realtime] 📊 Lead movido entre estágios');
      queryClient.invalidateQueries({ 
        queryKey: ["salesfunnel-stages"] 
      });
    }
    
    console.log('[SalesFunnel Realtime] ✅ Cache invalidado para lead:', record.id);
  }, [filters, queryClient]);
  
  useEffect(() => {
    if (!filters.userId || !filters.role || filters.loading) {
      console.log('[SalesFunnel Realtime] ⏸️ Listener não iniciado - aguardando autenticação');
      return;
    }
    
    console.log('[SalesFunnel Realtime] 🎧 Configurando listener de leads com proteção multi-tenant');
    
    // Limpar canais anteriores
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
    
    // 🔒 CONFIGURAR LISTENERS COM FILTROS MULTI-TENANT
    
    // 1. Listener para ADMIN - filtra por created_by_user_id
    if (filters.role === 'admin' && filters.createdByUserId) {
      const adminChannel = supabase
        .channel(`salesfunnel-admin-${filters.userId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: `created_by_user_id=eq.${filters.createdByUserId}`
          },
          handleLeadChange
        )
        .subscribe((status) => {
          console.log('[SalesFunnel Realtime] 📡 Status admin channel:', status);
        });
      
      channelsRef.current.push(adminChannel);
    }
    
    // 2. Listener para OPERACIONAL - múltiplos filtros
    else if (filters.role === 'operational') {
      
      // Por owner_id (leads atribuídos)
      if (filters.ownerFilter) {
        const ownerChannel = supabase
          .channel(`salesfunnel-owner-${filters.userId}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'leads',
              filter: `owner_id=eq.${filters.ownerFilter}`
            },
            handleLeadChange
          )
          .subscribe();
        
        channelsRef.current.push(ownerChannel);
      }
      
      // Por instâncias WhatsApp (limitação do Supabase: só um filtro por canal)
      if (filters.whatsappInstancesFilter && filters.whatsappInstancesFilter.length > 0) {
        // Criar canal para cada instância (máximo 5 para não sobrecarregar)
        const instances = filters.whatsappInstancesFilter.slice(0, 5);
        
        instances.forEach((instanceId, index) => {
          const instanceChannel = supabase
            .channel(`salesfunnel-instance-${instanceId}-${filters.userId}-${Date.now()}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'leads',
                filter: `whatsapp_number_id=eq.${instanceId}`
              },
              handleLeadChange
            )
            .subscribe();
          
          channelsRef.current.push(instanceChannel);
        });
      }
    }
    
    console.log('[SalesFunnel Realtime] 📡 Listeners configurados:', channelsRef.current.length);
    
    // Cleanup
    return () => {
      console.log('[SalesFunnel Realtime] 🔌 Desconectando listeners de leads');
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [
    filters.userId, 
    filters.role, 
    filters.createdByUserId, 
    filters.ownerFilter,
    filters.whatsappInstancesFilter,
    handleLeadChange
  ]);
  
  return {
    isConnected: channelsRef.current.length > 0,
    activeChannels: channelsRef.current.length
  };
};

/**
 * 🔊 LISTENER DE ESTÁGIOS - Mudanças na estrutura do kanban
 */
export const useSalesFunnelStagesListener = () => {
  const filters = useSalesFunnelPageFilters();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const handleStageChange = useCallback((payload: any) => {
    console.log('[Stages Realtime] 📨 Mudança em estágio:', payload);
    
    const record = payload.new || payload.old;
    
    // 🔒 VALIDAÇÃO MULTI-TENANT
    if (!validateStageAccess(record, filters)) {
      console.log('[Stages Realtime] 🚫 Mudança ignorada - sem acesso ao estágio');
      return;
    }
    
    // Invalidar cache de estágios
    queryClient.invalidateQueries({ 
      queryKey: ["salesfunnel-stages", filters.userId] 
    });
    
    // Se for mudança estrutural, invalidar leads também
    if (payload.eventType === 'DELETE') {
      queryClient.invalidateQueries({ 
        queryKey: ["salesfunnel-leads"] 
      });
    }
    
    console.log('[Stages Realtime] ✅ Cache invalidado para estágio');
  }, [filters, queryClient]);
  
  useEffect(() => {
    if (!filters.userId || !filters.role || filters.loading) return;
    
    console.log('[Stages Realtime] 🎧 Configurando listener de estágios');
    
    // 🔒 FILTRO MULTI-TENANT PARA ESTÁGIOS
    if (filters.role === 'admin' && filters.createdByUserId) {
      channelRef.current = supabase
        .channel(`salesfunnel-stages-admin-${filters.userId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kanban_stages',
            filter: `created_by_user_id=eq.${filters.createdByUserId}`
          },
          handleStageChange
        )
        .subscribe();
    } 
    else if (filters.role === 'operational' && filters.assignedFunnelsFilter) {
      // Para operacional, escutar estágios dos funis atribuídos
      // Limitação: só pode filtrar por um campo, então usamos um canal geral
      // e filtramos no callback
      channelRef.current = supabase
        .channel(`salesfunnel-stages-op-${filters.userId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kanban_stages'
          },
          (payload) => {
            const record = payload.new || payload.old;
            // Filtrar manualmente por funis atribuídos
            if (filters.assignedFunnelsFilter?.includes(record?.funnel_id)) {
              handleStageChange(payload);
            }
          }
        )
        .subscribe();
    }
    
    return () => {
      if (channelRef.current) {
        console.log('[Stages Realtime] 🔌 Desconectando listener de estágios');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [filters, handleStageChange]);
  
  return {
    isConnected: !!channelRef.current
  };
};

/**
 * 🔊 LISTENER DE CONFIGURAÇÕES - Configurações do funil
 */
export const useSalesFunnelConfigListener = () => {
  const filters = useSalesFunnelPageFilters();
  const [config, setConfig] = useState<any>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  useEffect(() => {
    if (!filters.userId || !filters.role) return;
    
    const channelName = `salesfunnel-config-${filters.userId}`;
    
    // 🔒 Listener para configurações do usuário
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'salesfunnel_configs',
          filter: `user_id=eq.${filters.userId}`
        },
        (payload) => {
          console.log('[Config Realtime] 📨 Configuração atualizada:', payload);
          
          if (payload.new) {
            setConfig(payload.new);
          }
        }
      )
      .subscribe();
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [filters.userId, filters.role]);
  
  return { config };
};

/**
 * 🔊 LISTENER DE ATIVIDADES - Log de ações do funil
 */
export const useSalesFunnelActivitiesListener = () => {
  const filters = useSalesFunnelPageFilters();
  const [activities, setActivities] = useState<SalesFunnelActivity[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  useEffect(() => {
    if (!filters.userId || !filters.role) return;
    
    const channelName = `salesfunnel-activities-${filters.userId}`;
    
    // 🔒 Listener para atividades relacionadas ao usuário
    let filter = '';
    
    if (filters.role === 'admin') {
      filter = `created_by=eq.${filters.userId}`;
    } else if (filters.role === 'operational') {
      filter = `assigned_to=eq.${filters.userId}`;
    }
    
    if (!filter) return;
    
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'salesfunnel_activities',
          filter
        },
        (payload) => {
          const activity = payload.new as any;
          
          console.log('[Activities Realtime] 📝 Nova atividade:', activity);
          
          setActivities(prev => [{
            id: activity.id,
            type: activity.type,
            description: activity.description,
            leadId: activity.lead_id,
            userId: activity.user_id,
            timestamp: activity.created_at,
            metadata: activity.metadata
          }, ...prev].slice(0, 20)); // Manter últimas 20 atividades
        }
      )
      .subscribe();
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [filters.userId, filters.role]);
  
  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);
  
  return {
    activities,
    clearActivities
  };
};

/**
 * 🔊 LISTENER DE PERFORMANCE - Métricas em tempo real
 */
export const useSalesFunnelPerformanceListener = () => {
  const filters = useSalesFunnelPageFilters();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    leadsCount: 0,
    conversionRate: 0,
    averageTimeInStage: 0,
    lastUpdate: null
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!filters.userId || !filters.role || filters.loading) return;
    
    // Atualizar métricas periodicamente
    const updateMetrics = async () => {
      try {
        // Buscar contadores em tempo real
        let leadsQuery = supabase
          .from('leads')
          .select('id', { count: 'exact' });
        
        // Aplicar filtros multi-tenant
        if (filters.role === 'admin' && filters.createdByUserId) {
          leadsQuery = leadsQuery.eq('created_by_user_id', filters.createdByUserId);
        } else if (filters.role === 'operational' && filters.ownerFilter) {
          leadsQuery = leadsQuery.eq('owner_id', filters.ownerFilter);
        }
        
        const { count } = await leadsQuery;
        
        setMetrics(prev => ({
          ...prev,
          leadsCount: count || 0,
          lastUpdate: new Date()
        }));
        
      } catch (error) {
        console.error('[Performance Realtime] Erro ao atualizar métricas:', error);
      }
    };
    
    // Atualizar imediatamente e depois a cada 30 segundos
    updateMetrics();
    intervalRef.current = setInterval(updateMetrics, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [filters.userId, filters.role, filters.createdByUserId, filters.ownerFilter]);
  
  return metrics;
};

/**
 * 🔊 HOOK AGREGADOR - Combina todos os listeners do SalesFunnel
 */
export const useSalesFunnelPageListeners = () => {
  const leadsListener = useSalesFunnelLeadsListener();
  const stagesListener = useSalesFunnelStagesListener();
  const { config } = useSalesFunnelConfigListener();
  const { activities, clearActivities } = useSalesFunnelActivitiesListener();
  const performanceMetrics = useSalesFunnelPerformanceListener();
  
  return {
    isConnected: leadsListener.isConnected && stagesListener.isConnected,
    activeChannels: leadsListener.activeChannels + (stagesListener.isConnected ? 1 : 0),
    config,
    activities,
    clearActivities,
    performanceMetrics
  };
};

// Tipos auxiliares
interface SalesFunnelActivity {
  id: string;
  type: 'lead_created' | 'lead_moved' | 'lead_updated' | 'lead_deleted' | 'stage_changed';
  description: string;
  leadId?: string;
  userId: string;
  timestamp: string;
  metadata?: any;
}

interface PerformanceMetrics {
  leadsCount: number;
  conversionRate: number;
  averageTimeInStage: number;
  lastUpdate: Date | null;
}