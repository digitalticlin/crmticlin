/**
 * 🔊 LISTENERS ISOLADOS - PÁGINA DASHBOARD
 * Sistema de realtime 100% isolado com proteção multi-tenant
 * CRÍTICO: Todos os listeners filtram por created_by_user_id ou owner_id
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardPageFilters, validateDashboardDataAccess } from "./datafilters";
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * 🔊 LISTENER DE KPIs - Atualização em tempo real das métricas
 */
export const useDashboardKPIsListener = () => {
  const filters = useDashboardPageFilters();
  const queryClient = useQueryClient();
  const channelsRef = useRef<RealtimeChannel[]>([]);
  
  const handleDataChange = useCallback((table: string, payload: any) => {
    console.log(`[Dashboard Realtime] 📨 Mudança em ${table}:`, payload);
    
    const record = payload.new || payload.old;
    
    // 🔒 VALIDAÇÃO MULTI-TENANT
    if (!validateDashboardDataAccess(record, filters)) {
      console.log('[Dashboard Realtime] 🚫 Mudança ignorada - sem acesso ao registro');
      return;
    }
    
    // Invalidar KPIs quando houver mudanças relevantes
    queryClient.invalidateQueries({ 
      queryKey: ["dashboard-kpis", filters.userId] 
    });
    
    // Invalidar gráficos específicos baseado na tabela
    switch (table) {
      case 'leads':
        queryClient.invalidateQueries({ 
          queryKey: ["dashboard-conversion-chart"] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ["dashboard-funnel-chart"] 
        });
        break;
      case 'deals':
        queryClient.invalidateQueries({ 
          queryKey: ["dashboard-revenue-chart"] 
        });
        break;
      case 'tasks':
        queryClient.invalidateQueries({ 
          queryKey: ["dashboard-performance-owner"] 
        });
        break;
    }
    
    console.log(`[Dashboard Realtime] ✅ Cache invalidado para ${table}`);
  }, [filters, queryClient]);
  
  useEffect(() => {
    if (!filters.userId || !filters.role || filters.loading) {
      console.log('[Dashboard Realtime] ⏸️ Listeners não iniciados - aguardando autenticação');
      return;
    }
    
    console.log('[Dashboard Realtime] 🎧 Configurando listeners com proteção multi-tenant');
    
    // Limpar canais anteriores
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
    
    // 🔒 CONFIGURAR LISTENERS COM FILTROS MULTI-TENANT
    
    // 1. Listener para LEADS
    const leadsChannel = supabase.channel(`dashboard-leads-${filters.userId}-${Date.now()}`);
    
    if (filters.role === 'admin' && filters.createdByUserId) {
      leadsChannel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `created_by_user_id=eq.${filters.createdByUserId}`
        },
        (payload) => handleDataChange('leads', payload)
      );
    } else if (filters.role === 'operational' && filters.ownerFilter) {
      leadsChannel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `owner_id=eq.${filters.ownerFilter}`
        },
        (payload) => handleDataChange('leads', payload)
      );
    }
    
    leadsChannel.subscribe();
    channelsRef.current.push(leadsChannel);
    
    // 2. Listener para DEALS
    const dealsChannel = supabase.channel(`dashboard-deals-${filters.userId}-${Date.now()}`);
    
    if (filters.role === 'admin' && filters.createdByUserId) {
      dealsChannel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: `created_by_user_id=eq.${filters.createdByUserId}`
        },
        (payload) => handleDataChange('deals', payload)
      );
    } else if (filters.role === 'operational' && filters.ownerFilter) {
      dealsChannel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: `owner_id=eq.${filters.ownerFilter}`
        },
        (payload) => handleDataChange('deals', payload)
      );
    }
    
    dealsChannel.subscribe();
    channelsRef.current.push(dealsChannel);
    
    // 3. Listener para TASKS
    const tasksChannel = supabase.channel(`dashboard-tasks-${filters.userId}-${Date.now()}`);
    
    if (filters.role === 'admin' && filters.createdByUserId) {
      tasksChannel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `created_by_user_id=eq.${filters.createdByUserId}`
        },
        (payload) => handleDataChange('tasks', payload)
      );
    } else if (filters.role === 'operational') {
      tasksChannel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${filters.userId}`
        },
        (payload) => handleDataChange('tasks', payload)
      );
    }
    
    tasksChannel.subscribe();
    channelsRef.current.push(tasksChannel);
    
    console.log('[Dashboard Realtime] 📡 Listeners configurados:', channelsRef.current.length);
    
    // Cleanup
    return () => {
      console.log('[Dashboard Realtime] 🔌 Desconectando listeners');
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [filters.userId, filters.role, filters.createdByUserId, filters.ownerFilter, handleDataChange]);
  
  return {
    isConnected: channelsRef.current.length > 0,
    activeChannels: channelsRef.current.length
  };
};

/**
 * 🔊 LISTENER DE CONFIGURAÇÕES - Mudanças nas configurações do dashboard
 */
export const useDashboardConfigListener = (onConfigChange?: (config: any) => void) => {
  const filters = useDashboardPageFilters();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  useEffect(() => {
    if (!filters.userId || !filters.role) return;
    
    const channelName = `dashboard-config-${filters.userId}`;
    
    // 🔒 Listener para configurações do usuário
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_configs',
          filter: `user_id=eq.${filters.userId}`
        },
        (payload) => {
          console.log('[Config Realtime] 📨 Configuração atualizada:', payload);
          
          if (onConfigChange && payload.new) {
            onConfigChange(payload.new);
          }
        }
      )
      .subscribe();
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [filters.userId, filters.role, onConfigChange]);
};

/**
 * 🔊 LISTENER DE ALERTAS - Notificações importantes do dashboard
 */
export const useDashboardAlertsListener = () => {
  const filters = useDashboardPageFilters();
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  useEffect(() => {
    if (!filters.userId || !filters.role) return;
    
    const channelName = `dashboard-alerts-${filters.userId}`;
    
    // 🔒 Listener para alertas do usuário
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${filters.userId}`
        },
        (payload) => {
          const alert = payload.new as any;
          
          // Processar apenas alertas do dashboard
          if (alert.context === 'dashboard') {
            console.log('[Alerts Realtime] 🚨 Novo alerta:', alert);
            
            setAlerts(prev => [{
              id: alert.id,
              type: alert.type,
              title: alert.title,
              message: alert.message,
              severity: alert.severity || 'info',
              timestamp: alert.created_at
            }, ...prev].slice(0, 5)); // Manter últimos 5 alertas
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
  
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);
  
  return {
    alerts,
    dismissAlert
  };
};

/**
 * 🔊 LISTENER DE PERFORMANCE - Monitoramento em tempo real
 */
export const useDashboardPerformanceListener = () => {
  const filters = useDashboardPageFilters();
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    activeUsers: 0,
    responseTime: 0,
    errorRate: 0,
    lastUpdate: null
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!filters.userId || !filters.role || filters.role !== 'admin') return;
    
    // Simular métricas de performance (em produção, viria de um serviço)
    const updateMetrics = () => {
      setPerformanceMetrics({
        activeUsers: Math.floor(Math.random() * 50) + 10,
        responseTime: Math.random() * 200 + 50,
        errorRate: Math.random() * 5,
        lastUpdate: new Date()
      });
    };
    
    // Atualizar a cada 30 segundos
    updateMetrics();
    intervalRef.current = setInterval(updateMetrics, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [filters.userId, filters.role]);
  
  return performanceMetrics;
};

/**
 * 🔊 HOOK AGREGADOR - Combina todos os listeners do dashboard
 */
export const useDashboardPageListeners = () => {
  const kpisListener = useDashboardKPIsListener();
  const { alerts, dismissAlert } = useDashboardAlertsListener();
  const performanceMetrics = useDashboardPerformanceListener();
  
  const [config, setConfig] = useState<any>(null);
  
  useDashboardConfigListener((newConfig) => {
    setConfig(newConfig);
  });
  
  return {
    isConnected: kpisListener.isConnected,
    activeChannels: kpisListener.activeChannels,
    alerts,
    dismissAlert,
    config,
    performanceMetrics
  };
};

// Tipos auxiliares
interface DashboardAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  severity: string;
  timestamp: string;
}

interface PerformanceMetrics {
  activeUsers: number;
  responseTime: number;
  errorRate: number;
  lastUpdate: Date | null;
}