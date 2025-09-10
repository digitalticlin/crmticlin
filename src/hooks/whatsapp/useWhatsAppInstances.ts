/**
 * 🎯 HOOK ISOLADO PARA INSTÂNCIAS WHATSAPP
 * 
 * RESPONSABILIDADES:
 * ✅ Gerenciar instâncias WhatsApp
 * ✅ Health check isolado 
 * ✅ Cache próprio da feature
 * ✅ Reconexão automática
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WhatsAppInstance {
  id: string;
  instance_name: string;
  connection_type: string;
  server_url?: string;
  vps_instance_id?: string;
  web_status?: string;
  connection_status: string;
  qr_code?: string;
  phone?: string;
  profile_name?: string;
  profile_pic_url?: string;
  date_connected?: string;
  date_disconnected?: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
  created_by_user_id?: string;
}

interface UseWhatsAppInstancesReturn {
  instances: WhatsAppInstance[];
  activeInstance: WhatsAppInstance | null;
  isLoading: boolean;
  error: string | null;
  connectedInstances: number;
  totalInstances: number;
  healthScore: number;
  isHealthy: boolean;
  refetch: () => void;
  getInstanceById: (id: string) => WhatsAppInstance | null;
  getInstanceForLead: (leadId: string, whatsappNumberId?: string) => WhatsAppInstance | null;
}

const CACHE_DURATION = 30000; // 30 segundos

export const useWhatsAppInstances = (): UseWhatsAppInstancesReturn => {
  const { user } = useAuth();
  
  // Estados isolados da feature
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache isolado da feature
  const cache = useRef<{
    instances: WhatsAppInstance[];
    activeInstance: WhatsAppInstance | null;
    timestamp: number;
  }>({
    instances: [],
    activeInstance: null,
    timestamp: 0
  });
  
  // Sistema de reconexão isolado
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const baseDelay = 1000;
  
  // Throttling isolado
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdate = useRef<boolean>(false);

  // Buscar instâncias (isolado) com filtro multitenant
  const fetchInstances = useCallback(async () => {
    if (!user?.id) {
      setInstances([]);
      cache.current = { instances: [], activeInstance: null, timestamp: 0 };
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[WhatsApp Instances] 🔍🔍🔍 VERSÃO 2.0 MULTITENANT - Buscando instâncias para usuário:', user.id);
      console.warn('🔥 HOOK WHATSAPP INSTANCES MULTITENANT V2.0 CARREGADO! 🔥');

      // 1. Buscar role do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, created_by_user_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        console.error('[WhatsApp Instances] ❌ Profile não encontrado');
        setInstances([]);
        return;
      }

      console.log('[WhatsApp Instances] 👤 Role do usuário:', profile.role);

      let validInstances: WhatsAppInstance[] = [];

      if (profile.role === 'admin') {
        // Admin: vê instâncias que criou
        console.log('[WhatsApp Instances] 🔑 Aplicando filtro ADMIN');
        
        const { data, error } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('connection_type', 'web')
          .eq('created_by_user_id', user.id)
          .in('connection_status', ['connected', 'ready', 'connecting', 'disconnected'])
          .order('connection_status', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        validInstances = data || [];

      } else {
        // Operacional: vê instâncias através de user_whatsapp_numbers
        console.log('[WhatsApp Instances] 🔒 Aplicando filtro OPERACIONAL');
        
        const { data: userWhatsAppNumbers } = await supabase
          .from('user_whatsapp_numbers')
          .select('whatsapp_number_id')
          .eq('profile_id', user.id);

        if (!userWhatsAppNumbers || userWhatsAppNumbers.length === 0) {
          console.log('[WhatsApp Instances] ⚠️ Usuário operacional sem instâncias atribuídas');
          validInstances = [];
        } else {
          const whatsappIds = userWhatsAppNumbers.map(uwn => uwn.whatsapp_number_id);
          console.log('[WhatsApp Instances] 🎯 IDs de instâncias vinculadas:', whatsappIds);
          
          const { data, error } = await supabase
            .from('whatsapp_instances')
            .select('*')
            .eq('connection_type', 'web')
            .in('id', whatsappIds)
            .in('connection_status', ['connected', 'ready', 'connecting', 'disconnected'])
            .order('connection_status', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(20);

          if (error) throw error;
          validInstances = data || [];
        }
      }

      // Atualizar cache isolado
      const activeInstance = validInstances.find(i => 
        i.connection_status === 'connected' || i.connection_status === 'ready'
      ) || null;

      cache.current = {
        instances: validInstances,
        activeInstance,
        timestamp: Date.now()
      };

      setInstances(validInstances);
      
      console.log('[WhatsApp Instances] ✅ Instâncias carregadas:', {
        total: validInstances.length,
        connected: validInstances.filter(i => 
          i.connection_status === 'connected' || i.connection_status === 'ready'
        ).length,
        instances: validInstances.map(i => ({
          id: i.id,
          name: i.instance_name,
          status: i.connection_status
        })),
        activeInstance: activeInstance ? {
          id: activeInstance.id,
          name: activeInstance.instance_name,
          status: activeInstance.connection_status
        } : null
      });

    } catch (error: any) {
      console.error('[WhatsApp Instances] ❌ Erro ao carregar instâncias:', error);
      setError(error.message);
      
      if (error.message?.includes('Failed to fetch')) {
        attemptReconnection();
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Sistema de reconexão isolado
  const attemptReconnection = useCallback(async () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('[WhatsApp Instances] ❌ Máximo de tentativas de reconexão atingido');
      setError('Falha na reconexão após múltiplas tentativas');
      return;
    }

    const delay = baseDelay * Math.pow(2, reconnectAttempts.current);
    reconnectAttempts.current++;
    
    console.log(`[WhatsApp Instances] 🔄 Tentativa de reconexão ${reconnectAttempts.current}/${maxReconnectAttempts} em ${delay}ms`);
    
    setTimeout(async () => {
      try {
        await fetchInstances();
        reconnectAttempts.current = 0;
        console.log('[WhatsApp Instances] ✅ Reconexão bem-sucedida');
      } catch (error) {
        console.error('[WhatsApp Instances] ❌ Falha na reconexão:', error);
        attemptReconnection();
      }
    }, delay);
  }, [fetchInstances]);

  // Throttling isolado
  const throttledFetch = useCallback(() => {
    if (throttleRef.current) {
      pendingUpdate.current = true;
      return;
    }
    
    throttleRef.current = setTimeout(() => {
      fetchInstances();
      throttleRef.current = null;
      
      if (pendingUpdate.current) {
        pendingUpdate.current = false;
        throttledFetch();
      }
    }, 1000);
  }, [fetchInstances]);

  // Handler para realtime isolado (multitenant)
  const handleRealtimeUpdate = useCallback((payload: any) => {
    if (!user?.id) return;

    // Para updates realtime, vamos invalidar cache e refetch
    // A lógica multitenant será aplicada no fetchInstances
    console.log('[WhatsApp Instances] 🔄 Realtime update recebido, invalidando cache');
    
    // Invalidar cache
    cache.current = { instances: [], activeInstance: null, timestamp: 0 };
    
    // Usar throttling
    throttledFetch();
  }, [user?.id, throttledFetch]);

  // Métodos isolados
  const getInstanceById = useCallback((id: string): WhatsAppInstance | null => {
    if (!user?.id) return null;
    
    // Verificar cache primeiro
    const now = Date.now();
    if (now - cache.current.timestamp < CACHE_DURATION) {
      return cache.current.instances.find(i => i.id === id) || null;
    }
    
    return instances.find(i => i.id === id) || null;
  }, [instances, user?.id]);

  const getInstanceForLead = useCallback((leadId: string, whatsappNumberId?: string): WhatsAppInstance | null => {
    if (!user?.id) return null;
    
    if (whatsappNumberId) {
      const specific = getInstanceById(whatsappNumberId);
      if (specific && (specific.connection_status === 'connected' || specific.connection_status === 'ready')) {
        return specific;
      }
    }
    
    return activeInstance;
  }, [user?.id, getInstanceById]);

  // Instância ativa isolada
  const activeInstance = useMemo(() => {
    if (!user?.id) return null;
    
    // Usar cache se válido
    const now = Date.now();
    if (now - cache.current.timestamp < CACHE_DURATION && cache.current.activeInstance) {
      return cache.current.activeInstance;
    }
    
    return instances.find(i => 
      i.connection_status === 'connected' || i.connection_status === 'ready'
    ) || null;
  }, [instances, user?.id]);

  // Estatísticas isoladas
  const { connectedInstances, totalInstances, healthScore, isHealthy } = useMemo(() => {
    const connected = instances.filter(i => 
      i.connection_status === 'connected' || i.connection_status === 'ready'
    ).length;
    
    const total = instances.length;
    const score = total === 0 ? 0 : Math.round((connected / total) * 100);
    const healthy = score >= 70;

    return {
      connectedInstances: connected,
      totalInstances: total,
      healthScore: score,
      isHealthy: healthy
    };
  }, [instances]);

  // Refetch isolado
  const refetch = useCallback(() => {
    throttledFetch();
  }, [throttledFetch]);

  // Effect para carregar instâncias
  useEffect(() => {
    if (user?.id) {
      fetchInstances();
    }
  }, [user?.id, fetchInstances]);

  // Realtime subscription isolada
  useEffect(() => {
    if (!user?.id) return;

    console.log('[WhatsApp Instances] 📡 Configurando realtime para instâncias');

    const channel = supabase
      .channel(`whatsapp_instances_isolated_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `created_by_user_id=eq.${user.id}`
        },
        handleRealtimeUpdate
      )
      .subscribe((status) => {
        console.log('[WhatsApp Instances] 📡 Status da subscription:', status);
        
        if (status === 'CHANNEL_ERROR') {
          attemptReconnection();
        }
        
        if (status === 'SUBSCRIBED') {
          reconnectAttempts.current = 0;
        }
      });

    return () => {
      console.log('[WhatsApp Instances] 🔌 Removendo subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleRealtimeUpdate, attemptReconnection]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, []);

  return {
    instances,
    activeInstance,
    isLoading,
    error,
    connectedInstances,
    totalInstances,
    healthScore,
    isHealthy,
    refetch,
    getInstanceById,
    getInstanceForLead
  };
};