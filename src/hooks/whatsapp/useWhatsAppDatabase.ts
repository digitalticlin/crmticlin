
/**
 * 🚀 HOOK DATABASE CORRIGIDO - MULTITENANCY E CACHE INTELIGENTE
 * 
 * CORREÇÕES APLICADAS:
 * ✅ Cache inteligente para instâncias ativas
 * ✅ Validação rigorosa de multitenancy
 * ✅ Sistema de throttling para atualizações em massa
 * ✅ Conexão direta com useAuth
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

// 🚀 CORREÇÃO: Interface para payload do realtime corrigida
interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: WhatsAppInstance | null;
  old?: WhatsAppInstance | null;
}

export const useWhatsAppDatabase = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth(); // 🚀 CORREÇÃO: Conectar diretamente ao useAuth
  
  // 🚀 CORREÇÃO: Cache inteligente para instâncias ativas
  const activeInstanceCache = useRef<{ [key: string]: WhatsAppInstance }>({});
  const cacheTimestamp = useRef<number>(0);
  const cacheValidityMs = 30000; // 30 segundos
  
  // 🚀 CORREÇÃO: Throttling para atualizações em massa
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdate = useRef<boolean>(false);

  // 🚀 CORREÇÃO: Sistema de reconexão com backoff exponencial
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const baseDelay = 1000; // 1 segundo

  // 🚀 CORREÇÃO: Queue para mensagens perdidas durante desconexões
  const messageQueue = useRef<any[]>([]);
  const isProcessingQueue = useRef<boolean>(false);

  // 🚀 CORREÇÃO: Definir fetchInstances primeiro para resolver dependência circular
  const fetchInstances = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 🚀 CORREÇÃO: Validação rigorosa de usuário
      if (!user?.id) {
        console.warn('[WhatsApp Database] ⚠️ Usuário não autenticado, limpando instâncias');
        setInstances([]);
        activeInstanceCache.current = {};
        return;
      }

      console.log('[WhatsApp Database] 🔍 Buscando instâncias para usuário:', {
        userId: user.id,
        userEmail: user.email
      });

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .eq('created_by_user_id', user.id) // 🚀 CORREÇÃO: Filtro rigoroso
        .in('connection_status', ['connected', 'ready', 'connecting', 'disconnected'])
        .order('connection_status', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const instancesData = data || [];
      
      // 🚀 CORREÇÃO: Validação dupla de ownership
      const validInstances = instancesData.filter(instance => {
        if (instance.created_by_user_id !== user.id) {
          console.warn('[WhatsApp Database] 🚨 Instância com ownership inválido detectada:', {
            instanceId: instance.id,
            instanceOwner: instance.created_by_user_id,
            currentUser: user.id
          });
          return false;
        }
        return true;
      });
      
      // 🚀 CORREÇÃO: Atualizar cache inteligente
      activeInstanceCache.current = {};
      validInstances.forEach(instance => {
        if (instance.connection_status === 'connected' || instance.connection_status === 'ready') {
          activeInstanceCache.current[instance.id] = instance;
        }
      });
      cacheTimestamp.current = Date.now();
      
      console.log('[WhatsApp Database] ✅ Instâncias validadas e carregadas:', {
        userId: user.id,
        userEmail: user.email,
        totalInstances: validInstances.length,
        connectedInstances: validInstances.filter(i => 
          i.connection_status === 'connected' || i.connection_status === 'ready'
        ).length,
        cachedActiveInstances: Object.keys(activeInstanceCache.current).length
      });
      
      setInstances(validInstances);
      
    } catch (error: any) {
      console.error('[WhatsApp Database] ❌ Erro ao carregar instâncias:', error);
      setError(error.message);
      
      // 🚀 CORREÇÃO: Tentar reconexão em caso de erro de rede
      if (error.message?.includes('Failed to fetch') || error.code === 'PGRST301') {
        attemptReconnection();
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email]);

  const throttledFetchInstances = useCallback(() => {
    if (throttleRef.current) {
      pendingUpdate.current = true;
      return;
    }
    
    throttleRef.current = setTimeout(() => {
      fetchInstances();
      throttleRef.current = null;
      
      if (pendingUpdate.current) {
        pendingUpdate.current = false;
        throttledFetchInstances();
      }
    }, 1000); // Throttle de 1 segundo
  }, [fetchInstances]);

  // 🚀 CORREÇÃO: Processar queue de mensagens perdidas
  const processMessageQueue = useCallback(async () => {
    if (isProcessingQueue.current || messageQueue.current.length === 0) return;
    
    isProcessingQueue.current = true;
    console.log('[WhatsApp Database] 🔄 Processando queue de mensagens perdidas:', messageQueue.current.length);
    
    try {
      // Processar todas as mensagens na queue
      for (const queuedPayload of messageQueue.current) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Pequeno delay entre processamentos
        // Reprocessar o payload
        handleRealtimeUpdate(queuedPayload);
      }
      
      // Limpar queue após processamento
      messageQueue.current = [];
      console.log('[WhatsApp Database] ✅ Queue processada com sucesso');
      
    } catch (error) {
      console.error('[WhatsApp Database] ❌ Erro ao processar queue:', error);
    } finally {
      isProcessingQueue.current = false;
    }
  }, []);

  // 🚀 CORREÇÃO: Sistema de reconexão automática
  const attemptReconnection = useCallback(async () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('[WhatsApp Database] ❌ Máximo de tentativas de reconexão atingido');
      setError('Falha na reconexão após múltiplas tentativas');
      return;
    }

    const delay = baseDelay * Math.pow(2, reconnectAttempts.current);
    reconnectAttempts.current++;
    
    console.log(`[WhatsApp Database] 🔄 Tentativa de reconexão ${reconnectAttempts.current}/${maxReconnectAttempts} em ${delay}ms`);
    
    setTimeout(async () => {
      try {
        await fetchInstances();
        reconnectAttempts.current = 0; // Reset em caso de sucesso
        console.log('[WhatsApp Database] ✅ Reconexão bem-sucedida');
        
        // Processar queue de mensagens perdidas
        await processMessageQueue();
        
      } catch (error) {
        console.error('[WhatsApp Database] ❌ Falha na reconexão:', error);
        attemptReconnection(); // Tentar novamente
      }
    }, delay);
  }, [fetchInstances, processMessageQueue]);

  // 🚀 CORREÇÃO: Handler para updates do realtime com tipagem corrigida
  const handleRealtimeUpdate = useCallback((payload: any) => {
    if (!user?.id) return;

    console.log('[WhatsApp Database] 📱 Realtime update para usuário:', {
      userId: user.id,
      event: payload.eventType,
      instanceId: payload.new?.id || payload.old?.id
    });
    
    // 🚀 CORREÇÃO: Validação dupla de ownership com tipagem mais flexível
    const instanceData = payload.new || payload.old;
    if (instanceData && instanceData.created_by_user_id !== user.id) {
      console.warn('[WhatsApp Database] 🚨 Tentativa de update cross-user bloqueada:', {
        instanceOwner: instanceData.created_by_user_id,
        currentUser: user.id,
        instanceId: instanceData.id
      });
      return;
    }
    
    // Invalidar cache
    activeInstanceCache.current = {};
    
    // 🚀 CORREÇÃO: Usar throttling para updates
    throttledFetchInstances();
  }, [user?.id, throttledFetchInstances]);

  // 🚀 CORREÇÃO: getActiveInstance com cache inteligente
  const getActiveInstance = useMemo(() => {
    return (): WhatsAppInstance | null => {
      if (!user?.id) return null;
      
      // 🚀 CORREÇÃO: Usar cache se válido
      const now = Date.now();
      if (now - cacheTimestamp.current < cacheValidityMs) {
        const cachedInstances = Object.values(activeInstanceCache.current);
        if (cachedInstances.length > 0) {
          const activeInstance = cachedInstances[0];
          console.log('[WhatsApp Database] 🚀 Usando cache para instância ativa:', {
            instanceId: activeInstance.id,
            instanceName: activeInstance.instance_name,
            cacheAge: now - cacheTimestamp.current
          });
          return activeInstance;
        }
      }
      
      // Fallback para busca na lista
      const activeInstance = instances.find(i => 
        i.connection_status === 'connected' || 
        i.connection_status === 'ready'
      );
      
      if (activeInstance) {
        console.log('[WhatsApp Database] 🎯 Instância ativa encontrada:', {
          instanceId: activeInstance.id,
          instanceName: activeInstance.instance_name,
          status: activeInstance.connection_status,
          owner: activeInstance.created_by_user_id,
          currentUser: user.id,
          isCorrectOwner: activeInstance.created_by_user_id === user.id
        });
        
        // 🚀 CORREÇÃO: Validação dupla de ownership
        if (activeInstance.created_by_user_id !== user.id) {
          console.error('[WhatsApp Database] 🚨 ERRO DE SEGURANÇA: Instância não pertence ao usuário!', {
            instanceOwner: activeInstance.created_by_user_id,
            currentUser: user.id,
            instanceName: activeInstance.instance_name
          });
          return null;
        }
        
        // Atualizar cache
        activeInstanceCache.current[activeInstance.id] = activeInstance;
        cacheTimestamp.current = Date.now();
      }
      
      return activeInstance || null;
    };
  }, [instances, user?.id]);

  // 🚀 CORREÇÃO: getInstanceForLead com cache inteligente
  const getInstanceForLead = useMemo(() => {
    return (leadId: string, whatsappNumberId?: string): WhatsAppInstance | null => {
      if (!user?.id) return null;
      
      // Se leadId tem whatsappNumberId, buscar instância específica
      if (whatsappNumberId) {
        // 🚀 CORREÇÃO: Verificar cache primeiro
        const cachedInstance = activeInstanceCache.current[whatsappNumberId];
        if (cachedInstance && Date.now() - cacheTimestamp.current < cacheValidityMs) {
          console.log('[WhatsApp Database] 🚀 Usando cache para instância específica:', {
            leadId,
            instanceId: cachedInstance.id,
            instanceName: cachedInstance.instance_name
          });
          return cachedInstance;
        }
        
        const specificInstance = instances.find(i => 
          i.id === whatsappNumberId && 
          i.created_by_user_id === user.id &&
          (i.connection_status === 'connected' || i.connection_status === 'ready')
        );
        
        if (specificInstance) {
          console.log('[WhatsApp Database] 🎯 Instância específica para lead:', {
            leadId,
            instanceId: specificInstance.id,
            instanceName: specificInstance.instance_name,
            status: specificInstance.connection_status
          });
          
          // Atualizar cache
          activeInstanceCache.current[specificInstance.id] = specificInstance;
          cacheTimestamp.current = Date.now();
          
          return specificInstance;
        }
      }
      
      // Fallback: usar instância ativa do usuário
      return getActiveInstance();
    };
  }, [instances, user?.id, getActiveInstance]);

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

  const refetch = useCallback(() => {
    throttledFetchInstances();
  }, [throttledFetchInstances]);

  // 🚀 CORREÇÃO: Fetch apenas quando usuário autenticado
  useEffect(() => {
    if (user?.id) {
      fetchInstances();
    } else {
      setInstances([]);
      activeInstanceCache.current = {};
      setIsLoading(false);
    }
  }, [user?.id, fetchInstances]);

  // 🚀 CORREÇÃO: Realtime subscription com validação rigorosa e reconexão
  useEffect(() => {
    if (!user?.id) return;

    console.log('[WhatsApp Database] 📡 Configurando realtime para usuário:', user.id);

    const channel = supabase
      .channel(`whatsapp_instances_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `created_by_user_id=eq.${user.id}` // 🚀 CORREÇÃO: Filtro rigoroso
        },
        (payload) => {
          // 🚀 CORREÇÃO: Verificar se a conexão está ativa
          if (channel.state === 'closed') {
            console.warn('[WhatsApp Database] ⚠️ Canal fechado, adicionando à queue');
            messageQueue.current.push(payload);
            return;
          }
          
          // 🚀 CORREÇÃO: Converter payload do Supabase para nossa interface
          const convertedPayload = {
            eventType: payload.eventType,
            new: payload.new as WhatsAppInstance | null,
            old: payload.old as WhatsAppInstance | null
          };
          
          handleRealtimeUpdate(convertedPayload);
        }
      )
      .subscribe((status) => {
        console.log('[WhatsApp Database] 📡 Status da subscription:', status);
        
        if (status === 'CHANNEL_ERROR') {
          console.error('[WhatsApp Database] ❌ Erro no canal, tentando reconexão');
          attemptReconnection();
        }
        
        if (status === 'SUBSCRIBED') {
          reconnectAttempts.current = 0; // Reset counter on successful connection
          console.log('[WhatsApp Database] ✅ Subscription ativa');
        }
      });

    // 🚀 CORREÇÃO: Heartbeat para detectar conexões mortas
    const heartbeatInterval = setInterval(() => {
      if (channel.state === 'closed') {
        console.warn('[WhatsApp Database] 💔 Conexão morta detectada, tentando reconexão');
        attemptReconnection();
      }
    }, 30000); // Check a cada 30 segundos

    return () => {
      console.log('[WhatsApp Database] 🔌 Removendo subscription para usuário:', user.id);
      clearInterval(heartbeatInterval);
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleRealtimeUpdate, attemptReconnection]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, []);

  return {
    instances,
    isLoading,
    error,
    getActiveInstance,
    getInstanceForLead,
    connectedInstances,
    totalInstances,
    healthScore,
    isHealthy,
    refetch,
    // 🚀 CORREÇÃO: Expor estatísticas de cache e conexão
    cacheStats: {
      activeInstancesCount: Object.keys(activeInstanceCache.current).length,
      cacheAge: Date.now() - cacheTimestamp.current,
      isCacheValid: Date.now() - cacheTimestamp.current < cacheValidityMs,
      reconnectAttempts: reconnectAttempts.current,
      queuedMessages: messageQueue.current.length
    }
  };
};
